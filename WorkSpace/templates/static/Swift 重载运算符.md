## Swift 重载运算符

```Swift

// MARK: 重载运算符
class Person {
    var name: String = ""
    var age: Int = 0
    var cardId: Int = 0

    init(name: String, age: Int, cardId: Int) {
        self.name = name
        self.age = age
        self.cardId = cardId
    }
}

var p1 = Person(name: "zhangsan", age: 10, cardId: 1) // 0x107857fd0
var p2 = Person(name: "zhangsan", age: 10, cardId: 1) // 0x107858000

if p1 === p2 {
    print("p1 === p2")
}

```

print不会打印,因为这两个person在内存中的地址是不同的.

swift是支持重载运算符的,``==``需要继承``Equatable``.

```Swift

class Person: Equatable {
    // 重写 ==
    static func == (lhs: Person, rhs: Person) -> Bool {
        lhs.cardId == rhs.cardId
    }
}

if p1 == p2 {
    print("p1 == p2")
}

// p1 == p2

```

Swift还提供了一个``Comparable``协议,继承自``Equatable``.

```Swift 
    static func < (lhs: Self, rhs: Self) -> Bool
    static func <= (lhs: Self, rhs: Self) -> Bool
    static func >= (lhs: Self, rhs: Self) -> Bool
    static func > (lhs: Self, rhs: Self) -> Bool

```

可以通过重写运算符实现类的比较

```Swift 

static func < (lhs: Person, rhs: Person) -> Bool {      
    lhs.age < rhs.age
}

```

#### struct的比较

swift中struct是值类型,可以直接作``==``的比较,但是``>``还是要继承Comparable.

```Swift

struct Animal: Comparable {
    static func < (lhs: Animal, rhs: Animal) -> Bool {
        lhs.age < rhs.age
    }

    static func == (lhs: Animal, rhs: Animal) -> Bool {
        lhs.age == rhs.age
    }
    var name: String
    var age: Int
}

var a1 = Animal(name: "dog", age: 1)
var a2 = Animal(name: "cog", age: 2)
if a1 < a2 {
    print("a1 < a2")
}

// a1 < a2

```


### Swift构造函数

上文的Person是通过复写``init()``构造函数,在swift中我们还可以定义其他的构造器

#### 可失败的构造器

```Swift

init?(name: String) {
    if name.isEmpty {
        return nil
}
    self.name = name
}

var p3 = Person(name: "")
if p3 == nil {
    print("person init fail") // 会打印,因为name是无效的,返回nil
}
print(p3)// nil

var p4 = Person(name: "123")
if let p44 = p4 {
    print("person init success")
} else {
    print("person init fail")
}
// log
// ▿ Optional<Person>
// ▿ some : <Person: 0x107911890>

```

通过init?构造的类是一个Optional类型的枚举,通过对swift中``?``的了解我们知道构造出来的就是一个可选类型的person.

#### 便利构造器

```Swift

convenience init() {
    self.init(name: "zhangsan", age: 1, cardId: 1)
}

```

便利构造器**必须**要调用同级的指定构造器.

#### 指定构造器

```Swift

class student: Person {
    var subName: String = ""
    init(subName: String) {
        super.init(name: "z", age: 1, cardId: 1)
        self.subName = subName
    }
}

```

指定构造器**必须**调用父类的构造器

### 通过字面量构造类

我们可以通过Person的name来初始化一个Person实例对象,这需要继承``ExpressibleByStringLiteral``

```Swift

class Person: Comparable, ExpressibleByStringLiteral {
    typealias StringLiteralType = String
    required init(stringLiteral value: String) {
        self.name = value
        self.age = 2
        self.cardId = 2
    }
}

var p5: Person = "zhaowu"
print(p5.age) // 2

```





