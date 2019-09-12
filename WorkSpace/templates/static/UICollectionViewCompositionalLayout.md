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

