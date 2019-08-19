
date: 2018-12-01 21:11:58
pid: 19012409;
tag: iOS;

---

# iOS-控件封装为framework来使用

<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog_framework01.png" width="600" align=center>

通过将自己的控件封装成framework静态库来使用,可以在不暴露代码的所有实现细节的前提下和他人分享控件.另外通过自己封装的过程也可以对日常使用他人的库有更多的了解,
或者在实现模块化的时候可以把固定的业务模块化成静态库.<!--more-->

### framework静态库创建

在iOS中,静态库有两种:
``.a``:一个纯二进制文件,需要有.h文件配合使用
``.framework``:包含二进制文件和.h文件,还有资源文件

&ensp;<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-framework/blog-framework11.png">
在xcode中,我们可以在已有控件项目中通过添加新的targets来创建静态库,第一个是创建.framework,第二个是创建.a

&ensp;<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-framework/blog-framework02.png">
这里我们需要把Mach-O type改为``Static Library``,因为制作的是一个静态库

&ensp;<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-framework/blog-framework03.png">
把Build Settings -> Architectures -> Build Active Architecture Only -> Release 选择NO，Yes表示只编译选中模拟器设备对应的架构，No则为编译所有模拟器设备支持的cup架构(Debug版本同理，提供给他人是使用时，建议Debug也选中NO)

&ensp;<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-framework/blog-framework04.png">
创建后会生成一个项目,这里的.h要放我们项目中需要暴露给他人调用的头文件,主要需要使用<包名/头文件名.h>,因为在实际使用framework的时候是需要从保重搜索头文件的.

&ensp;<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-framework/blog-framework05.png">
在.h中import后,还需要在``Build Phases - Headers``中把对应的头文件放到``Public``中

我们在测试添加的文件中写一个log方法

&ensp;<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-framework/blog-framework06.png">

选择模拟器进行编译,然后在``Products``中找到framework右击查看``Show In Finder``
其中*Debug-ophonesimulator*中的包就是在debug模式下模拟器可以运行的.framework包,对应的还有*relese*模式的模拟器包和真机包,我们要做的就是讲relese下的模拟器和真机进行合并,因为我们通常使用的framework包都是一个.

#### 合并两种类型的framework

> 这里有两种方法,一种是通过脚本操作,另一种是通过``lipo``命令行操作,这里介绍第二种

lipo源于mac系统要制作兼容powerpc平台和intel平台的程序.是一个在MacOSX中处理通用程序的工具.常用方法有下面3种:

* 查看静态库支持的CPU架构

```
lipo -info libname.a(或者libname.framework/libname)
```

* 合并静态库

```
lipo -create 静态库存放路径1  静态库存放路径2 ...  -output 整合后存放的路径
```

对framework只需要合并.a文件就可以

* 静态库拆分

```
lipo 静态库源文件路径 -thin CPU架构名称 -output 拆分后文件存放路径
```

将合并后的.a文件替换原本包中的.a,至此,一个简单的framework包就完成了

### framework静态库添加.bundle文件资源

当framework中需要依赖一些图片资源等,可以做一个bundle存放图片资源,然后在``Copy Bundle Resources``中添加依赖

新建一个bundle的targets
<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-framework/blog-framework07.png">

设置

* Build Settings修改Base SDK->Latest iOS

* Build Phases将需要的xib，图片资源添加到Copy Bundle Resources

* Combine High Resolution Artwork 或 COMBINE_HIDPI_IMAGES
这两项一个是OSX下的名字,一个是iOS下的名字,改为NO才可以存图片,不然存进去是tiff
然后build就会生成需要bundle文件

添加图片到bundle
<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-framework/blog-framework08.png">

添加依赖
<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-framework/blog-framework09.png">

这样就可以在framework中引用这些图片资源

### framework包对于其他一些第三方库的依赖

在实际应用中,我们的framework包往往会依赖一些第三方的库,比如常见的AFNetworking,SDWebimage等,这些库往往主工程是包含的,如果在framework中再添加,就会引起类重复的冲突.一般有两种处理方法

* 修改引用库中所有类的类名,添加上我们自己的类头

这种方法对于小一些或者说类少一些的库来说比较合适

* 添加这些库的时候只引用

我们可以在添加库的时候只引用,然后在framework中引用对应的头文件,这样可以保证``build succeeded``编译成功,而且framework中不会打包进去对应的类文件.
但是已经有了依赖,就需要在主工程中添加对应的库,这里要注意的是,如果作为SDK给第三方使用,要确定framework中依赖库的版本,因为有些库版本改变可能引起对应文件的不同.比如AFNetworking的``2.x``版本和``3.x``版本之间

<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-framework/blog-framework10.png">

不要勾选``Add To Terget``

### Demo

自己写了一个关于alertView控件的demo,放到了github上,[地址点这里](https://github.com/zphui5409/ZPHAlertView)

希望大家可以指出在文章中的问题,共同学习
