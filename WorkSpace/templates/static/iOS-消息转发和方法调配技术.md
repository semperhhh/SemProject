
date: 2018-10-07 22:13:31
pid: 19012402;
tag: iOS;

---

# iOS-消息转发和方法调配技术

学习的主要摘自<Effective Objective-C>
<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/iOS0002.png"
width="300" hegiht="300" align=center />

在oc中,可以:
1.在运行期向类中新增实例变量
2.在运行期可以继续向类中添加方法
3.在运行期改变与给定的选择子名称相对应的方法(方法调配技术)<!--more-->

### 理解objc_msgSend的作用

在oc中,如果向某对象传递信息，那就会使用动态绑定机制来决定需要调用的方法。在底层，所有方法都是普通的C语言函数.然而对象收到消息之后,究竟该调用哪个方法则完全于运行期决定,甚至可以在程序运行时改变,这些特性使得oc成为一门真正的动态语言.

在oc中,给对象发送消息的语法是:

```Objective-c
id returnValue = [someObject messageName:parameter];
```
这里，someObject叫做“接收者(receiver)”，messageName:叫做"选择子（selector）",选择子和参数合起来称为“消息”。编译器看到此消息后，将其转换为一条标准的C语言函数调用，所调用的函数乃是消息传递机制中的核心函数叫做objc_msgSend，它的原型如下：
```Objective-c
void objc_msgSend(id self, SEL cmd, ...)
```
第一个参数代表接收者，第二个参数代表选择子，后续参数就是消息中的那些参数，数量是可变的，所以这个函数就是参数个数可变的函数。编译器会把刚才那个例子中的消息转换为如下函数
```Objective-c
id returnValue = objc_msgSend(someObject,@selector(messageName:),parameter);
```

objc_msgSend函数会依据接受者与选择子的类型来调用适当的方法.为了完成此操作,该方法需要在接收者所属的类中搜寻其"方法列表",如果能找到与选择子相符的方法,就跳至其实现代码.若是找不到,就沿着继承体系继续向上查找.如果找到了就执行，如果最终还是找不到，就执行*消息转发*操作.

> 快速执行路径:按照上面说的想调用一个方法似乎需要很多步骤,所幸objc_msgSend会将匹配的结果缓存在"快速映射表"里面,每个类都有这样一块缓存,若是稍后还向该类发送与选择子相同的消息,那么执行起来就很快了.

理解这些,就会明白,在发送消息时,代码究竟是如何执行的,而且也能理解,为何在调试的时候,栈"回溯"信息中总是出现objc_msgSend.

### 理解消息转发机制

若想令类能理解某条消息,我们必须以程序码实现出对应的方法才行.但是在编译期向类发送了其无法解读的消息并不会报错,因为*在运行期继续可以向类中添加方法*,所以编译器在编译时还不知道类中到底有没有对应方法的实现.当对象接收到无法解读的消息后,就会启动消息转发机制.程序员可由此过程告诉对象应该如何处理未知消息.

开发者在编写自己的类时,可于转发过程中设置*挂钩*,用以执行预订的逻辑,而不使应用程序崩溃.

消息转发分为两个阶段:

1.征询接受者，看它能否动态添加方法，以处理这个未知的选择子，这个过程叫做动态方法解析（dynamic method resolution).
2.请接受者看看有没有其他对象能处理这条消息：
&nbsp;&nbsp;如果有，则运行期系统会把消息转给那个对象。
&nbsp;&nbsp;如果没有，则启动完整的消息转发机制（full forwarding mechanism），运行期系统会把与消息有关的全部细节都封装到
NSInvocation对象中，再给接受者最后一次机会，令其设法解决当前还未处理的这条消息。
类方法`+(BOOL)resolveInstanceMethod:(SEL)selector:`查看这个类是否能新增一个实例方法用以处理此选择子
实例方法`- (id)forwardTargetForSelector:(SEL)selector;`:询问是否能找到未知消息的备援接受者，如果能找到备援对象，就将其返回，如果不能，就返回nil。
实例方法`- (void)forwardInvocation:(NSInvocation*)invocation:`创建NSInvocation对象，将尚未处理的那条消息 有关的全部细节都封于其中，在触发NSInvocation对象时，“消息派发系统（message-dispatch system）”就会将消息派给目标对象。

总结:
若对象无法响应某个选择子,则进入消息转发流程.
通过运行期的动态方法解析功能,我们可以在需要用到某个方法时再将其加入类中.
对象可以把其无法解读的某些选择子转交给其他对象来处理.
经过上述两步之后,如果还是没办法处理选择子,那就启动完整的消息转发机制.

#### 应用-向对象发送没有实现的消息

````objective-c

    //调用当前类中没有实现的方法
    [self performSelector:@selector(readBook)];
    [self performSelector:@selector(writeBook)];
    [self performSelector:@selector(findBook)];
}

void readBook(id self,SEL _cmd) {

    NSLog(@"now i can readBook");
}

//1.动态方法解析
+(BOOL)resolveInstanceMethod:(SEL)sel {

    NSLog(@"resolveInstanceMethod: %@",NSStringFromSelector(sel));

    if (sel == @selector(readBook)) {
        class_addMethod([self class], sel, (IMP)readBook, "V@:");

        return YES;
    }

    return [super resolveInstanceMethod:sel];
}

//2.备援接受者
-(id)forwardingTargetForSelector:(SEL)aSelector {
 
    NSLog(@"forwardingTarget: %@",NSStringFromSelector(aSelector));
    
    CLRead *read = [[CLRead alloc]init];
    if ([read respondsToSelector:aSelector]) {
        return read;
    }
    return [super forwardingTargetForSelector:aSelector];
}

//3.完整的消息转发
-(NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector {
    
    NSLog(@"method signature for selector: %@",NSStringFromSelector(aSelector));
    
    if (aSelector == @selector(code)) {
        return [NSMethodSignature signatureWithObjCTypes:"V@:"];
    }
    return [super methodSignatureForSelector:aSelector];
}

-(void)forwardInvocation:(NSInvocation *)anInvocation {
    
    NSLog(@"forwardInvocation: %@",NSStringFromSelector([anInvocation selector]));
    
    if ([anInvocation selector] == @selector(code)) {
        CLRead *read = [[CLRead alloc]init];
        [anInvocation invokeWithTarget:read];
    }
}
````

### 方法调配技术

在oc中,与给定的选择子名称相对应的方法是不是也可以在运行期改变呢?没错,若能善用此特性,则可发挥出巨大优势,因为我们既不需要源码,也不需要通过继承子类来覆写方法就能改变这个类本身的功能.这样一来,新功能将在本类的所有实例中生效,而不是仅限于覆写了相关方法的那些子类实例.此方案经常称为"方法调配"

类的方法列表会把选择子的名称映射到相关的方法实现之上,使得"动态消息派发系统"能够据此找到应该调用的方法.这些方法均以函数指针的形式来表示,这种指针叫做IMP,其原型如下:
```Objective-c
id (*IMP)(id,SEL,...)
```

#### 交换方法实现

交换方法实现,可用下列函数:
```Objective-c
void method_exchangeImplementations(Method m1,Method m2)
```
此函数的两个参数表示待交换的两个方法实现,而方法实现则可通过下列函数获得:
```Objective-c
Method class_getInstanceMethod(Class aClass, SEL aSelector)
```
此函数根据给定的选择从类中取出与之相关的方法.

> 很少有人在调试程序之外的场合用上述"方法调配技术"来永久改动某个类的功能.不能仅仅因为Objective-c语言里有这个特性就一定要用它.若是滥用,反而会令代码变得不易读懂且难于维护.

#### 应用-防止数组越界的crach

````objective-c

//在NSArray中添加分类
+(void)load {
    
    //替换不可变数组中的方法 []调用的方法
    Method oldObjectAtIndex = class_getInstanceMethod(objc_getClass("__NSArrayI"), @selector(objectAtIndexedSubscript:));
    Method newObjectAtIndex = class_getInstanceMethod(objc_getClass("__NSArrayI"), @selector(objectAtIndexedNewSubscript:));
    
    method_exchangeImplementations(oldObjectAtIndex, newObjectAtIndex);
    
    //替换不可变数组中的objectAtIndex
    Method oldObjectAtIndex1 = class_getInstanceMethod(objc_getClass("__NSArrayI"), @selector(objectAtIndex:));
    Method newObjectAtIndex1 = class_getInstanceMethod(objc_getClass("__NSArrayI"), @selector(newObjectAtIndex:));
    
    method_exchangeImplementations(oldObjectAtIndex1, newObjectAtIndex1);
    
    //替换可变数组中的方法 []调用的方法
    Method oldMutableObjectAtIndex = class_getInstanceMethod(objc_getClass("__NSArrayM"), @selector(objectAtIndexedSubscript:));
    Method newMutableObjectAtIndex = class_getInstanceMethod(objc_getClass("__NSArrayM"), @selector(mutableObjectAtIndexedNewSubscript:));

    method_exchangeImplementations(oldMutableObjectAtIndex, newMutableObjectAtIndex);
    
    //替换可变数组中的方法 objectatindex
    Method oldMutableObjectAtIndex1 = class_getInstanceMethod(objc_getClass("__NSArrayM"), @selector(objectAtIndex:));
    Method newMutableObjectAtIndex1 = class_getInstanceMethod(objc_getClass("__NSArrayM"), @selector(newMutableObjectAtIndex:));
    
    method_exchangeImplementations(oldMutableObjectAtIndex1, newMutableObjectAtIndex1);
}

-(id)newMutableObjectAtIndex:(NSUInteger)index {
 
    if (index > self.count - 1 || !self.count) {
        
        @try {
            
            //因为前面方法交换了,这里其实调用的原生的方法
            return [self newMutableObjectAtIndex:index];
        } @catch (NSException *exception) {
            NSLog(@"可变数组越界了");
            return nil;
        } @finally {
            
        }
    }else {
        return [self newMutableObjectAtIndex:index];
    }
}

-(id)mutableObjectAtIndexedNewSubscript:(NSUInteger)index {
    
    if (index > self.count - 1 || !self.count) {
        
        @try {
            
            //因为前面方法交换了,这里其实调用的原生的方法
            return [self mutableObjectAtIndexedNewSubscript:index];
        } @catch (NSException *exception) {
            NSLog(@"可变数组越界了");
            return nil;
        } @finally {
            
        }
    }else {
        return [self mutableObjectAtIndexedNewSubscript:index];
    }
}

-(id)newObjectAtIndex:(NSUInteger)index {
    
    if (index > self.count - 1 || !self.count) {
        
        @try {
            
            //因为前面方法交换了,这里其实调用的原生的方法
            return [self newObjectAtIndex:index];
        } @catch (NSException *exception) {
            NSLog(@"不可变数组越界了");
            return nil;
        } @finally {
            
        }
    }else {
        return [self newObjectAtIndex:index];
    }
}

-(id)objectAtIndexedNewSubscript:(NSUInteger)index {
    
    if (index > self.count - 1 || !self.count) {
        
        @try {
            
            //因为前面方法交换了,这里其实调用的原生的方法
            return [self objectAtIndexedNewSubscript:index];
        } @catch (NSException *exception) {
            NSLog(@"不可变数组越界了");
            return nil;
        } @finally {
            
        }
    }else {
        return [self objectAtIndexedNewSubscript:index];
    }
}

````

#### 应用-打印viewcontroller类名

> 在每个viewcontroller将要``viewdidload``的时候,在控制台打印类名,对调试app的时候会有帮助

截取viewcontroller的``viewdidload``方法,给viewcontroller添加分类,重新实现``viewdidload``方法;

在直接调用IMP的话就会发生``EXC_BAD_ACCESS``错误,因为IMP指针是有返回值的类型,而viewdidload这个方法是没有返回值的,我们定义一个和IMP相同类型的函数指针VIMP,把他的返回值定位Void.

~~~~objective-c
#import "UIViewController+ZPViewDidLoad.h"
#import <objc/runtime.h>

typedef void (* _VIMP)(id, SEL, ...);

@implementation UIViewController (ZPViewDidLoad)

+(void)load {
    
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        
        // get system viewDidLoad method
        Method viewDidLoad = class_getInstanceMethod(self, @selector(viewDidLoad));
        
        // get the system implementation of viewDidLoad
        _VIMP viewDidLoad_VIMP = (_VIMP)method_getImplementation(viewDidLoad);
        
        // resetter the  system implementation of viewDidLoad
        method_setImplementation(viewDidLoad, imp_implementationWithBlock(^ (id target , SEL action){
            
            // the system viewDidLoad method
            viewDidLoad_VIMP(target , @selector(viewDidLoad));
            
            
            // the new add NSLog method
            NSLog(@"-------------------- %@ : view did load",target);
        }));
        
        
    });
}
@end
~~~~

### 编译期

编译时就是获取objc文件.
