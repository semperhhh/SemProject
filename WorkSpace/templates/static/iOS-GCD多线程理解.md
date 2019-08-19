
date: 2018-09-13 21:19:01
pid: 19012404;
tag: iOS;

---

#  iOS-GCD多线程理解

<img src="https://blog-1256512148.cos.ap-beijing.myqcloud.com/iOS0001.png" width="300" hegiht="300" align=center>

> 买了&lt;Objective-C高级编程 iOS与OS X多线程和内存管理&gt;,发现自己以前理解的GCD多线程是错误的

以前理解的dispatch_async就会开一个新的线程去执行任务,其实是*不对*的.<!--more-->

按照书中理解的,*dispatch_get_main_queue*是一个主队列,这个队列是一个串行队列,是在主线程上执行的队列,也就是number=1的线程上.

全局队列*dispatch_get_global_queue(0, 0)*是一个全局的并行队列.

串行队列和并行队列的区别是:
&ensp;&ensp;串行队列中的任务是按先进先出的顺序执行的.
&ensp;&ensp;并行队列中的任务是允许同时多个线程去执行的.

*dispatch_sync*是同步追加任务到队列.追加任务会等待队列前面的任务执行完后再执行追加的任务.
*dispatch_async*是异步追加任务到队列.追加任务不会等待队列中的其他任务执行完成.(队列任务可以异步执行,你先走,不用管我)

#### 串行队列同步追加

追加到当前的线程中,会等待当前线程中前面的任务执行完毕后在执行追加的任务
~~~~swift
queue.sync {

    print("queue - \(Thread.current)")
}
~~~~

#### 串行队列异步追加

追加到串行队列的线程中,会等待串行队列中的任务执行完毕后执行追加的任务,当前线程不受影响
~~~~swift
queue.async {

    print("queue - \(Thread.current)")
}
~~~~

#### 并行队列同步追加

追加到当前的线程中,会等待当前线程.
~~~~swift
conQueue.sync {
            
    print("2 - \(Thread.current)")
}
~~~~

#### 并行队列异步追加

追加到并行队列的线程中,因为是并行队列,可以开启多个线程执行多个任务,不会等待.我们常用的就是这种
~~~~swift
conQueue.async {
            
    print("2 - \(Thread.current)")
}
~~~~

#### dispatch_barrier_async(栅栏函数)
> 在前面的函数全部执行完后执行barrier函数.要注意的是barrier函数只是会等待当前队列追加的函数执行完毕.对于常见的多个图片下载完成后合并的问题.如果是使用NSURLSession创建任务都在在同一个队列中,是可以实现的.
但如果是使用AFNetworking框架,其下载任务并不是都在一个队列中,而是各自开辟了新的队列去异步完成加载任务.所以barrier函数不会等待他们的完成.

~~~~objective-c
//同一个队列 异步并行 barrier
[self asyncConcurrent];//开辟了多个子线程,是等前面的回调都执行完后再执行barrier

//同一个队列 异步串行 barrier
[self asyncSerial];//开辟了一个子线程,是等前面的回调都执行完后再执行barrier

//不同队列 异步并行 barrier
[self diffAsyncConcurrent];//开辟多个子线程,不会等待前面的回调都完成


-(void)diffAsyncConcurrent {

for (int i=0; i<8; i++) {

dispatch_async(dispatch_get_global_queue(0, 0), ^{
[NSThread sleepForTimeInterval:2];
NSLog(@"%d -%@",i,[NSThread currentThread]);
});
}

dispatch_barrier_async(dispatch_get_global_queue(0, 0), ^{
NSLog(@"barrier");
});
dispatch_async(dispatch_get_global_queue(0, 0), ^{
NSLog(@"9 -%@",[NSThread currentThread]);
});
dispatch_async(dispatch_get_global_queue(0, 0), ^{
NSLog(@"0 -%@",[NSThread currentThread]);
});
}

-(void)asyncSerial {

dispatch_queue_t queue = dispatch_queue_create("queue", DISPATCH_QUEUE_SERIAL);


for (int i=0; i<8; i++) {

dispatch_async(queue, ^{
[NSThread sleepForTimeInterval:2];
NSLog(@"%d -%@",i,[NSThread currentThread]);
});
}

dispatch_barrier_async(queue, ^{
NSLog(@"barrier");
});
dispatch_async(queue, ^{
NSLog(@"9 -%@",[NSThread currentThread]);
});
dispatch_async(queue, ^{
NSLog(@"0 -%@",[NSThread currentThread]);
});
}


-(void)asyncConcurrent {

dispatch_queue_t queue = dispatch_queue_create("queue", DISPATCH_QUEUE_CONCURRENT);

for (int i=0; i<8; i++) {

dispatch_async(queue, ^{
[NSThread sleepForTimeInterval:2];
NSLog(@"%d -%@",i,[NSThread currentThread]);
});
}

dispatch_barrier_async(queue, ^{
NSLog(@"barrier");
});
dispatch_async(queue, ^{
NSLog(@"9 -%@",[NSThread currentThread]);
});
dispatch_async(queue, ^{
NSLog(@"0 -%@",[NSThread currentThread]);
});
}
~~~~

### dispatch_group_enter(leave)

> 一个enter对应一个leave,全部对应后会执行dispatch_group_notify的block,可以在多个网络请求完成后使用

~~~~objective-c
//不同队列 异步并行 enter
[self diffAsyncEnter];//开辟多个子线程,前面请求不是按顺序返回,等待前面回调完成执行dispatch_group_notify

-(void)diffAsyncEnter {

dispatch_group_t group = dispatch_group_create();

for (int i=0; i<5; i++) {

dispatch_group_enter(group);
dispatch_async(dispatch_get_global_queue(0, 0), ^{
[NSThread sleepForTimeInterval:2];
NSLog(@"%d -%@",i,[NSThread currentThread]);
dispatch_group_leave(group);
});
}

dispatch_group_notify(group, dispatch_get_main_queue(), ^{
NSLog(@"notify");
});
}
~~~~

### dispatch_semaphore_t(信号量)

> 信号量为计数线程同步机制,如果semaphore计数为0则等待,为1则返回,为-1则继续运行,可以在多个网络请求完成后使用 ,可以按要求的顺序执行

~~~~objective-c

//不同队列 异步并行 wait信号量
[self diffAsyncWait];//开辟多个子线程,请求按顺序返回

-(void)diffAsyncWait {

dispatch_semaphore_t sema = dispatch_semaphore_create(1);
dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);
dispatch_async(dispatch_get_global_queue(0, 0), ^{
NSLog(@"1 -%@",[NSThread currentThread]);
dispatch_semaphore_signal(sema);
});

dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);
dispatch_async(dispatch_get_global_queue(0, 0), ^{
[NSThread sleepForTimeInterval:3.0];
NSLog(@"2 -%@",[NSThread currentThread]);
dispatch_semaphore_signal(sema);
});

dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);
dispatch_async(dispatch_get_global_queue(0, 0), ^{
[NSThread sleepForTimeInterval:3.0];
NSLog(@"3 -%@",[NSThread currentThread]);
dispatch_semaphore_signal(sema);
});

dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);
dispatch_async(dispatch_get_global_queue(0, 0), ^{
[NSThread sleepForTimeInterval:3.0];
NSLog(@"4 -%@",[NSThread currentThread]);
dispatch_semaphore_signal(sema);
});
}
~~~~

### dispatch Group

> 追加到Dispatch Queue中的多个处理全部结束后想执行结束处理

~~~~objective-c
//不同队列 异步并行队列
[self groupAsyncConcurrent];//开辟多个子线程,不会等待前面的回调都完成

-(void)groupAsyncConcurrent {
    
    dispatch_group_t group = dispatch_group_create();
    
    for (int i=0; i<8; i++) {
        
        dispatch_group_async(group, dispatch_get_global_queue(0, 0), ^{
            
            [NSThread sleepForTimeInterval:2];
            NSLog(@"%d -%@",i,[NSThread currentThread]);
            
            dispatch_async(dispatch_get_global_queue(0, 0), ^{
                [NSThread sleepForTimeInterval:4];
                NSLog(@"async");
            });
        });
    }

    dispatch_group_notify(group, dispatch_get_main_queue(), ^{
        NSLog(@"over");
    });
}
~~~~



### 刚刚开始写文章,有写的不对的地方还请大佬们指正
