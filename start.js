var path = require("path"); //系统路径模块
var express = require("express");
var app = express();

var workSpacePath = "/WorkSpace";
var templatePath = "/templates";

var mysqlClass = require("./WorkSpace/js/list-mysqlClass") //数据库类

var marked = require("marked"); //markdowm转html
var fs = require("fs"); //文件

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = "debug";
logger.debug("hello, log4s!");

//定时器
setInterval(() => {
    heartbeatCount();
}, 1000 * 60 * 60);

function heartbeatCount() {

    mysqlClass.queryHome(function () {
        console.log('heartbeatCount + 1');
    });
}

//首页
// app.get("/", function (request, response) {
    // console.log("/");
    // response.sendfile(__dirname + workSpacePath + "/index.html");
// });

//列表界面
app.get("/lists", function (request, response) {
    console.log("/lists" + __dirname + workSpacePath + templatePath + "/lists.html");
    response.sendFile(__dirname + workSpacePath + templatePath + "/lists.html");
});

//列表内容
app.get("/lists/query", function (request, response) {

    console.log("/lists/query");
    var params = request.query;
    var page = params["page"];
    var category = params["category"];

    mysqlClass.queryLists(page, category, function (lists) {

        var nmLists = [];

        for (var index in lists) {

            var list = lists[index];
            var nmDict = {};
            nmDict.POSTS_TITLE = list.title;
            nmDict.POSTS_LIKEED = list.likeed;
            nmDict.POSTS_READED = list.readed;

            //创建时间
            if (list.create_time) {
                var t = list.create_time;
                nmDict.POSTS_CREATE_TIME = t.getFullYear() + "年 " + (t.getMonth() + 1) + "月 " + t.getDate() + "号 " + t.getHours() + "时";
            }

            //最后更新时间
            if (list.updata_time) {
                var t = list.updata_time;
                nmDict.POSTS_UPDATA_TIME = t.getFullYear() + "年 " + (t.getMonth() + 1) + "月 " + t.getDate() + "号 " + t.getHours() + "时";
            }

            //标签
            if (list.tags) {
                var tags = list.tags;
                var tagLists = tags.split(",");
                nmDict.POSTS_TAG = tagLists;
            }

            //分类
            if (list.category == 0) {
                nmDict.POSTS_CATEGORY = "工作";
            } else if (list.category == 1) {
                nmDict.POSTS_CATEGORY = "日常";
            } else if (list.category == 2) {
                nmDict.POSTS_CATEGORY = "平时";
            }

            nmLists.push(nmDict);
        }
        response.json(nmLists);
    });
})

//文章
app.get("/posts", function (request, response) {
    console.log("/posts");
    response.sendFile(__dirname + workSpacePath + templatePath + "/posts.html");
})

//文章内容
app.get("/posts/query", function (request, respose) {
    console.log("/posts/query");
    var params = request.query;
    var title = decodeURI(params["title"]);
    console.log("文章标题 title = ", title);

    //读取md文件 转html
    fs.readFile(__dirname + workSpacePath + templatePath + "/static/" + title + ".md", function (error, data) {
        if (error) {
            console.log("error");
            return;
        } else {
            respose.send(marked(data.toString()));
        }
    });

        //阅读 + 1
        mysqlClass.queryPostsRead(title, function (result) {
            console.log("result.message - ", result.message);
        });
})

//文章喜欢
app.get("/posts/like", function (request, response) {
    var params = request.query;
    var title = decodeURI(params["title"]);
    console.log("/posts/like title = ", title);

    mysqlClass.queryPostsLike(title, function (result) {
        console.log(result.message);
    });
})

//关于
app.get("/about", function (request, response) {
    console.log("/about");
    response.sendFile(__dirname + workSpacePath + templatePath + "/about.html");
})

app.use(express.static(path.join(__dirname + workSpacePath))); //指定静态文件目录

app.listen(8484);