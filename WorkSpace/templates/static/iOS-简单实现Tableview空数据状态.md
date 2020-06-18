## 简单实现TableView空数据展示



tableview的空数据状态的展示是开发中最常见的UI展示.简单实现tableview的空列表状态,我主要想到了两种方法.

#### 方法1:扩展TableView方法

一种是在数据代理方法``func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int``时,同时判断是否空数据,在tableview的扩展中,因为tableview每次在加载\更新数据``reloadData``时,都会调用代理方法,可以实时判断``Tableview``的数据状态,实现空数据的状态的展示.这种方法比较简单.

```swift
//MARK: - tableView
extension UITableView {
    //扩展的空数据方法,这里使用了backgroundView,也可以新建其他view
    func tableViewEmpty(_ listCount: Int) {
        
        if listCount == 0 {
            
            let bgView = UIView()
            
            let bgview1 = ZPHScrollerEmptyView(frame: CGRect(x: self.bounds.width / 5 * 2, y: self.bounds.height / 4, width: self.bounds.width / 5, height: self.bounds.width / 5 + 30))
            bgView.addSubview(bgview1)

            self.backgroundView = bgView
            
        }else {
            
            self.backgroundView = nil
        }
    }
}

//在controller中实现的代理方法
extension ZPHMatchViewController: UITableViewDataSource, UITableViewDelegate {
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        //tableview数据变化是调用reloadData,raloadData会调用代理方法,同时通过我们扩展的方法判断是否展示空数据
        self.tableView.tableViewEmpty(self.dataList.count)
        return self.dataList.count
    }
}
```



#### 方法2:使用runtime给tableview扩展一个代理方法

上面的方法很有效,但是从一个高追求的程序员来看不完美(手动狗头),想像UIKit这样通过代理的方法来实现给tableview传数据,这就需要用到runtime的方法交换.

扩展是不可以直接添加属性的,因为每个类在初始化的时候就已经分配好内存空间.所以我们需要用到关联属性.例如

```swift
struct AssociatedKeys {
    static var testDelegate: PHTableViewEmpty?
}

extension UITableView {
    
    var PHDelegate: PHTableViewEmpty? {
        set {
            objc_setAssociatedObject(self, &AssociatedKeys.testDelegate, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
            test()
        }
        get {
            return objc_getAssociatedObject(self, &AssociatedKeys.testDelegate) as? PHTableViewEmpty
        }
    }
}
```

tableView遵守这个代理协议,实现代理方法

```swift
tableview.PHDelegate = self	

extension ViewController: PHTableViewEmpty {
    
    func tableViewEmpty() -> Int {
        return 2
    }
}
```

tableview调用方法就可以得到当前的数据是否为空,但是在哪里调用呢?

我们知道``reloadData``的时候是会获取到tableview的最新数据的元素多少,所以在``reloadData``的时候调用扩展的方式是最合适的,具体操作可以通过runtime的方法调配,新建方法``newReloadData``替换``reloadData``,这样在每次调用reloadData的时候,就可以调用到新建的方法.

在OC中,每个继承自NSObject的对象,都会在初始化init之前执行``+load``,我们可以在这里面做方法调配.

> ``+load``:app启动的时候会加载所有的类,调用每个类的load.在扩展中实现的load方法,调用发生在类本身的load调用后,父类的load方法先于子类调用.

```objective-c
#import "UITableView+ph.h"
#import <objc/runtime.h>

@implementation UITableView (ph)

+ (void)load {
    
    NSLog(@"tableview load");
    
    Method oldReloadData = class_getInstanceMethod([self class], @selector(reloadData));
    Method newReloadData = class_getInstanceMethod([self class], @selector(newReloadData));
    method_exchangeImplementations(oldReloadData, newReloadData);
}

-(void)newReloadData {
    
    NSLog(@"new reloaddata");
    
    [self newReloadData];
}

@end

```

但是在swift中,load并不会主动调用...这里我们可以手动调用.

````swift
extension UITableView {
    
    func swizzle() {
        
        guard let m1 = class_getInstanceMethod(self.classForCoder, #selector(reloadData)) else { return  }
        
        guard let m2 = class_getInstanceMethod(self.classForCoder, #selector(newReloadData)) else { return }
        
        method_exchangeImplementations(m1, m2)
    }
    
    @objc func newReloadData() {
        
        print("newReloadData")
        self.newReloadData()
     		print("数据个数", self.PHDelegate?.tableViewEmpty() ?? 0)//这里调用代理方法获得数据是否为空
    }
}

````

在初始化tableview的时候需要调用swizzle(),例如:

```swift
lazy var tableview: UITableView = {

    let tableview = UITableView(frame: CGRect(x: 0, y: 0, width: self.view.bounds.width, height: 300), style: .plain)
    tableview.swizzle()
    tableview.backgroundColor = UIColor.yellow
    tableview.dataSource = self
    tableview.delegate = self

//        tableview.PHDelegate = self
    tableview.register(UITableViewCell.classForCoder(), forCellReuseIdentifier: "cell")
    return tableview
}()

```



---

但是感觉手动调用和方法1区别不大,没有实现自动判断.如果哪位同学有更好的方法或者文章有什么错误的地方,欢迎留言和指正!