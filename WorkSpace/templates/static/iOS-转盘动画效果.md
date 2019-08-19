
date: 2018-11-20 10:12:21
pid: 19012403;
tag: iOS;

---

# iOS-转盘动画效果

> 使用贝塞尔曲线和核心动画实现一个自定义转盘效果

<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/iOS0005.png" width="300" hegiht="300" align=center>

###  画圆

使用贝塞尔曲线画圆,首先涉及到uiview的`drawRect`,`drawRect` 的作用是重写该方法以实现自定义的绘制内容.<!--more-->

#### drawRect调用场景

* 视图第一次显示的时候会调用,系统自动调用;
* 如果在uiview初始化时没有实质rect大小,将直接导致drawrect不被自动调用;
* 该方法在调用sizeThatFits后被调用,所以可以先调用`sizetoFit`计算出size,然后系统自动调用`drawRect`方法
* 通过设置`contentMode`属性值为`UIViewContentModeRedraw`,那么将在每次设置或更改`frame`的时候自动调用`drawRect:`;
* 直接调用`setNeedsDisplay`，或者`setNeedsDisplayInRect:`触发`drawRect:`，但是有个前提条件是`rect`不能为0;

#### drawRect重绘方法定义

-  `- (void)drawRect:(CGRect)rect;`:重写此方法，执行重绘任务;
-  `- (void)setNeedsDisplay;`:标记为需要重绘，异步调用drawRect，但是绘制视图的动作需要等到下一个绘制周期执行，并非调用该方法立即执行;
-  `- (void)setNeedsDisplayInRect:(CGRect)rect;`:标记为需要局部重绘，具体调用时机同上;

####  drawRect使用注意事项

- 如果子类直接继承自`UIView`,则在`drawRect`  方法中不需要调用`super`方法。若子类继承自其他`View`类则需要调用`super`方法以实现重绘。
- 若使用`UIView`绘图，只能在`drawRect:`方法中获取绘制视图的contextRef。在其他方法中获取的contextRef都是不生效的；
-  `drawRect:`方法不能手动调用，需要调用实例方法`setNeedsDisplay`或者`setNeedsDisplayInRect`,让系统自动调用该方法；
- 若使用`CALayer`绘图，只能在`drawInContext :`绘制，或者在`delegate`方法中进行绘制，然后调用`setNeedDisplay`方法实现最终的绘制；
- 若要实时画图，不能使用gestureRecognizer，只能使用touchbegan等方法来掉用setNeedsDisplay实时刷新屏幕 ------这个阐述需要调整
-  `UIImageView`继承自`UIView`,但是`UIImageView`能不重写`drawRect`方法用于实现自定义绘图.

#### 画圆实现

<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/iOS0006.png" width=250 height=250 align=center>

方法1.使用UIBezierPath画扇形

~~~objective-c
CGFloat kRadius = self.bounds.size.width/2;//半径
CGFloat pathProportion = M_PI*2/_array.count;//扇形占比.M_PI *2是一个圆

UIColor *color = UIColorRandom;
[color set];//填充颜色
     
UIBezierPath *path = [UIBezierPath bezierPath];
path.lineWidth = 2.0;
path.lineCapStyle = kCGLineCapRound;
path.lineJoinStyle = kCGLineJoinRound;
//设置起始点
[path moveToPoint:CGPointMake(kRadius, kRadius)];
//添加路径 clockwise yes:顺时针/no:逆时针
//从右端开始顺时针为0
//M_PI = 半圆
[path addArcWithCenter:CGPointMake(kRadius, kRadius) radius:kRadius startAngle:startPath endAngle:endPath clockwise:YES];
[path closePath];
[path fill];//填充颜色
//[path stroke];//颜色描边
~~~

方法2.使用上下文画扇形

~~~~objective-c
       //获取上下文
        CGContextRef ctx = UIGraphicsGetCurrentContext();
        //设置填充颜色
        CGContextSetFillColor(ctx, CGColorGetComponents([UIColorRandom CGColor]));
        //移动画笔
        CGContextMoveToPoint(ctx, center.x, center.y);
        //画扇形
        CGContextAddArc(ctx, center.x, center.y, kRadius, startPath, endPath, 0);
        //填充
        CGContextFillPath(ctx);
        
        //画中间的白色分割线
        CGContextSetRGBStrokeColor(ctx, 1, 1, 1, 1);
        //设置线条宽度
        CGContextSetLineWidth(ctx, 2);
        CGContextMoveToPoint(ctx, center.x, center.y);
        //算出线另一端坐标
        CGPoint point1 = CGPointMake(center.x +kRadius*cos(startPath), center.y +kRadius *sin(startPath));
        //画线
        CGContextAddLineToPoint(ctx, point1.x, point1.y);
        CGContextStrokePath(ctx);

~~~~

方法2相比方法1,更容易画出分割的白线

### 转动动画

核心动画类中可以直接使用的类有:

```objective-c
1. CABasicAnimation  基础动画
    
2. CAKeyframeAnimation  关键帧动画
    
3. CATransition 转场动画
    
4. CAAnimationGroup 组动画
    
5. CASpringAnimation 弹性动画 （iOS9.0之后，它实现弹簧效果的动画，是CABasicAnimation的子类。）
```

#### CAAnimation的属性

**duration**: 动画持续时间,默认0.25秒

**speed**: 速度

**timeOffset**: 设置动画线的起始结束时间点

**autoreverses**: 是否自动回到动画开始状态

**repeatCount**: 动画的重复次数

**repeatDuration**: 动画的重复时间

**removedOnCompletion**：默认为YES，代表动画执行完毕后就从图层上移除，图形会恢复到动画执行前的状态。如果想让图层保持显示动画执行后的状态，那就设置为NO，不过还要设置fillMode属性为kCAFillModeForwards。比如进入后台回来动画依然执行，可以使用这个属性。

**fillMode**：决定当前对象在非active时间段的行为。比如动画开始之前，动画结束之后.

枚举参数:

````objective-c
kCAFillModeRemoved  这个是默认值，也就是说当动画开始前和动画结束后，动画对layer都没有影响，动画结束后，layer会恢复到之前的状态
kCAFillModeForwards  当动画结束后，layer会一直保持着动画最后的状态
kCAFillModeBackwards  在动画开始前，只需要将动画加入了一个layer，layer便立即进入动画的初始状态并等待动画开始。
kCAFillModeBoth  这个其实就是上面两个的合成.动画加入后开始之前，layer便处于动画初始状态，动画结束后layer保持动画最后的状态
````



**beginTime**：可以用来设置动画延迟执行时间, 若想延迟2s, 就设置为CACurrentMediaTime() + 2，CACurrentMediaTime()为图层的当前时间. CALayer 的beginTime 一般用于动画暂停的使用，CAAnimation 的beginTime一般用于动画延迟执行，但只在使用groupAnimation的时候生效，直接添加在layer上的animation使用会导致动画不执行.

**timingFunction**：速度控制函数，控制动画运行的节奏

枚举参数：

````objective-c
kCAMediaTimingFunctionLinear  时间曲线函数，匀速
kCAMediaTimingFunctionEaseIn  时间曲线函数，由慢到特别快
kCAMediaTimingFunctionEaseOut  时间曲线函数，由快到慢
kCAMediaTimingFunctionEaseInEaseOut  时间曲线函数，由慢到快
kCAMediaTimingFunctionDefault   系统默认
````

#### 转动实现

~~~~objective-c
	CABasicAnimation *rotationAnimation = [CABasicAnimation animationWithKeyPath:@"transform.rotation.z"];
    double endValue = _startValue+(rand()%100)/100.0 * M_PI + M_PI*(rand()%5+5);//endvalue单位是弧度,2PI是一圈
    
    //设置旋转的起始值与终止值
    rotationAnimation.fromValue = @(_startValue);
    rotationAnimation.toValue = @(endValue);
    
    //旋转时长
    rotationAnimation.duration = (endValue - _startValue)/(M_PI *2);
    rotationAnimation.autoreverses = NO;//设置这个属性表示完成动画后会回到执行动画之前的状态
    rotationAnimation.removedOnCompletion = NO;//动画结束后移除
    
    //速度函数
    rotationAnimation.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
    rotationAnimation.fillMode = kCAFillModeBoth;//动画开始前，layer处于动画开始那一刻的状态；动画结束后，layer处于动画结束那一刻的状态
    [self.circleView.layer addAnimation:rotationAnimation forKey:@"TurnTableAnimation"];
    
    //记下当前旋转的位置，作为下一次旋转的起始值
    _startValue = endValue;
~~~~

### 参考链接

[谈谈对drawRect的理解](https://www.jianshu.com/p/7242bc413ca8)
