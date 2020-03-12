Vue.component('navigation-bar', {
    template: `
    <nav class="col-md-10 navbar-center navbar navbar-bg naviHeight">
            <a class="navbar-title">
                <img src="images/homeImages/home-navi.png">
            </a>
            <div>
                <ul class="nav justify-content-end">

                    <!-- 搜索 -->
                    <li class="nav-item naviBtn">
                        <div class="navbar-btn-search">
                            <span class="navbar-btn-search-title">搜索</span>
                        </div>
                    </li>

                    <!-- 返回首页 -->
                    <li class="naviBtn">
                        <div class="navbar-btn">
                            <img src="./images/homeImages/home-back@2x.png">
                            <span @click="naviBackBtnClick">
                                返回首页
                            </span>
                        </div>
                    </li>
                </ul>
            </div>
        </nav>
    `,
    methods: {
        naviBackBtnClick() {
            console.log("返回首页");
            window.location.href = "/";
        },
    }
})