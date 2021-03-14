# iOS内存管理引用计数

object对象被添加到autoreleasepool中,什么时候释放的?

object的引用计数存放在哪?

### autoreleasepool

每个runloop在运行的时候都会创建一个autoreleasepool,在runloop休眠的时候释放对象到岗哨对象(nil).

### object的引用技术存放在哪

在64位中,引用计数可以直接存在优化后的isa指针中

```Swift

union isa_t { // 联合体
    isa_t() { }
    isa_t(uintptr_t value) : bits(value) { }

    Class cls;
    uintptr_t bits;
    struct {
        uintptr_t nonpointer        : 1;                                         \
        uintptr_t has_assoc         : 1;                                         \
        uintptr_t has_cxx_dtor      : 1;                                         \
        uintptr_t shiftcls          : 44; /*MACH_VM_MAX_ADDRESS 0x7fffffe00000*/ \
        uintptr_t magic             : 6;                                         \
        uintptr_t weakly_referenced : 1;                                         \
        uintptr_t deallocating      : 1;                                         \
        uintptr_t has_sidetable_rc  : 1;                                         \
        uintptr_t extra_rc          : 8 // 引用计数
    };  
};

```

查看retainCount的实现

```Swift

objc_object::rootRetainCount()
{
    if (isTaggedPointer()) return (uintptr_t)this; // 是否taggedPointer

    sidetable_lock(); // 线程锁
    isa_t bits = LoadExclusive(&isa.bits); // 获取isa的bits
    ClearExclusive(&isa.bits);
    if (bits.nonpointer) { // bits 是不是nonpointer
        uintptr_t rc = 1 + bits.extra_rc; // extra_rc + 1
        if (bits.has_sidetable_rc) { // 是不是使用了sidetable表保存引用计数
            rc += sidetable_getExtraRC_nolock(); // 获取sidetable表中保存的对象引用计数
        }
        sidetable_unlock(); // 解锁
        return rc; // 返回计数
    }

    sidetable_unlock(); // 解锁
    // 如果不是nonpointer
    return sidetable_retainCount();
}

size_t 
objc_object::sidetable_getExtraRC_nolock()
{
    ASSERT(isa.nonpointer); // isa是nonpointer优化
    SideTable& table = SideTables()[this]; // 包含当前对象的sideTable
    RefcountMap::iterator it = table.refcnts.find(this); // 找到对象对应的RefcountMap
    if (it == table.refcnts.end()) return 0;
    else return it->second >> SIDE_TABLE_RC_SHIFT;
}

// RefcountMap disguises its pointers because we 
// don't want the table to act as a root for `leaks`.
typedef objc::DenseMap<DisguisedPtr<objc_object>,size_t,RefcountMapValuePurgeable> RefcountMap;

uintptr_t
objc_object::sidetable_retainCount()
{
    SideTable& table = SideTables()[this]; // 通过对象为键, 获取sideTables中含有该对象的sideTable

    size_t refcnt_result = 1; // 1
    
    table.lock(); // 线程锁
    RefcountMap::iterator it = table.refcnts.find(this); // 找到该对象在sideTable中refcnts的对应
    if (it != table.refcnts.end()) { // 如果不是..
        // this is valid for SIDE_TABLE_RC_PINNED too
        refcnt_result += it->second >> SIDE_TABLE_RC_SHIFT; // SIDE_TABLE_RC_SHIFT = 2
    }
    table.unlock(); // 解锁
    return refcnt_result;
}
      
```

在给对象的引用计数+1的时候, rootRetainCount会读取对象的isa指针中的bits.

1. 如果bits中是`nonpointer`,说明isa指针开启了优化,不只是对线地址,还包含了类信息,对象的引用计数等.

通过bits中的`extra_rc+1`,同时检查bits是否使用了`has_sidetable_rc`,1则是使用了sidetable表来保存了引用计数,再+上从sidetable中找到的计数,返回计数.

2. 如果不是`nonpointer`优化过的isa指针,sideTables数组中找到含有该对象的sideTable.返回计数.

### SideTable是什么?

上面看到对象的引用计数有一部分被放到SideTable中,sideTable是什么?

程序启动会创建64个sideTable放到SideTables数组中.

```Swift

struct SideTable {
    spinlock_t slock;   // 自旋锁
    RefcountMap refcnts;    // 保存对象引用计数的Map
    weak_table_t weak_table;    // 弱引用表

    SideTable() {   // 构造函数
        memset(&weak_table, 0, sizeof(weak_table));
    }

    ~SideTable() {  // 析构函数
        _objc_fatal("Do not delete SideTable.");
    }

    void lock() { slock.lock(); }   // 加锁
    void unlock() { slock.unlock(); }   // 解锁
    void forceReset() { slock.forceReset(); }

    // Address-ordered lock discipline for a pair of side tables.

    template<HaveOld, HaveNew>
    static void lockTwo(SideTable *lock1, SideTable *lock2);
    template<HaveOld, HaveNew>
    static void unlockTwo(SideTable *lock1, SideTable *lock2);
};

```

可以看到SideTable还包含了弱引用表.

### 引用计数+1的时候进行了什么过程?

```Swift

ALWAYS_INLINE id 
objc_object::rootRetain(bool tryRetain, bool handleOverflow)
{
    if (isTaggedPointer()) return (id)this; //如果是taggedPointer,则没有操作

    bool sideTableLocked = false;
    bool transcribeToSideTable = false;

    isa_t oldisa;
    isa_t newisa;

    do {
        transcribeToSideTable = false;
        oldisa = LoadExclusive(&isa.bits);
        newisa = oldisa;
        if (slowpath(!newisa.nonpointer)) {
            ClearExclusive(&isa.bits);
            if (rawISA()->isMetaClass()) return (id)this;
            if (!tryRetain && sideTableLocked) sidetable_unlock();
            if (tryRetain) return sidetable_tryRetain() ? (id)this : nil;
            else return sidetable_retain();
        }
        // don't check newisa.fast_rr; we already called any RR overrides
        if (slowpath(tryRetain && newisa.deallocating)) {
            ClearExclusive(&isa.bits);
            if (!tryRetain && sideTableLocked) sidetable_unlock();
            return nil;
        }
        uintptr_t carry;
        newisa.bits = addc(newisa.bits, RC_ONE, 0, &carry);  // extra_rc++

        if (slowpath(carry)) {
            // newisa.extra_rc++ overflowed
            if (!handleOverflow) {
                ClearExclusive(&isa.bits);
                return rootRetain_overflow(tryRetain);
            }
            // Leave half of the retain counts inline and 
            // prepare to copy the other half to the side table.
            if (!tryRetain && !sideTableLocked) sidetable_lock();
            sideTableLocked = true;
            transcribeToSideTable = true;
            newisa.extra_rc = RC_HALF;
            newisa.has_sidetable_rc = true;
        }
    } while (slowpath(!StoreExclusive(&isa.bits, oldisa.bits, newisa.bits)));

    if (slowpath(transcribeToSideTable)) {
        // Copy the other half of the retain counts to the side table.
        sidetable_addExtraRC_nolock(RC_HALF);
    }

    if (slowpath(!tryRetain && sideTableLocked)) sidetable_unlock();
    return (id)this;
}

```

可以看到`extra_rc++`的注释.

### weak修饰的对象进行了什么操作?

__weak修饰的对象初始化会调用`objc_initWeak`.

```Swift

d
objc_initWeak(id *location, id newObj)
{
    if (!newObj) {
        *location = nil;
        return nil;
    }

    return storeWeak<DontHaveOld, DoHaveNew, DoCrashIfDeallocating>
        (location, (objc_object*)newObj);
}

static id 
storeWeak(id *location, objc_object *newObj)
{
    ASSERT(haveOld  ||  haveNew);
    if (!haveNew) ASSERT(newObj == nil); //obj非空判断

    Class previouslyInitializedClass = nil;
    id oldObj;
    SideTable *oldTable;
    SideTable *newTable;

    // Acquire locks for old and new values.
    // Order by lock address to prevent lock ordering problems. 
    // Retry if the old value changes underneath us.
 retry:
    if (haveOld) { // 有旧值
        oldObj = *location;
        oldTable = &SideTables()[oldObj];
    } else {
        oldTable = nil;
    }
    if (haveNew) {  // 有新值
        newTable = &SideTables()[newObj];
    } else {
        newTable = nil;
    }

    SideTable::lockTwo<haveOld, haveNew>(oldTable, newTable);   // 加锁

    if (haveOld  &&  *location != oldObj) {
        SideTable::unlockTwo<haveOld, haveNew>(oldTable, newTable);
        goto retry;
    }

    if (haveNew  &&  newObj) {
        Class cls = newObj->getIsa();// 类对象
        if (cls != previouslyInitializedClass  &&  
            !((objc_class *)cls)->isInitialized())  // obj没有初始化
        {
            SideTable::unlockTwo<haveOld, haveNew>(oldTable, newTable);
            class_initialize(cls, (id)newObj);  // obj初始化

            previouslyInitializedClass = cls;

            goto retry;
        }
    }

    // Clean up old value, if any.
    if (haveOld) {
        weak_unregister_no_lock(&oldTable->weak_table, oldObj, location);
    }

    // Assign new value, if any.
    if (haveNew) {
        newObj = (objc_object *)
            weak_register_no_lock(&newTable->weak_table, (id)newObj, location, 
                                  crashIfDeallocating);
        // weak_register_no_lock returns nil if weak store should be rejected

        // Set is-weakly-referenced bit in refcount table.
        if (newObj  &&  !newObj->isTaggedPointer()) {
            newObj->setWeaklyReferenced_nolock();
        }

        // Do not set *location anywhere else. That would introduce a race.
        *location = (id)newObj;
    }
    else {
        // No new value. The storage is not changed.
    }
    
    SideTable::unlockTwo<haveOld, haveNew>(oldTable, newTable);

    return (id)newObj;
}

inline void
objc_object::setWeaklyReferenced_nolock()
{
 retry:
    isa_t oldisa = LoadExclusive(&isa.bits);
    isa_t newisa = oldisa;
    if (slowpath(!newisa.nonpointer)) {
        ClearExclusive(&isa.bits);
        sidetable_setWeaklyReferenced_nolock();
        return;
    }
    if (newisa.weakly_referenced) {
        ClearExclusive(&isa.bits);
        return;
    }
    newisa.weakly_referenced = true;
    if (!StoreExclusive(&isa.bits, oldisa.bits, newisa.bits)) goto retry;
}

```

obj被添加到weak_table中,同时如果weakly_referenced为0时改为1.




