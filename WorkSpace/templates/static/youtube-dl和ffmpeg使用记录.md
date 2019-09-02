### youtube-dl和ffmpeg使用记录



#### youtube-dl

安装

```
//macos linux

sudo curl -L https://yt-dl.org/downloads/latest/youtube-dl -o /usr/local/bin/youtube-dl
sudo chmod a+rx /usr/local/bin/youtube-dl
```



使用

~~~
youtube-dl [url] //下载视频
youtube-dl --proxy [url] //代理
youtube-dl --no-playlist [url] //只下载视频,不下载包含的列表
~~~



config配置文件

~~~
mkdir -p ~/.config/youtube-dl/ //创建配置文件
vi //编辑
~~~



#### ffmpeg

``ffmpeg -i [原文件] [修改后的文件]``

