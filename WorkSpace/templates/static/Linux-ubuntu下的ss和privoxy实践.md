
pid: 190430;
tag: Linux;

---

## ubuntu下的ss和privoxy实践

想写一个下载ins图片的小网页玩,就需要node可以使用proxy,在阿里云服务器(ubuntu)下开始配置ss和privoxy的漫长配置

### ss

shadowsocks,可以通过python-pip下载,

``pip install shadowsocks``

然后创建配置文件,在常用的目录下创建就可以,因为这个配置文件就是ss的一些ip,端口之类的参数,不创建这个文件,每次都手动输入也是可以的.

配置文件是json格式

```json
	{
    "server":"ss服务器地址",
    "server_port":ss服务器端口,
    "local_port":本地监听端口,
    "password":"ss服务器密码",
    "timeout":600,//延时时间
    "method":"aes-256-cfb"//加密规则
}

```

运行命令``sslocal -c shadowsock.json -d start``

sslocal是ss本地运行命令,常用参数

````json
-c :加载配置文件启动
-d start/stop/status:以守护进程模式启动
````



其他的守护进程的方式如nohup也是可以的,现在ss监听了10871端口.

但是只有这样我们还是实现不了功能

### privoxy 代理

安装privoxy: ``sudo apt-get install privoxy``

配置 :``vim /etc/privoxy/config``

这个配置文件很长,大概有两个地方,其中:

4.1节有一个``listen-address localhost:8118`` ,为了方便可以先注释它.

5.2节有``forward-socks5 / 127.0.0.1:1080 .  ``,如果没有统一在最后面加上这两句:

```json
listen-address localhost:8118
forward-socks5 / 127.0.0.1:1080 .  //注意后面这个.
```

重启privoxy代理: ``systemctl restart privoxy.service ``

### 结尾

这时通过在node中request设置proxy就可以请求到ins了.

当然如果想在终端实现fq,需要命令``export ALL_PROXY=socks5://127.0.0.1:8118

取消用``unset ALL_PROXY``

