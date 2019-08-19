
date: 2018-03-17 15:22:10
pid: 19012407;
tag: iOS;

---

# iOS-retaincycle循环引用



循环引用最常出现在block中,一个对象中强引用了block,在block中又强引用了该对象,就会发生循环引用. <!--more-->

解决方法一般是两种:

	1.事前避免:将该对象使用_weak或者_block修饰符修饰之后再在block中使用;
	2.时候补救:将其中一方强制置空 xx == nil;

> _block会把在栈上的``外部变量``内存地址放到对中,在block内部也可以修改外部变量的值.
>
> 这里说``外部变量``是指栈中的内存地址.

只有当block直接或间接的被self持有时,才需要weakself.如果在block内需要多次访问self,则需要使用strongself.

当 block 本身不被 self 持有，而被别的对象持有，同时不产生循环引用的时候，就不需要使用 weak self 了。最常见的代码就是 UIView 的动画代码，我们在使用 UIView 的 animateWithDuration:animations 方法 做动画的时候，并不需要使用 weak self，因为引用持有关系是：

* UIView 的某个负责动画的对象持有了 block 
* block 持有了 self 
* 因为 self 并不持有 block，所以就没有循环引用产生，就不需要使用 weak self 。

~~~~objective-c
[UIView animateWithDuration:0.2 animations:^{
    self.alpha = 1;
}];
~~~~

当动画结束时，UIView 会结束持有这个 block，如果没有别的对象持有 block 的话，block 对象就会释放掉，从而 block 会释放掉对于 self 的持有。整个内存引用关系被解除。

strong self
	在 block 中先写一个 strong self，其实是为了避免在 block 的执行过程中，突然出现 self 被释放的尴尬情况。通常情况下，如果不这么做的话，还是很容易出现一些奇怪的逻辑，甚至闪退。

~~~~objective-c
	int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // insert code here...
        NSLog(@"Hello, World!");
        
        shop *s = [[shop alloc]init];
        NSLog(@"%ld\n",CFGetRetainCount((__bridge CFTypeRef)(s)));
        __weak shop *weakS = s;
        s.shopBlock = ^{
            
            NSLog(@"block weakS -- %ld\n",CFGetRetainCount((__bridge CFTypeRef)(weakS)));

            __strong shop *strongS = weakS;
            NSLog(@"block weakS -- %ld\n",CFGetRetainCount((__bridge CFTypeRef)(weakS)));
            NSLog(@"block strongS -- %ld\n",CFGetRetainCount((__bridge CFTypeRef)(strongS)));
        };
        NSLog(@"---- %ld\n",CFGetRetainCount((__bridge CFTypeRef)(s)));
        NSLog(@"weakS ---- %ld\n",CFGetRetainCount((__bridge CFTypeRef)(weakS)));
        s.shopBlock();
        NSLog(@"weakS over ---- %ld\n",CFGetRetainCount((__bridge CFTypeRef)(weakS)));
    }
    return 0;
}
~~~~

~~~~objective-c
blockRetainTest[3218:212987] Hello, World!
blockRetainTest[3218:212987] 1
blockRetainTest[3218:212987] weakS ---- 2
blockRetainTest[3218:212987] ---- 1
blockRetainTest[3218:212987] weakS ---- 2
blockRetainTest[3218:212987] block weakS -- 2
blockRetainTest[3218:212987] block weakS -- 3
blockRetainTest[3218:212987] block strongS -- 2
blockRetainTest[3218:212987] weakS over ---- 2

//shop类的引用计数一直为1,
~~~~

在block内如何修改block外部变量
block中访问的外部变量是复制过去的,即:写操作不对原变量生效,可以加上_block来让其写操作生效.
block不允许修改外部变量的值,这里所说的外部变量的值,值得是栈中指针的内存地址._block所起到的作用就是只要观察到该变量被block锁持有,就将”外部变量”在栈中的内存地址放到了堆中,进而在block内部也可以修改外部变量的值.
a 在定义前是栈区，但只要进入了 block 区域，就变成了堆区。这才是 *_block关键字的真正作用* .

~~~~objective-c

~~~~

#### 更新
看到一篇文章,retainCount方法不是准确的,链接放上来[bbum的weblog-o-mat](http://www.friday.com/bbum/2011/12/18/retaincount-is-useless/) 
需要翻墙



#### 补充



> block为什么要用copy修饰

这个其实是在MRC下,block是被放在栈上面的,我们知道栈是系统管理的, 那么就有可能提前释放block,所以将block拷贝到堆上.

在ARC下系统会帮我们做这个操作,但是也有的地方是不帮我们copy到堆上的,比方说在NSArray的``initwithobjects``中传递block的时候.



> 修饰词copy和strong的区别

copy修饰的不可变如NSString,copy可以保证NSString是不可变的.

如果使用strong,那么这个属性就有可能指向一个可变对象,如果可变对象在外部被修改了,就会影响该属性.

而NSMutableString使用copy则改变了它可变的性质.



> copy的使用

| 原对象 | 拷贝方法    | 拷贝方式 | 生成的对象 |
| :----- | :---------- | -------- | ---------- |
| 不可变 | copy        | 浅拷贝   | 不可变     |
| 不可变 | mutableCopy | 深拷贝   | 可变       |
| 可变   | copy        | 深拷贝   | 不可变     |
| 可变   | mutableCopy | 深拷贝   | 可变       |

用copy修饰的或者赋值的变量肯定是不可变的.

用copy赋值,要看源对象是否是可变的,来决定只拷贝指针,还是也拷贝对象到另一块内存空间.



> strong和weak的区别

weak常用于弱引用,可以防止多次强引用对象造成循环引用.

strong能够持有对象,一个对象只有有其他的持有就不会被释放.



> weak的实现

weak是基于runtime维护的一个哈希表,是以对象的地址为key,对象的weak指针为value的.

当对象不再被强引用,也就是retaincount为0的时候释放对象,同时runtime根据key遍历value并置为nil.



> weak和assign的区别

weak只能修饰oc对象,weak可以置为nil.

assign可以修饰基本数据类型.