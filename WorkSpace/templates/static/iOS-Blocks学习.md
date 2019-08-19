
date: 2018-12-04 16:34:32
pid: 190116;
tag: iOS;

---

# iOS-Blocks学习

<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-blocks01.png" width="600" align=center>

大部分内容来自
<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/iOS0001.png" width="300" align=center>

Block:带有自动变量的匿名函数.是C语言的扩充功能.Block拥有捕获外部变量的功能.在Block中访问一个外部的局部变量,Block会持有它的临时状态,自动捕获变量值,外部局部变量的变化不会影响它的状态.<!--more-->

#### Block实质

在通过``clange -rewrite-objec``查看Block的源码可以看到,Block是作为参数进行了传递

```
//Block结构体
struct __main_block_impl_0 {
    struct __block_impl;
    struct __main_block_desc_0* Desc;

    __main_block_impl_0 (void *fp,struct __main_block_desc_0 *desc, int flags=0) {
        impl.isa = &_NSConcreteStackBlock;
        impl.Floags = flags;
        impl.funcPtr = fp;
        Desc = desc;
    }
}
```

其中``isa = &_NSConcreteStackBlock``,将Block指针赋给Block的结构体成员变量isa.为了理解它,首先要理解Objective-c类和对象的实质.其实,Block就是Objective-c对象.

``id``这一变量类型用于存储Objective-c对象.``id``为objc_object结构体的指针类型

```Objective-c
typedef struct objc_object {
    Class isa;
} *id;
```

``Class``为objc_class结构体的指针类型

```Objective-c
typedef struct objc_class *Class

struct objc_class {
    Class isa;
};

//这与objc_object结构体相同.然而,objc_object结构体和objc_class结构体归根结底是在各个对象和类的实现中使用的最基本的结构体
```

这里需要理解一下Objective-c的类与对象的实质,各类的结构体就是基于objc_class结构体的class_t结构体.class_t结构体在objc4运行时库中的声明

```Objective-c
struct class_t {
    struct class_t *isa;
    struct class_t *superclass;
    Cache cache;
    IMP *vtable;
    uintptr_t data_NEVER_USE;
};
```

class_t结构体实例持有声明的成员变量,方法名称,方法的实现(函数指针),属性以及父类的指针,并被Objective-c运行时库所使用.

在__main_block_impl_0结构体相当于基于objc_object结构体的objective-c类对象的结构体.
即_NSConcreteStackBlock相当于class_t结构体实例.在将Block作为Objective-c的对象处理时,关于该类的信息放置于_NSConcreteStackBlock中.

#### 截获自动变量值

所谓的"截获自动变量值"意味着在执行Block语法时,Block语法表达式所使用的自动变量值被保存到Block的结构体实例(即Block自身)中.
Block中使用自动变量后,在Block的结构体实例中重写该自动变量也不会改变原先截获的自动变量.这样一来就无法在Block中保存值了,解决这个问题有两种方法:

* C语言有一个变量,允许Block改写值:``静态变量``

静态变量的指针传递给__main_block_impl_0结构体的构造函数并保存.

* 使用``__block``说明符

C语言有一下存储域类说明符:
    * typedef
    * extern
    * static :表示作为静态变量存储在数据区中
    * auto :表示作为自动变量存储在栈中
    * register

``__block``说明符类似于这些,用它来指定Block中想变更值的自动变量.
使用__block修饰一个变量,在Block的源代码中会变成一个结构体实例.
```objective-c

__block int val = 10;

//转换源码
__Block_byref_val_0 val = {
    0,
    &val,
    0,
    sizeof(__Block_byref_val_0),
    10//该变量初始化为10,且这个值也出现在结构体实例的初始化中,这意味着该结构体持有相当于原自动变量的成员变量.
};

//该结构体声明
struct __Block_byref_val_0 {
    void *__isa;
    __Block_byref_val_0 *forwarding;
    int __flags:
    int __size;
    int val;
}
```

在给__block变量赋值时,__Block_byref_val_0结构体实例的成员变量__forwarding持有指向该实例自身的指针.通过成员变量__forwarding访问成员变量val.通过访问val的指针,就可以从多个Block中使用同一个__block变量.

#### Block存储域

> Block的存储,Block在栈堆上的问题

Block也是objective-c对象,具有这几个类

| 类 | 设置对象的存储域 |
| - | - |
| _NSConcreteStackBlock | 栈 |
| _NSConcreteGlobalBlock | 程序的数据区域(.data区) |
| _NSConcreteMallocBlock | 堆 |

__block变量用结构体成员变量__forwarding可以实现无论__block变量配置在栈上还是堆上是都能够正确地访问__block变量.

当ARC有效时,大多数情形下编译器会恰当的进行判断,自动生成将Block从栈上复制到堆上的代码.

Block的copy总结

| Block的类 | 副本源的配置存储域 | 复制效果 |
| - | - | - |
| _NSConcreteStackBlock | 栈 | 从栈复制到堆 |
| _NSConcreteGlobalBlock | 程序的数据区域(.data区) | 什么也不做 |
| _NSConcreteMallocBlock | 堆 | 引用结束增加 |


#### Block引起的循环引用

我们在设置Block之后,不希望再回调Block时Block已经被释放了,所以我们会对block进行copy,copy到堆中.

```objective-c
//这里定义一个数组,里面添加两个block,因为这两个block没有copy到堆上,所以当调用它时可能已经被释放了
- (void)viewDidLoad {
    [super viewDidLoad];
    
    //创建数组
    id obj = [self getBlockArray];
    
    //定义
    typedef void (^blk_t)(void);
    
    //赋值-获取到obj数组中的第一个元素
    blk_t blk = (blk_t)[obj objectAtIndex:0];
    
    //调用
    blk();
}

-(id)getBlockArray {
    int val = 10;
    
    return [[NSArray alloc]initWithObjects:^{
        NSLog(@"blk0:%d",val);
        
    },^{
        NSLog(@"blk0:%d",val);
        
    }, nil];
}

```

但在copy到堆上的时候,会retain其引用的外部变量,如果Block中引用了他的宿主对象,那就可能引起循环引用的问题.
ARC下,有两种方法可以解决循环引用问题:

* 事前避免(``__weak``和``__strong``)

在使用block时,__weak修饰他的宿主对象,对象的引用计数不会+1.还需要在Block内部对弱引用对象进行一次强引用,这是因为仅用__weak修饰的对象,如果被释放,那么这个对象在Block执行的过程中就会变成nil,这就可能会带来一些问题.使用__strong修饰对象,直到Block被执行完毕,这个对象都不会被释放.

* 事后补救

在确定block回调执行完成后,将其中一方强制置为空 ``xx==nil``.

### 补充关于weak

weak修饰属性,这个问题就好像iOS程序员之间打招呼的方式一样.
weak表示一个由``runtime``维护的hash表,key是所指对象的地址,value是weak指针的地址数组.
weak是弱引用,所引用对象的计数器不会加1,并在引用对象被释放的时候自动被设置为nil.这是因为:

* ``runtime``会对注册的类进行布局,当此对象的引用次数为0时释放对象,在weak表中以对象地址为键搜索,将搜索到的weak对象置为nil

这也是weak会置为nil,而assign有可能会野指针的原因,所以在修饰Objective-c对象的时候多用weak,不用assign.
