### Swift的解包

swift的?进行了哪些操作?

```Swift

let int1: Int? = 2
print(int1) // Optional(2)

使用po查看
 Optional<Int>
  - some : 2

```

可以看到int1是``Optional<Int>``中的some属性,现在声明一个int2

```Swift
let int13: Optional<Int> = 3
print(int13) // Optional(3)
使用po查看
 Optional<Int>
  - some : 3

```

即``int?``等价于``Optional<Int>``.

```Swift

@frozen public enum Optional<Wrapped> : ExpressibleByNilLiteral {
    case none
    case some(Wrapped)
    public init(_ some: Wrapped)
    @inlinable public func map<U>(_ transform: (Wrapped) throws -> U) rethrows -> U?
    @inlinable public func flatMap<U>(_ transform: (Wrapped) throws -> U?) rethrows -> U?
    public init(nilLiteral: ())
    @inlinable public var unsafelyUnwrapped: Wrapped { get }
    public static func ~= (lhs: _OptionalNilComparisonType, rhs: Wrapped?) -> Bool
    public static func == (lhs: Wrapped?, rhs: _OptionalNilComparisonType) -> Bool
    public static func != (lhs: Wrapped?, rhs: _OptionalNilComparisonType) -> Bool
    public static func == (lhs: _OptionalNilComparisonType, rhs: Wrapped?) -> Bool
    public static func != (lhs: _OptionalNilComparisonType, rhs: Wrapped?) -> Bool
}

```

command点击跳到Optional的文件中,Optional是一个enum的枚举,定义了两个值,一个是none,一个是有泛型关联值<Wrapped>的some.我们的int1就是存放在some的关联值中.
Optional遵守协议``ExpressibleByNilLiteral``,使Optional可以通过nil初始化.

所以Swift的可选类型本质是枚举.
