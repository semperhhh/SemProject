
date: 2017-04-05 21:28:35
pid: 19012401;
tag: iOS;

---

# iOS 接入webSocket

> 前段时间用到了webSocket,在某度了好久之后还是没有发现一些比较全面的,所以自己记录下来一点

首先导入了square大神的SocketRocket(简称SR,应该是iOS端webSocket采用比较多的框架),比较简单,发送消息参数需要和后台约定好

#### 1> 创建SRWebSocket
我这边创建了一个webSocket的单例类,在单例类里实例化SRWebSocket并且设置代理

~~~objective-c
SRWebSocket *webSocket;
webSocket.delegate = nil;
[webSocket close];
webSocket = [[SRWebSocket alloc]initWithURLRequest:url];//这里的url是一个遵守ws协议的开头是'ws://'的
webSocket.delegate = self;	//记得要遵守协议<SRWebSocketDelegate>,实现delegate方法
[webSocket open];	//打开socket通道

--<SRWebSocketDelegate>
- (void)webSocketDidOpen:(SRWebSocket *)webSocket;{
	NSLog(@"当进入这个代理方法的时候说明socket通道已经打开");
}

- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error {
    NSLog(@"连接失败，这里可以实现掉线自动重连");
}

- (void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean;{

	[webSocket close];	//关闭socket
	webSocket = nil;
    NSLog(@"socket通道断开了,断开一般是服务器主动断开的,这个时候可以进行重连");
   

}

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(id)message;{

    NSLog(@"Received \"%@\"", message);
    NSLog(@"这里是收到服务器推来的消息 一般是JSON格式");
}

- (void)sendData:(id)data {

 	if (socket.readyState == SR_OPEN) {

 		[socket send:data];    // 发送数据,这里要socket打开才能发送,不然会crashes
 	}
}




~~~

