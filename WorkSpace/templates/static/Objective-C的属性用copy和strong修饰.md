# Objective-C的属性用copy和strong修饰

属性使用copy和strong修饰,有什么区别

```Objective-c

@property (nonatomic, copy) NSString *name;
@property (nonatomic, strong) NSString *name;

```

copy和strong修饰的不可变的NSString, 结果是一样的, 都是浅copy, 复制了指针,但还是指向原来的地址.

```Objective-c

@property (nonatomic, copy) NSMutableString *name;
@property (nonatomic, strong) NSMutableString *name;

```

copy修饰的name是对原来的数据进行了copy,strong则是引用计数+1

```Objective-c

NSMutableString *string = @"zhang".mutableCopy;
Person *p = [[Person alloc]init];
p.name = string;
[string appendString:@"san"];
NSLog(@"%@ %p", p.name, p.name);

// log
zhangsan 0x6000019bdcb0
zhang    0xc4d93553c988db31
zhangsan 0x6000019bdcb0

```

猜测下name的set方法的实现

```Objective-c

-(void)setCopyname:(NSString *)copyname {
    _copyname = [copyname copy];
}

-(void)setStrongname:(NSString *)strongname {
    _strongname = strongname;
}

// log
ssffsan 0x600000c2b960
ssff    0xd3c958622979f574
ssffsan 0x600000c2b960

```

可以发现,重写的set和默认的set是类似的.

关于name用copy和strong修饰的区别,如果我们给name赋值的是一个NSString的对象,两者应该是一样的效果.因为不可变都是浅copy.
如果给name赋值的是一个NSMutableString对象,因为OC是有多态特性的,所以是可以给name赋值NSMutablestring的,这时copyname就是一个返回一个不可变的深copy.strongname还是浅copy,当赋值的对象发生改变时,copyname是不变的,strongname跟随改变.所以copyname更符合对象的封装性.

一个可变的属性比如NSMutableString用copy修饰,则返回一个不可变的string对象,对它做操作则会引发crash.


