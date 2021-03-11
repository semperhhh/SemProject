### iOS 内存管理AutoreleasePool

_objc_autoreleasePoolPrint();

#### 构建函数

```Swift

AutoreleasePoolPage(AutoreleasePoolPage *newParent) :
    AutoreleasePoolPageData(begin(),
                            objc_thread_self(),
                            newParent,
                            newParent ? 1+newParent->depth : 0,
                            newParent ? newParent->hiwat : 0)
{ 
    if (parent) {
        parent->check();
        ASSERT(!parent->child);
        parent->unprotect();
        parent->child = this;
        parent->protect();
    }
    protect();
}


struct AutoreleasePoolPageData
{
    magic_t const magic;                // 检查是否结构完整
    __unsafe_unretained id *next;       // 最后一个对象的下一个位置
    pthread_t const thread;             // 当前线程
    AutoreleasePoolPage * const parent; // 父节点
    AutoreleasePoolPage *child;         // 子节点
    uint32_t const depth;               // 深度 0-1
    uint32_t hiwat;

    AutoreleasePoolPageData(__unsafe_unretained id* _next, pthread_t _thread, AutoreleasePoolPage* _parent, uint32_t _depth, uint32_t _hiwat)
        : magic(), next(_next), thread(_thread),
          parent(_parent), child(nil),
          depth(_depth), hiwat(_hiwat)
    {
    }
};

```

AutoreleasePoolPageData是一个双向链表.

### 内部方法

```Swift

id * begin() { // 开始添加对象的位置
    return (id *) ((uint8_t *)this+sizeof(*this));
}

id * end() { // 表尾, 表的大小
    return (id *) ((uint8_t *)this+SIZE);
}

bool empty() { // 表是不是空的 next == 开头
    return next == begin();
}

bool full() { // 表是不是满了 next == 表尾
    return next == end();
}

bool lessThanHalfFull() { //少于一半?
    return (next - begin() < (end() - begin()) / 2);
}

id *add(id obj) // 表添加数据
{
    ASSERT(!full()); //表没有满
    unprotect(); //类似加锁吧
    id *ret = next;  // faster than `return next-1` because of aliasing
    *next++ = obj; // obj的位置赋值给next
    protect();
    return ret;
}

void releaseAll() // 释放全部
{
    releaseUntil(begin());
}

void releaseUntil(id *stop) // stop是begin
{
    // Not recursive: we don't want to blow out the stack 
    // if a thread accumulates a stupendous amount of garbage
    
    // 从最后的对象循环到第一个对象
    while (this->next != stop) {
        // Restart from hotPage() every time, in case -release 
        // autoreleased more objects
        AutoreleasePoolPage *page = hotPage();

        // fixme I think this `while` can be `if`, but I can't prove it
        while (page->empty()) {
            page = page->parent;
            setHotPage(page);
        }

        page->unprotect(); // 类似加锁
        id obj = *--page->next; // 获取到next位置的对象obj
        memset((void*)page->next, SCRIBBLE, sizeof(*page->next)); //将内存next的大小为next的字节的值设置为SCRIBBLE 
        // static uint8_t const SCRIBBLE = 0xA3;  // 0xA3A3A3A3 after releasing
        page->protect(); // 类似解锁

        if (obj != POOL_BOUNDARY) { //#   define POOL_BOUNDARY nil 岗哨对象, 如果obj不是岗哨对象,就释放
            objc_release(obj);
        }
    }

    setHotPage(this);

#if DEBUG
    // we expect any children to be completely empty
    for (AutoreleasePoolPage *page = child; page; page = page->child) {
        ASSERT(page->empty());
    }
#endif
}

static inline void setHotPage(AutoreleasePoolPage *page) 
{
    if (page) page->fastcheck();
    tls_set_direct(key, (void *)page);
}

```

### 操作

```Swift

_objc_rootHash(id obj)
{
    return (uintptr_t)obj;
}

void *
objc_autoreleasePoolPush(void)
{
    return AutoreleasePoolPage::push(); // 推入
}

NEVER_INLINE
void
objc_autoreleasePoolPop(void *ctxt)
{
    AutoreleasePoolPage::pop(ctxt); // 推出
}

void *
_objc_autoreleasePoolPush(void)
{
    return objc_autoreleasePoolPush();
}

void
_objc_autoreleasePoolPop(void *ctxt)
{
    objc_autoreleasePoolPop(ctxt);
}

void 
_objc_autoreleasePoolPrint(void)
{
    AutoreleasePoolPage::printAll(); // 打印所有
}

static inline id autorelease(id obj) // 自动释放的对象
{
    ASSERT(obj); // 对象有值
    ASSERT(!obj->isTaggedPointer()); // 对象不是taggedPointer类型
    id *dest __unused = autoreleaseFast(obj); // 添加
    ASSERT(!dest  ||  dest == EMPTY_POOL_PLACEHOLDER  ||  *dest == obj);
    return obj;
}

static inline id *autoreleaseFast(id obj)
{
    AutoreleasePoolPage *page = hotPage();
    if (page && !page->full()) { // page没有满
        return page->add(obj); // page添加对象
    } else if (page) {
        return autoreleaseFullPage(obj, page); // page满
    } else {
        return autoreleaseNoPage(obj); // 没有page
    }
}

static inline void *push() 
{
    id *dest;
    if (slowpath(DebugPoolAllocation)) {
        // Each autorelease pool starts on a new pool page.
        dest = autoreleaseNewPage(POOL_BOUNDARY);
    } else {
        dest = autoreleaseFast(POOL_BOUNDARY); //从岗哨对象新建一个pool
    }
    ASSERT(dest == EMPTY_POOL_PLACEHOLDER || *dest == POOL_BOUNDARY);
    return dest;
}

static inline void
pop(void *token)
{
    AutoreleasePoolPage *page;
    id *stop;
    if (token == (void*)EMPTY_POOL_PLACEHOLDER) {
        // Popping the top-level placeholder pool.
        page = hotPage();
        if (!page) {
            // Pool was never used. Clear the placeholder.
            return setHotPage(nil);
        }
        // Pool was used. Pop its contents normally.
        // Pool pages remain allocated for re-use as usual.
        page = coldPage();
        token = page->begin();
    } else {
        page = pageForPointer(token);
    }

    stop = (id *)token;
    if (*stop != POOL_BOUNDARY) {
        if (stop == page->begin()  &&  !page->parent) {
            // Start of coldest page may correctly not be POOL_BOUNDARY:
            // 1. top-level pool is popped, leaving the cold page in place
            // 2. an object is autoreleased with no pool
        } else {
            // Error. For bincompat purposes this is not 
            // fatal in executables built with old SDKs.
            return badPop(token);
        }
    }

    if (slowpath(PrintPoolHiwat || DebugPoolAllocation || DebugMissingPools)) {
        return popPageDebug(token, page, stop);
    }

    return popPage<false>(token, page, stop);
}

static void printAll()
{
    _objc_inform("##############");
    _objc_inform("AUTORELEASE POOLS for thread %p", objc_thread_self());

    AutoreleasePoolPage *page;
    ptrdiff_t objects = 0;
    for (page = coldPage(); page; page = page->child) {
        objects += page->next - page->begin();
    }
    _objc_inform("%llu releases pending.", (unsigned long long)objects);

    if (haveEmptyPoolPlaceholder()) {
        _objc_inform("[%p]  ................  PAGE (placeholder)", 
                        EMPTY_POOL_PLACEHOLDER);
        _objc_inform("[%p]  ################  POOL (placeholder)", 
                        EMPTY_POOL_PLACEHOLDER);
    }
    else {
        for (page = coldPage(); page; page = page->child) {
            page->print();
        }
    }

    _objc_inform("##############");
}

```

push和pop是针对page链表的操作,push是通过一个岗哨对象(nil)新建一个表.在``@autoreleasepool``作用域开始时push,结束时pop.

在autoreleasepool中添加对象的时候,判断对象有值并且不是taggedpoint对象,然后调用``autoreleaseFast``判断当前的page是不是满的或者空,将对象添加到page中.

在autoreleasepool失效的时候,从最后一个对象开始遍历到第一个对象,如果不是岗哨对象(nil)就执行release操作.

### main函数的autoreleasepool

```Swift

int main(int argc, char * argv[]) {
    NSString * appDelegateClassName;
    @autoreleasepool {
        // Setup code that might create autoreleased objects goes here.
        appDelegateClassName = NSStringFromClass([AppDelegate class]);
    }
    
    return UIApplicationMain(argc, argv, nil, appDelegateClassName);
}

```

注释告诉我们,创建自动释放对象的代码在这里,这个pool的应该就是如果有一些初始化之前的对象要创建的时候放在这里,后面就可以销毁