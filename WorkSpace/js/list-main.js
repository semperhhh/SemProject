
new Vue({
    el: "#main_list",
    data: {
        POSTS_LISTS: [{
            POSTS_TITLE: "标题",
            POSTS_CREATE_TIME: "创建时间",
            POSTS_UPDATA_TIME: "最后更新时间",
            POSTS_LIKEED: "0",
            POSTS_READED: "0",
            POSTS_TAG: [
                "123"
            ]
        }]
    },
    methods: {
        //点击了列表
        list_action(titleStr) {
            window.location.href = "/posts?title=" + titleStr;
        },

        //加载列表
        getList() {
            var _this = this;
            console.log("ajax加载列表");
            $.get("/lists/query", {
                page: 1, //页数
            }).done(function (data) {
                console.log(data);
                _this.POSTS_LISTS = data;
            }).fail(function (response, status) {
                console.log(response.status, status);
            }).always(function () {
                console.log("请求完成");
            });
        },

        //工作
        jishuAction() {
            alert("工作~~模块开发中");
        },
        
        //日常
        richangAction() {
            alert("日常~~模块开发中");
        },
        
        //平时
        pingshiAction() {
            alert("平时~~模块开发中");
        },
    },
    mounted: function () { //安装
        console.log("安装");
        this.getList();
    },
})