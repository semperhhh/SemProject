### Flutter中的BuildContext

Flutter中经常可以看到``Widget build(BuildContext context) {}``, ``Theme.of(context)``这些需要传递BuildContext的场景.

```Swift

abstract class BuildContext {
  /// The current configuration of the [Element] that is this [BuildContext].
  Widget get widget;

  /// The [BuildOwner] for this context. The [BuildOwner] is in charge of
  /// managing the rendering pipeline for this context.
  BuildOwner? get owner;
}

```

``BuildContext``是一个抽象类.

```Swift

@override
StatelessElement createElement() {
    // TODO: implement createElement
    return super.createElement();
}

```

Widget在构建的时候``build``会调用``createElement``.屏幕上显示的视图树其实就是ElementTree.
widgetTree负责配置信息,ElementTree负责显示信息,RenderObject负责....

```Swift
abstract class StatelessWidget extends Widget {
  const StatelessWidget({ Key? key }) : super(key: key);
  @override
  StatelessElement createElement() => StatelessElement(this);
  @protected
  Widget build(BuildContext context);
}
```

``createElement``调用``StatelessElement(StatelessWidget widget)``,this就是widget.

```Swift

/// An [Element] that uses a [StatelessWidget] as its configuration.
class StatelessElement extends ComponentElement {
  /// Creates an element that uses the given widget as its configuration.
  StatelessElement(StatelessWidget widget) : super(widget);

  @override
  StatelessWidget get widget => super.widget as StatelessWidget;

  @override
  Widget build() => widget.build(this);

  @override
  void update(StatelessWidget newWidget) {
    super.update(newWidget);
    assert(widget == newWidget);
    _dirty = true;
    rebuild();
  }
}

```

``build()``调用了``widget.build(this)``,this是``StatelessElement``.

所以在widget进入视图树的时候,widget会传给Element引用,Element通过widget调用widget的``build(BuildContext context)``,传入的context就是Element.

BuildContext = Element.BuildContext对象实际上就是Element对象.

#### of(context)方法

```Swift

Theme.of(context).backgroundColor
Navigator.of(context).push

```

在Flutter中经常会这样操作,of(context)是Flutter开发的一种约定,从当前传入的context向上遍历寻找符合的state,是对跨组件获取数据的一种封装.

```Swift

// Theme.of(context)

static ThemeData of(BuildContext context) {
    final _InheritedTheme? inheritedTheme = context.dependOnInheritedWidgetOfExactType<_InheritedTheme>();
    final MaterialLocalizations? localizations = Localizations.of<MaterialLocalizations>(context, MaterialLocalizations);
    final ScriptCategory category = localizations?.scriptCategory ?? ScriptCategory.englishLike;
    final ThemeData theme = inheritedTheme?.theme.data ?? _kFallbackTheme;
    return ThemeData.localize(theme, theme.typography.geometryThemeFor(category));
  }
```

