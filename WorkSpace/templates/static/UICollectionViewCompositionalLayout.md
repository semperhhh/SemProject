# UICollectionViewCompositionalLayout
> 可以用来替代UICollectionViewFlowLayout,但是iOS 13版本才能用

在 iOS13 中，苹果发布了新的 UICollectionViewCompositionalLayout API ， 主要包括 NSCollectionLayoutSize ，NSCollectionLayoutItem ， NSCollectionLayoutGroup 和 NSCollectionLayoutSection 四个类的组合，来快速的实现 UICollectionView 自定义布局.


#### NSCollectionLayoutSize
> 代表一个元素的大小

三种方法:

* fractionWidth 相对父控件的大小
* absolute 绝对的大小
* estimated 预估高度

#### NSCollectionLayoutItem
> 一个元素

用**NSCollectionLayoutSize** 代表大小,用**contentInsets**决定内凹.

#### NSCollectionLayoutGroup
> 一个组, 可以实现在同一个section中不同得布局方式

有水平, 垂直, 自定义三种布局方式.

#### NSCollectionLayoutSection
> 一个单元

用**NSCollectionLayoutSize**决定大小,**contentInsets**决定内凹大小.



#### NSCollectionLayoutAnchor



#### NSCollectionLayoutBoundarySupplementaryItem



#### Nested NSCollectionLayoutGroup



---

### 举个例子

~~~swift
        // 一个元素的大小 写定一个值
        let size = NSCollectionLayoutSize(widthDimension: .fractionalWidth(1.0), heightDimension: .fractionalHeight(1.0))
        
        // 元素 基本组成单位 类似uicollectionviewcell
        let item = NSCollectionLayoutItem(layoutSize: size)
        
        // 组尺寸
        let groupSize = NSCollectionLayoutSize(widthDimension: .fractionalWidth(1.0), heightDimension: .absolute(44))
        
        // 组 (两种初始化)
				// 每个group的item个数 group类似横着的一个组 group包含这一排的item
        let group = NSCollectionLayoutGroup.horizontal(layoutSize: groupSize, subitem: item, count: 3)

				//let group1 = NSCollectionLayoutGroup.horizontal(layoutSize: groupSize, subitems: [item])

				// 节 类似uicollectionview的section section包含多个group
        let section = NSCollectionLayoutSection(group: group)
        
				// 布局
        let layout = UICollectionViewCompositionalLayout(section: section)
        
				// collectionView初始化
        let collectionview = UICollectionView(frame: view.bounds, collectionViewLayout: layout)
        collectionview.dataSource = self
        collectionview.delegate = self
        collectionview.backgroundColor = UIColor.random
        collectionview.register(UICollectionViewCell.self, forCellWithReuseIdentifier: "cell")
        self.view.addSubview(collectionview)
~~~



