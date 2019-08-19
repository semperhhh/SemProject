pid: 190516;
tag: iOS;
---


## iOS-渐变色实现方案

​	view添加渐变色常规方案有两种:

* CAGradientLayout
* Core Graphics

CAGradientLayout是方便常用的.

### CAGradientLayout

```objective-c
    CAGradientLayer *gradient = [CAGradientLayer layer];
    gradient.startPoint = CGPointMake(0.5, 0);
    gradient.endPoint = CGPointMake(0.5, 0.74);
    gradient.locations = @[@(0), @(1)];
    gradient.colors = @[(__bridge id)HWColorEX(0x575757).CGColor, (__bridge id)HWColorEX(0x2C2C2C).CGColor];//这里要桥接一下颜色
    gradient.frame = CGRectMake(0, 0, Screen_Width, HWSize(200) + KSafeTop);
    [self.view.layer insertSublayer:gradient atIndex:0];
```

很方便,也很好用,但是很吃性能.

而且在给添加了image的button设置渐变的时候会有image不显示的问题.

### Core Graphics
使用Core Graphics画一个渐变的图片,添加图片为背景图片

````objective-c

typedef NS_ENUM(NSInteger, GradientType) {
    GradientFromTopToBottom = 1,            //从上到下
    GradientFromLeftToRight,                //从做到右
    GradientFromLeftTopToRightBottom,       //从上到下
    GradientFromLeftBottomToRightTop        //从上到下
};

- (UIImage *)createImageWithSize:(CGSize)imageSize gradientColors:(NSArray *)colors  gradientType:(GradientType)gradientType {
    
    NSAssert(colors.count <= 5, @"输入颜色数量过多，如果需求数量过大，请修改colors数组的个数");
    
    NSMutableArray *ar = [NSMutableArray array];
    for(UIColor *c in colors) {
        [ar addObject:(id)c.CGColor];
    }
    
    
    UIGraphicsBeginImageContextWithOptions(imageSize, YES, 1);
    CGContextRef context = UIGraphicsGetCurrentContext();
    CGContextSaveGState(context);
    CGColorSpaceRef colorSpace = CGColorGetColorSpace([[colors lastObject] CGColor]);
    CGGradientRef gradient = CGGradientCreateWithColors(colorSpace, (CFArrayRef)ar, NULL);
    CGPoint start;
    CGPoint end;
    switch (gradientType) {
        case GradientFromTopToBottom:
            start = CGPointMake(imageSize.width/2, 0.0);
            end = CGPointMake(imageSize.width/2, imageSize.height);
            break;
        case GradientFromLeftToRight:
            start = CGPointMake(0.0, imageSize.height/2);
            end = CGPointMake(imageSize.width, imageSize.height/2);
            break;
        case GradientFromLeftTopToRightBottom:
            start = CGPointMake(0.0, 0.0);
            end = CGPointMake(imageSize.width, imageSize.height);
            break;
        case GradientFromLeftBottomToRightTop:
            start = CGPointMake(0.0, imageSize.height);
            end = CGPointMake(imageSize.width, 0.0);
            break;
        default:
            break;
    }
    CGContextDrawLinearGradient(context, gradient, start, end, kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation);
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    CGGradientRelease(gradient);
    CGContextRestoreGState(context);
    CGColorSpaceRelease(colorSpace);
    UIGraphicsEndImageContext();//关闭上下文
    return image;
}
````
