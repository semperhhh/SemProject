#### Swift还需要__block吗?



在oc的block中,block会捕获变量.



```objective-c
@interface ViewController ()
@property (nonatomic, copy) void (^blk)(void);
@property (nonatomic, assign) int i3;
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
    int i = 1;
    __block int i2 = 10;
    _i3 = 100;
    __weak ViewController *weakSelf = self;
    _blk = ^{
        printf("%d\n", i);
        printf("%d\n", i2);
        printf("%d\n", weakSelf.i3);
    };
    i = 2;
    i2 = 20;
    _i3 = 200;
    _blk();
}
// log
1
20
200
```

使用``__block``可以



在swift的closure闭包中,还需要吗?



```swift

class ViewController: UIViewController {

    var int2 = 10

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.

        var int1: Int = 1
        closure = { [weak self] in
            guard let strongSelf = self else {
                return
            }
            print(int1)
            print(strongSelf.int2)
        }
        int1 = 2
        int2 = 20
        closure?()
    }
}

// log
2
20
```



这里是引用的int2,并没有将int2捕获到closure中的



```swift
override func viewDidLoad() {
        super.viewDidLoad()
        var int2: Int? = 1

        closure = { i in
            DispatchQueue.global().async {
                print(i)
                sleep(5);
                print(i)
            }
        }

        closure?(int2 ?? 0)
        print("sn")
        sleep(2)
        int2 = 2
}

// log
sn
1
1
```



closure将变量int2捕获到内部并保存值,外面的int2发生变化的时候内部的值不会改变.



#### swift还需要StrongSelf吗?

swift中的weakSelf



```swift
class SecondViewController: UIViewController {

    var a = 10
    var b = 20
    var someClosure: (() -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.

        view.backgroundColor = UIColor.blue

        someClosure = {
            DispatchQueue.global().async {
              	print("someClosure carry out", self.a)
                sleep(4)
                print("someClosure carry out", self.a)
            }
        }
        someClosure?()
    }

    deinit {
        print("second deinit")
    }

}

```

上面的代码中, self引用someClosure,someClosure引用self,push后pop的话4s后print会执行,但是vc也因为循环引用不会释放.

如果改成弱引用,则不会执行第二次的``someClosure carry out``,当pop的时候vc被释放,self?解包失败,则不会执行,但也不会crach.

```swift
class SecondViewController: UIViewController {

    var a = 10
    var b = 20
    var someClosure: (() -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.

        view.backgroundColor = UIColor.blue

        someClosure = { [weak self] in
            if let strongSelf = self {
                DispatchQueue.global().async {
                    sleep(4)
                    print("someClosure carry out", strongSelf.a)
                }
            }
        }
        someClosure?()
    }

    deinit {
        print("second deinit")
    }
}

// log 4s后
someClosure carry out 10
second deinit
```



someclosure在pop后执行了,执行完毕后vc被释放,所以stongSelf可以在闭包作用域内防止self被提前释放.

所以为了防止中途self被释放,最好强引用一下self.