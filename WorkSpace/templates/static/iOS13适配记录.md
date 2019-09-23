## iOS13适配



#### textfield的placeholder

iOS13以前,我们可以通过kvc设置textField的placeholder的私有属性,例如

```objective-c
// 修改占位字符颜色
[self.textField setValue:self.placeholderColor forKeyPath:@"_placeholderLabel.textColor"];
```

ios13以后,系统禁用了这种方法,调用会闪退.使用新的方法

```objective-c
//uitextfield有attributedPlaceholder的富文本方法,使用它来改变占位字符的样式
textField.attributedPlaceholder = [[NSAttributedString alloc]initWithString:@"占位" attributes:@{NSForegroundColorAttributeName: HWColorEX(0x939393), NSFontAttributeName: HWFont(12)}];
```



#### textField的leftView

iOS13以前,通过设置leftView为imageView,同时给imageView设置frame,则可以控制leftview的大小

```objective-c
    UIImageView *imgView = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"home_seach"]];
    imgview.frame = CGRectMake(0, 0, HWSize(25), HWSize(25));
    imgView.contentMode = UIViewContentModeScaleAspectFit;
    searchField.leftViewMode = UITextFieldViewModeAlways;
    searchField.leftView = imgView;
```

iOS13后,方法失效了,现在可以采用一个继承自``UITextField``的子类,重写子类的``leftViewRectForBounds``方法.

```objective-c
-(CGRect)leftViewRectForBounds:(CGRect)bounds {

    return CGRect;
}
```



#### presentViewController的模式

ios13新增了一种present的模式``UIModalPresentationAutomatic``并且设置为默认的

可以通过手动修改``modalPresentationStyle``

````objective-c
result.modalPresentationStyle = UIModalPresentationFullScreen;
[vc presentViewController:result animated:false completion:nil];
````

<img src="../../images/imgs/190923/190923_01.png" style="width:300px">

<img src="../../images/imgs/190923/190923_02.png" style="width:300px">