
date: 2018-11-28 20:17:43
pid: 19012408;
tag: iOS;

---

# iOS-WKWebview和JavaScript交互

<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-WKWebView-02.png" width="600" align=center>

学习WKWebview和JavaScript交互,了解JSCore和JSPatch的原理和实现,了解Hybird混合应用<!--more-->

### WKWebview

<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/blog-wkwebview-01.png" width="600" align=center>

首先来看WKWebView,官方给出的介绍是在iOS8以后推荐使用WKWebView来代替UIWebView.它的加载速度比UIWebView快了很多,内存占用率却少了很多,解决了加载网页时的内存泄漏问题.

要允许用户在web历史页面中前进或者后退,为按钮设置使用``goBack``和``goForward``方法的动作.

可以获取h5中的标题和添加进度条放大哦一起展示.在初始化webview时,添加两个观察者分别用来监听webview的``estimatedProgress``和title属性.

WKWebView有两个代理:

#### WKUIDelegate

主要是用来处理使用系统的弹框来替换JS中的一些弹框的,比如警告框,选择框,输入框

````Objective-c
//显示一个 JavaScript 警告面板
- (void)webView:(WKWebView *)webView runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(void))completionHandler;

//显示一个 JavaScript 确认面板
- (void)webView:(WKWebView *)webView runJavaScriptConfirmPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(BOOL result))completionHandler;

//显示一个 JavaScript 文本输入面板
- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(nullable NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSString * _Nullable result))completionHandler;
````

#### WKNavigationDelegate

协议方法可以帮助你实现在web视图接受,加载和完成导航请求的过程中触发的自定义行为.这里主要介绍两种方法

````objective-c
// 在发送请求之前，决定是否允许或取消导航。
- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler;

// 收到响应后，决定是否允许或取消导航。
- (void)webView:(WKWebView *)webView decidePolicyForNavigationResponse:(WKNavigationResponse *)navigationResponse decisionHandler:(void (^)(WKNavigationResponsePolicy))decisionHandler;
````

#### WKHTTPCookieStore

从WKWebsiteDataStore的实例对象的属性httpCookieStore可获取一个WKHTTPCookieStore的实例对象,通过此对象,我们可以对cookie进行相关的操作.

````objective-c
/*!  查找所有已存储的cookie
 */
- (void)getAllCookies:(void (^)(NSArray<NSHTTPCookie *> *))completionHandler;

/*! 保存一个cookie, 保存成功后, 会走一次回调方法
 */
- (void)setCookie:(NSHTTPCookie *)cookie completionHandler:(nullable void (^)(void))completionHandler;

/*! 删除一个cookie, 待删除的cookie对象可通过 'getAllCookies' 方法获取
 */
- (void)deleteCookie:(NSHTTPCookie *)cookie completionHandler:(nullable void (^)(void))completionHandler;

/*! 添加一个观察者, 需要遵循协议 WKHTTPCookieStoreObserver 
当cookie发送变化时, 会通过 WKHTTPCookieStoreObserver 的协议方法通知该观察者, 在使用完后需要移除观察者
 */
- (void)addObserver:(id<WKHTTPCookieStoreObserver>)observer;

/*! 移除观察者
 */
- (void)removeObserver:(id<WKHTTPCookieStoreObserver>)observer;

````

#### WKUserContentController

WKUserContentController是JavaScript与原生进行交互的桥梁.

````objective-c
// 注入JavaScript与原生交互协议
// JS 端可通过 window.webkit.messageHandlers.<name>.postMessage(<messageBody>) 发送消息
- (void)addScriptMessageHandler:(id <WKScriptMessageHandler>)scriptMessageHandler name:(NSString *)name;
// 移除注入的协议, 在deinit方法中调用
- (void)removeScriptMessageHandlerForName:(NSString *)name;

// 通过WKUserScript注入需要执行的JavaScript代码
- (void)addUserScript:(WKUserScript *)userScript;
// 移除所有注入的JavaScript代码
- (void)removeAllUserScripts;
````

使用WKUserContentController注入的交互协议, 需要遵循WKScriptMessageHandler协议, 在其协议方法中获取JavaScript端传递的事件和参数:

````objective-c
//响应js传到端的消息
- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message;
````

从上文可以看到,WKWebView和JavaScript交互是应用的*WKUIDelegate*和*WKUserContentController*

### JavaScript调用Native

苹果在开放WKWebView这个性能全方位碾压UIWebView的web组件后，也大幅更改了JS与Native交互的方式，提供了专有的交互API:scriptMessageHandler

### WKWebView调用JavaScript

WKWebView发起调用JS,主要有evaluatingJavaScript,还有WKUserScript这个方式可以执行JS代码,他们之间的区别是:
* evaluatingJavaScript 是在客户端执行这条代码的时候立刻去执行当条JS代码

* WKUserScript 是预先准备好JS代码，当WKWebView加载Dom的时候，执行当条JS代码(只能在WebView加载时期发起,并不能再任意时刻发起通信)

这种通信方案并不能随时随地地进行通信,不适合作为设计bridge的核心方案

### JavaScriptCore框架

JavaScriptCore框架是iOS7之后提供给开发者的系统级的framework,JavaScriptCore是苹果的safari浏览器引擎WebKit中重要组成部分,这个引擎已经存在多年.JavaScriptCore框架给swift,oc以及c语音编写的app提供了调用JS程序的能力.也可以使用JavaScriptCore向JS环境中去插入一些自定义对象.

JSCore内部主要的类有:
* JSContext

JSContext表示JS执行上下文,当JS在执行的过程中,都可以通过JSContext来获取执行时的数据,比如某个对象的值.

* JSVirtualMachine

JS运行的虚拟机,有独立的堆空间和垃圾回收机制,它主要为JS执行提供资源保障.

* JSValue

JSValue用来JS和OC中数据转换,它用来表示JS中的数据.我们需要明确一点,JSValue可以是一个JS函数.

* JSExport

主要用来把OC中的属性和方法导出到JS环境中,方便在JS调用OC.

JS与OC通信,目前主要的方式有两种:(JS调用OC中的方法)
* 通过JSCore中的block(**主要使用**):简单直接,**JSPatch**就是通过这种方式来实现JS调用Native的

在使用block的时候要主要,**不要再block中直接舒勇JSValue和JSContext**.
因为block会强引用它里面用到的外部变量,如果啊直接在Block中使用JSValue的话，那么这个JSvalue就会被这个Block强引用，而每个JSValue都是强引用着它所属的那个JSContext的，这是前面说过的，而这个Block又是注入到这个Context中，所以这个Block会被context强引用，这样会造成循环引用，导致内存泄露。不能直接使用JSContext的原因同理。

* 通过JSCore中的JSExport协议可以很方便的将OC中的对象暴露给JS使用,且在JS中用起来就和JS对象一样.

声明一个自定义的协议并继承自JSExport协议.然后把实现这个自定义协议的对象暴露给JS时,JS就能像使用原生对象一样使用OC对象了.
```objective-c
@protocol MyPointExports <JSExport>
```

通过

OC与JS通信:(OC调用JS中的方法)
* 通过JScore来调用
* 通过UIWebView中可以获取JSContext
* 通过WKWebView来调用(**主要使用**):WKWebView没有提供获取JSContext的方法,但是它提供了执行JS的方法``evaluateJS:``,通过这个方法来执行JS代码.也是上面提到的WKWebView调用Native的方法.

#### demo

写了一个JavaScript和WkWebView交互的小demo,[点击这里](https://github.com/zphui5409/webViewForJS)

#### 拨号问题

在HTML中不能通过``<a href="tel:12345678">拨号</a>``来拨打iOS端的电话.需要在iOS端的WKNavigationDelegate中截取电话在使用原生进行调用拨打电话.其中的[navigationAction.request.URL.scheme isEqualToString:@"tel"]中的@"tel"是JS中的定义好，并iOS端需要知道的.发送请求前决定是否跳转，并在此拦截拨打电话的URL.

```objective-c
- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler
{
     /// <a href="tel:123456789">拨号</a>
     if ([navigationAction.request.URL.scheme isEqualToString:@"tel"]) 
     {
          decisionHandler(WKNavigationActionPolicyCancel);
          NSString * mutStr = [NSString stringWithFormat:@"telprompt://%@",navigationAction.request.URL.resourceSpecifier];
          if ([[UIApplication sharedApplication] canOpenURL:mutStr.URL]) 
          {
              if (iOS10()) 
              {
                  [[UIApplication sharedApplication] openURL:mutStr.URL options:@{} completionHandler:^(BOOL success) {}];
              } 
              else 
              {
                  [[UIApplication sharedApplication] openURL:mutStr.URL];
              }
          }
       } 
       else 
       {
           decisionHandler(WKNavigationActionPolicyAllow);
       }
}
```

### 参考文章

本文一些内容参考了:
[知识小集的"一份走心的JS-Native交互"]
[从零收拾一个hybrid框架](http://awhisper.github.io/2018/01/02/hybrid-jscomunication/)
[iOS WKWebView使用总结](https://www.jianshu.com/p/20cfd4f8c4ff)
[深入浅出 JavaScriptCore](https://www.jianshu.com/p/3f5dc8042dfc)
