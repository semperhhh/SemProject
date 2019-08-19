var express = require("express");
var path = require("path");//系统路径模块
var app = express();

var workSpacePath = "/WorkSpace";

app.get("/", function (request, response) {
    
    response.sendfile(__dirname + workSpacePath + "/index.html");
});

app.use(express.static(path.join(__dirname  + workSpacePath)));//指定静态文件目录

app.listen(8181);