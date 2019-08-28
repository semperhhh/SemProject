
new Vue({
    el: "#main_list",
    data: {
        POSTS_LISTS: [{
            POSTS_TITLE: "",
            POSTS_CREATE_TIME: "",
            POSTS_UPDATA_TIME: "",
            POSTS_LIKEED: "",
            POSTS_READED: "",
            POSTS_TAG: [],
        }],
        page: 0,
        beforeBtnShow: true,
        afterBtnShow: true,
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
                page: _this.page, //页数
            }).done(function (data) {
                console.log(data);

                var lists = data;

                if (lists.length == 0) {
                    alert("已经是最后一页");
                    _this.afterBtnShow = false;
                    _this.page -= 1;
                    return;
                }else {
                    _this.afterBtnShow = true;
                }

                _this.POSTS_LISTS = lists;
                
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

        //上一页
        beforeAction() {
            var _this = this;
            
            if (_this.page == 0) {
                alert("已经是第一页");
                _this.beforeBtnShow = false;
                return;
            }else {
                _this.beforeBtnShow = true;
            }

            _this.page -= 1;
            console.log("点击了上一页 page = ", _this.page);
            _this.getList();//请求数据
        },

        //下一页
        afterAction() {
            var _this = this;
            _this.page += 1;
            console.log("点击了下一页 page = ", _this.page);
            if (_this.beforeBtnShow == false) {
                _this.beforeBtnShow = true;
            }
            _this.getList();
        },
    },
    mounted: function () { //安装
        console.log("安装");
        this.getList();
    },
})