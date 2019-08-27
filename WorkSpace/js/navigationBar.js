//导航栏
Vue.component('navigation-bar', {
  template: `
          <nav class="navbar navbar-dark bg-dark naviHeight">
          <a class="navbar-brand" href="/">semperhhhの博客</a>
          <div>
              <ul class="nav justify-content-end">
                  <li class="nav-item naviBtn">
                      <button class="button button-box button-longshadow-right" v-on:click="homeBtnAction()">
                          <i class="fa fa-home"></i>
                      </button>
                  </li>
                  <li class="nav-item naviBtn">
                      <button class="button button-box button-longshadow-right" v-on:click="listsBtnAction()">
                          <i class="fa fa-list"></i>
                      </button>
                  </li>
                  <li class="nav-item naviBtn">
                      <button class="button button-box button-longshadow-right" v-on:click="aboutBtnAction()">
                          <i class="fa fa-user"></i>
                      </button>
                  </li>
              </ul>
          </div>
      </nav>
      `,
  methods: {
      homeBtnAction() {
        window.location.href = "/";
      },
      listsBtnAction() {
        window.location.href = "/lists";
      },
      aboutBtnAction() {
        window.location.href = "/about";
      }      
  }
})