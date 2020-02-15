
var app = new Vue({
    el: "#app",
    data: {
        CATEGORY_NAME_LIST: [
            {
                category_name: "工作 / work",
                category_id: 0,
            },
            {
                category_name: "日常 / daily",
                category_id: 1,
            },
            {
                category_name: "其他 / other",
                category_id: 2,
            },
        ],
    },
    methods: {
        
        // 返回首页
        naviBackBtnClick() {
            console.log("返回首页");
        },

        //点击
        categoryAction(category_id) {
            console.log("category_id = ",category_id);
            if (category_id == 0) {
                this.jishuAction();
            } else if (category_id == 1) {
                this.richangAction();
            } else if (category_id == 2) {
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
    }
})
