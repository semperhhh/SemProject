iOS14后UIPageControl得到了更新

``numberPages``的数量可以更多,显示不下的会缩小

``preferredIndicatorImage``设置指示器的自定样式

``setIndicatorImage``可以单独设置某个指示器

``allowsContinuousInteraction``设置指示器的相互作用,可以拖拽选择其他的



![Screen Shot 2021-10-27 at 11.30.11 AM.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/74602848d0b9419aaa81fab1422a882d~tplv-k3u1fbpfcp-watermark.image?)

```Swift

var pageControl1: UIPageControl = {

        let v = UIPageControl()

        v.numberOfPages = 10                    //指示器个数

        v.currentPage = 0                       //当前指示器

        v.currentPageIndicatorTintColor = .red  //当前指示器的颜色

        v.pageIndicatorTintColor = .blue        //指示器的颜色

        v.hidesForSinglePage = false            //只有一个指示器的时候,隐藏

        v.backgroundStyle = .prominent         //指示器的样式,有一个圆框的时候pageIndicatorTintColor会变成默认的

        v.preferredIndicatorImage = UIImage(systemName: "sun.max.fill") //自定义指示器的样式

        v.setIndicatorImage(UIImage.init(systemName: "moon.fill"), forPage: 0) //单独设置一个指示器的样式

        v.allowsContinuousInteraction = true   //相互作用,默认true,可以在点击一个圆点的时候拖拽选择其他的

        v.addTarget(self, action: #selector(pageAction(_:)), for: .valueChanged)

        return v

    }()
    
    @objc func pageAction(_ sender: UIPageControl) {

        print("currentPage \(sender.currentPage)")

    }

```
