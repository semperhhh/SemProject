### Flutter 暗黑模式



flutter通过inheritedWidget提供了一种数据在widget树中从上到下传递,共享的方式,在应用的根widget中设置数据,便可以在任意的子widget中来获取该共享的数据,FlutterSDK中正是通过这种方式来实现应用主题和语言环境信息的改变.

这里要实现时间管理客户端的暗黑模式,同样使用由inheritedWidget封装的provide库,provide库不仅使用到inheritedwidget的数据共享方式,还通过stream流的方式实现了局部控件的刷新.

1, 定义主题模式的model

```dart
// 全局主题
class ThemeModel extends ChangeNotifier {
  // 主题
  ThemeMode themeMode = UserPrefereTool.currentThemeMode();
  set theme(ThemeMode mode) {
    if (mode != themeMode) {
      themeMode = mode;
      UserPrefereTool.changeThemeMode(mode.index);
      notifyListeners();
    }
  }

  static bool isDarkMode(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark;
  }

  static ThemeData getTheme({bool isDarkMode = false}) {
    return ThemeData(
      platform: TargetPlatform.iOS,
      primaryIconTheme: IconThemeData(
          color:
              isDarkMode ? ColorUtil.main_light_app : ColorUtil.main_dark_app),
      brightness: isDarkMode ? Brightness.dark : Brightness.light,
      appBarTheme: AppBarTheme(
        color: isDarkMode ? ColorUtil.main_dark1_app : Colors.white,
        shadowColor: isDarkMode ? ColorUtil.main_dark1_app : Colors.transparent,
      ),
      fontFamily: fontPingFange,
      splashColor: Colors.transparent, // 水波纹
      highlightColor: Colors.transparent,
      backgroundColor: isDarkMode ? ColorUtil.main_dark_app : Colors.white,
      textTheme: TextTheme(
        bodyText2: TextStyle(
            color: isDarkMode
                ? ColorUtil.main_light_app
                : ColorUtil.main_dark_app),
      ),
    );
  }
}

```



当前主题模式是通过偏好存储在本地的数据,用来保持每次冷启动app时的主题都是上次设置的.

通过`set theme`方式给主题设置新的值,同时向其他子widget发送数据改变的通知.

通过`isDarkMode`来判断当前主题模式是否暗黑模式.

通过`getTheme` 设置对应正常模式和暗黑模式下UI的展示颜色.如我们将app中`bodyText2`字体根据isdark为true则是黑色,为false则是白色.

2. 确定父控件

前面提到数据共享是通过父控件通知子控件,在主题模式这样影响整个app的数据,我们在app的根控件上放置数据

```dart
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        ScreenUtil.init(constraints,
            designSize: Size(375, 667), allowFontScaling: true);
        return MultiProvider(
          providers: [
            ChangeNotifierProvider.value(value: ThemeModel()),
            ChangeNotifierProvider.value(value: UserModel()),
          ],
          child: Consumer<ThemeModel>(
            builder: (_, thememodel, __) {
              return GetMaterialApp(
                initialRoute: "/",
                theme: ThemeModel.getTheme(),
                darkTheme: ThemeModel.getTheme(isDarkMode: true),
                themeMode: thememodel.themeMode,
                routes: {
                  "/": (context) => UserPrefereToolLogin.isName()
                      ? RootViewController()
                      : LoginViewController(),
                },
              );
            },
          ),
        );
      },
    );
  }
}
```

在根控件MaterialApp中,我们使用了themeModel数据,当接收到thememodel改变的通知,对应的配置就会重新加载,这里表现为整个app都重新加载.

3. 修改主题模式

```dart

class SettingAppearanceVC extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    Widget _buildListItem(String name, value) {
      return ListTile(
        title: Text(name),
        trailing: Provider.of<ThemeModel>(context).themeMode == value
            ? Icon(
                Icons.done,
                color: ColorUtil.main_app,
              )
            : null,
        onTap: () {
          Provider.of<ThemeModel>(context, listen: false).theme = value;
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          "外观",
          style: Theme.of(context).textTheme.headline6,
        ),
      ),
      backgroundColor: Theme.of(context).backgroundColor,
      body: ListView(
        children: <Widget>[
          _buildListItem("跟随系统", ThemeMode.system),
          _buildListItem("浅色", ThemeMode.light),
          _buildListItem("深色", ThemeMode.dark),
        ],
      ),
    );
  }
}
```

在设置界面新添加一个修改主题的新页面入口,获取当前的主题模式,在选择其他模式时,获取全局共用的主题模式类,并修改`Provider.of<ThemeModel>(context, listen: false).theme = value;`, 这会调用`set theme`方法.

至此,修改主题模式就完成了流程,通过修改模型的值,发送通知给依赖模型的widget,widget重新加载对应的配置.

