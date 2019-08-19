pid: 19030602;

---

## 《Swift-100个swift必备Tips》读书笔记



#### @escaping 闭包逃逸

swift中我们可以定义一个接收函数作为参数的函数,而在调用时,使用闭包的方式来传递这个参数是常见手段

~~~swift
func doWork (block: ()->()) {
    block()
}

doWork {
    print(work)
}
~~~

这种形式的闭包还隐藏了一个假设,那就是参数中block的内容会在``doWork``返回前就完成.也就是说,对于``block``的调用的同步行为.如果我们改变一下代码,将``block``放到一个``Dispatch``中去,让它在``doWork``返回后被调用的话我们就需要在block的类型前加上``@escaping``标记来表明这个闭包是会"逃逸"出该方法的:

```swift
func doWorkAsync (@escaping block:()->()) {
    DispatchQueue.main.async {
        block()
    }
}
```

接受``@escaping``的``doWorkAsync``由于需要确保闭包内的成员依然有效,如果在闭包内引用了``self``及其成员的话,Swift将强制我们明确地写出``self``.



#### Optional Chaining

使用 Optional Chaining 可以让我们摆脱很多不必要的判断和取值,但是在使用的时候需要小心陷阱.

因为 Optional Chaining 是随时都可能提前返回nil的,所以使用 Optional Chaining 所得到的东西其实都是 Optional 的,比如下面的一段代码:

~~~swift
class Toy {
    let name: String
    init(name: String) {
        self.name = name
    }
}

class Pet {
    var toy: Toy?
}

class Child {
    var pet: Pet?
}
~~~

在实际使用中,我们想要知道小明的宠物的玩具的名字的时候,可以通过下面的 Optional Chaining 拿到:

``let toyName = xiaoming.pet?.toy?.name``

注意虽然我们最后访问的是``name``,并且在toy的定义中``name``是被定义一个确定的``String``而非``String?``的,但是我们拿到的``toyname``其实还是一个``string?``的类型.只是由于在 Optional Chaining 中我们在任意一个``?.``的时候都可能遇到``nil``而提前返回,这个时候当然就只能拿到nil了.

在实际使用中,我们大多数情况下可能更希望使用 Optional Binding 来直接取值的这样的代码:

```swift
if let toyName = xiaoming.pet?.toy?.name {
    
}.
```

* 在声明属性的时候,?是可选初始化,!是必须初始化,还可以直接初始化.

```swift
// 如
//可选初始化,这样在下面使用的时候都是带可选的?的
let imgView:UIImageView?
//必须初始化,不然编译不通过
let imgView:UIImageView!
//初始化
let imgView = UIImageView()
```



#### Designated, Convenience和Required

> 指定的, 便利的, 必需的

在Objective-c中,init方法是非常不安全的:没有人能保证init纸杯调用一次,也没有人保证在初始化方法调用以后实例的各个变量都完成初始化,甚至如果在初始化里使用属性进行设置的话,还可能会造成各种问题.

所以Swift有了超级严格的初始化方法.一方面,swift强化了``designated``初始化方法的地位.swift中不加修饰的``init``方法都需要在方法中保证所有非Optional的实例变量被赋值初始化,而在子类中也强制(显式或者隐式的)调用``super``版本的``designated``初始化,所以无论如何走何种路径,被初始化的对象总是可以完成完整的初始化的.

```swift
class ClassA {
   let numA: Int
    init(num: Int){
        numA = num
    }
}
```



与designated初始化方法对应的是在init前加上``convenience``关键字的初始化方法.这类方法是swift初始化方法中的"二等公民",只作为补充和提供使用上的方便.所有的``convenience``初始化方法都必须调用同一个类中的``designated``初始化完成设置,另外``convenience``的初始化方法是不能被子类重写或者是从子类中以``super``的方式被调用的.

```swift
class ClassA {
    let numA: Int
    init (num: Int) {
        numA = num
    }
    
    convenience init(bigNum: Bool) {
        self.init(num:bigNum ? 10000 : 1)
    }
}
```

进行一下总计,可以看到初始化方法永远遵循以下两个原则:

* 初始化路径必须保证对象完全初始化,这可以通过调用被类型的designated初始化方法来得到保证;
* 子类的designated初始化方法必须调用父类的designated方法,以保证父类也完成初始化.

对于某些我们希望子类中一定实现的designated初始化方法,我们可以通过添加require关键字进行限制,强制子类对这个方法重写实现.这样做的最大的好处是可以保证依赖于某个designated初始化方法的convenience一直可以被使用.

#### 命名空间

Objective-c是没有命名空间的,在开发时,所有的代码和引用的静态库最终都会被编译到同一个域和二进制中.这样的后果是一旦我们有重复的类名的话,就会导致编译时的冲突和失败.

在Swift中,由于可以使用命名空间了,即时是名字相同的类型,只要是来自不同的命名空间的话,都是可以和平共处的.

Swift的命名空间是基于module而不是在代码中显式地指明,每个module代表了Swift中的一个命名空间.也就是说,同一个target里的类型名称还是不能相同的.



#### 初始化返回nil

在Objective-c中,init方法除了返回self以外,其实和一个普通的实例方法并没有太大区别.如果你喜欢的话,甚至可以多次进行调用,这都是没有限制.

但是,在swift中默认情况下初始化方法是不能写return语句来返回值的,也就是说我们没有机会初始化一个Optional的值.



#### static和class

Swift中表示"类型范围作用域"这一概念有两个不同的关键字,它们分别是static和class.

有一个比较特殊的是protocol.在swift中class,strust和enum都是可以实现某个``protocol``的,那么如果我们想在``protocol``里定义一个类型域上的方法或者计算属性的话,应该使用``static``进行定义



#### 可选协议和协议扩展

Objective-c中的protocol里存在@optional关键字,被这个关键字修饰的方法并非必须要被实现.我们可以通过协议定义一系列方法,然后由实现协议的类选择性的实现其中几个方法.在cocoa API中很多情况下协议方法都是可选的,这点和swift中的protocol的所有方法都必须被实现这一特性完全不同.



#### 局部scope

> 代码块

在Objective-c中有一个很棒的技巧是使用GNU C的声明扩展来在限制局部作用域的时候同时进行赋值,运用得当的话,可以使代码更加紧凑和整洁.如

```objective-c
self.titleLabel = ({
    UILabel *label = [[UILabel alloc]init];
    label;
})
```

swift里没有GNU C的扩展,但是使用匿名的闭包的话,也可以写出类似的代码:

```swift
let titleLabel: UILabel = {
    let label = UILabel()
    return label
}
```



#### 断言

断言在遇到无法处理的输入时,运行会产生错误,保留堆栈,并抛出我们预设的信息,用来提醒调用这段代码的用户.

断言的另一个有点是它是一个开发时的特性,只有在Debug编译的时候有效,而在运行时是不被编译执行的,因此断言并不会消耗运行时的性能.



#### 属性访问控制

Swift中由低至高提供了private, fileprivate, internal, public 和 open五种访问控制的权限.默认的internal在绝大部分时候是适用的,另外由于它是swift中的默认的控制级,因此它也是最为方便的.



#### 闭包歧义



#### 尾递归

