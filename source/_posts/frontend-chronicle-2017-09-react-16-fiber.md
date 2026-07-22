---
title: "React 16 与 Fiber：渲染架构为并发能力打下基础"
date: 2017-09-26 09:00:00
tags:
  - 前端年鉴
  - React
  - 2017
categories:
  - 前端年鉴
description: "React 16 升级手记：错误边界怎样隔离局部崩溃，Fragment 与 Portal 解决了什么，以及 Fiber 为何要求纯渲染。"
cover: /img/covers/frontend-chronicle-react-16-fiber.svg
top_img: /img/covers/frontend-chronicle-react-16-fiber.svg
toc: true
---
React 16 发布那天，我所在的项目没有立刻出现“肉眼可见的性能飞跃”。按钮还是那个按钮，列表也没有突然变快。真正让我觉得升级值得的，是一个价格格式化函数抛错以后，购物车区域终于可以单独降级，不再把整棵应用树一起带走。

Fiber 当然是这个版本最重要的底层重写，但业务开发者不必背内部字段。更值得记录的是：React 从这一版开始，为“渲染工作可以被拆开和调度”换了一副骨架，同时交付了错误边界、Portal、Fragment 等立即能解决工程问题的能力。

## 升级前先处理控制台里的旧问题

我们从 React 15 升级时没有直接改版本号，而是先清理警告。旧生命周期、字符串 ref、依赖 DOM 结构的测试，这些代码在平时看起来不影响运行，却会让真正的升级错误淹没在控制台中。

当时的顺序大概是：

1. 在现有版本中先升级兼容的依赖，清空能处理的 warning；
2. 固定一组下单、登录、搜索和弹窗回归用例；
3. 升 React 与 ReactDOM，再处理测试工具和第三方组件；
4. 对错误场景做主动注入，而不只验证正常页面。

最后一条很关键。错误边界只有子组件真的在渲染阶段抛错时才看得到价值。

## 一次商品卡片异常，不该让整个页面白屏

接口里偶尔会出现缺少货币字段的商品，格式化价格时抛出异常。React 16 之前，组件树中的未捕获渲染错误可能让整棵树失效；加入错误边界后，可以把故障控制在商品推荐区域。

```jsx
class ProductAreaBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    reportError(error, {
      area: 'product-recommendation',
      componentStack: info.componentStack
    })
  }

  render() {
    if (this.state.error) {
      return (
        <section role="status">
          <p>推荐商品暂时无法显示。</p>
          <button onClick={() => this.setState({ error: null })}>重试</button>
        </section>
      )
    }

    return this.props.children
  }
}
```

边界放在哪里比“有没有边界”更重要。只在应用根部放一个，结果仍然近似整页白屏；每个按钮都包一层又会把结构切得太碎。我们的做法是按可独立降级的业务区域划分：导航、结算、推荐和评论各自有不同兜底，其中结算错误不能静默降级，必须引导用户重试或联系客服。

错误边界也并非万能。事件处理器、异步回调和边界自身的错误不会自动被它捕获。网络失败更应该进入数据层的失败状态，而不是故意在渲染里抛异常。

## Fragment 解决的是不起眼的 DOM 污染

表格曾经是升级时最直观的收益。组件需要返回多列，但为了满足单根节点限制而加一个 `div` 会破坏合法表格结构。Fragment 让组件可以返回一组同级节点：

```jsx
function OrderCells({ order }) {
  return (
    <React.Fragment>
      <td>{order.number}</td>
      <td>{order.customer}</td>
      <td>{order.total}</td>
    </React.Fragment>
  )
}
```

今天短语法 `<>...</>` 已经随处可见，但在需要 `key` 的列表中仍要写完整的 `React.Fragment`。它不是单纯少一个标签，而是让组件边界不必强行对应一个多余的 DOM 节点。

## Portal 让弹窗离开裁剪容器

另一个老问题是弹窗放在带 `overflow: hidden` 或 `transform` 的卡片中，无论怎么调 `z-index` 都会被裁剪。Portal 让 React 组件在逻辑上仍属于原来的组件树，DOM 却可以渲染到页面顶部的 overlay 节点。

```jsx
function Modal({ children, onClose }) {
  const root = document.getElementById('overlay-root')

  return ReactDOM.createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={event => event.stopPropagation()}>
        {children}
      </div>
    </div>,
    root
  )
}
```

Portal 改的是 DOM 位置，不会切断 React 树中的 context 和事件传播。也正因为如此，点击 Portal 内按钮时，事件仍可能冒泡到逻辑父组件，不能按普通 DOM 父子关系想当然。

## Fiber 对业务代码提出的隐性要求

旧的协调过程更像一次同步递归：开始渲染以后会持续工作，直到整棵相关子树处理完。Fiber 把工作表示为更小的单元，为后续按优先级调度、暂停和恢复渲染提供基础。React 16 并没有直接把今天的并发能力全部开放出来，但架构方向已经改变。

这会反过来约束组件写法：`render` 必须是纯计算。下面这种代码即使暂时看起来正常，也把副作用藏进了渲染阶段：

```jsx
class BadExample extends React.Component {
  render() {
    analytics.track('render-product', this.props.product.id)
    cache.push(this.props.product)
    return <Product product={this.props.product} />
  }
}
```

一旦渲染可能重试或中断，统计会重复、外部数组会被多次修改。正确做法是把订阅、上报和 DOM 操作放到明确的提交后生命周期，并让渲染只由 props/state 计算 UI。

## 回看这次升级

React 16 最有意思的地方，是表层 API 和底层架构同时前进。Fragment 与 Portal 修掉日常的 DOM 结构问题，错误边界改善生产可用性，Fiber 则为多年后的并发渲染铺路。

如果今天还在维护旧 React 项目，我不会让业务代码读取 Fiber 内部结构来“优化性能”。更可靠的准备仍然是纯渲染、稳定 key、可清理副作用、按业务范围设置错误边界，以及真实的用户路径测试。这些原则跨过多个主版本后依旧成立。

## 资料

- [React v16.0 发布说明](https://legacy.reactjs.org/blog/2017/09/26/react-v16.0.html)
- [React：错误边界](https://legacy.reactjs.org/docs/error-boundaries.html)
- [React：Portal](https://legacy.reactjs.org/docs/portals.html)
