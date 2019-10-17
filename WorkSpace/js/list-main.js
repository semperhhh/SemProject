var mainList = new Vue({
    el: "#main_list",
    data: {
        POSTS_LISTS: [{
            POSTS_TITLE: "",
            POSTS_CREATE_TIME: "",
            POSTS_UPDATA_TIME: "",
            POSTS_LIKEED: "",
            POSTS_READED: "",
            POSTS_CATEGORY: "",
            POSTS_TAG: [],
        }],
        page: 0,
        beforeBtnShow: true,
        afterBtnShow: true,
        CATEGORY_NAME_LIST: [
            {
                category_name: "工作",
                category_id: 0,
            },
            {
                category_name: "日常",
                category_id: 1,
            },
            {
                category_name: "平时",
                category_id: 2,
            },
        ],
    },
    methods: {
        //点击了列表
        list_action(titleStr) {
            window.location.href = "/posts?title=" + titleStr;
        },

        //加载列表
        getList(isAfterAction) {
            console.log("ajax加载列表");
            var _this = this;
            $.get("/lists/query", {
                page: _this.page, //页数
                category: _this.category, //分类
            }).done(function (data) {

                console.log(data);

                var lists = data;

                if (isAfterAction) {

                    if (lists.length == 0) { //是否展示下一页                    
                        alert("已经是最后一页");
                        _this.page -= 1;
                        _this.afterBtnShow = false;
                        return;
                    } else {
                        _this.afterBtnShow = true;
                    }
                }
                _this.POSTS_LISTS = lists; //赋值

                //滚动
                var element = document.getElementById("main_list");
                element.scrollIntoView();

            }).fail(function (response, status) {
                console.log(response.status, status);
            }).always(function () {
                console.log("请求完成");
            });
        },

        //点击
        categoryAction(category_id) {

            if (category_id == 0) {
                this.jishuAction();
            }else if (category_id == 1) {
                this.richangAction();
            }else if (category_id == 2) {
                this.pingshiAction();
            }
        },
        //工作
        jishuAction() {
            this.category = 0;
            this.getList();
            this.showButton();
            this.page = 0;
        },
        //日常
        richangAction() {
            this.category = 1;
            this.getList();
            this.showButton();
            this.page = 0;
        },
        //平时
        pingshiAction() {
            this.category = 2;
            this.getList();
            this.showButton();
            this.page = 0;
        },

        //显示翻页按钮
        showButton() {
            this.beforeBtnShow = true;
            this.afterBtnShow = true;
        },

        //上一页
        beforeAction() {
            var _this = this;

            if (_this.page == 0) {
                alert("已经是第一页");
                _this.beforeBtnShow = false;
                return;
            } else {
                _this.beforeBtnShow = true;

                if (_this.afterBtnShow == false) {
                    _this.afterBtnShow = true;
                }
            }

            _this.page -= 1;
            console.log("点击了上一页 page = ", _this.page);
            _this.getList(); //请求数据
        },

        //下一页
        afterAction() {
            var _this = this;
            _this.page += 1;
            console.log("点击了下一页 page = ", _this.page);
            if (_this.beforeBtnShow == false) {
                _this.beforeBtnShow = true;
            }
            _this.getList(true);
        },
    },
    mounted: function () { //安装
        console.log("安装");
        this.getList();
    },
})