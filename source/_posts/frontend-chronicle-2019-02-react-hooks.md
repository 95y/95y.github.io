---
title: "React Hooks：状态逻辑从类组件中解放出来"
date: 2019-02-06 09:00:00
tags:
  - 前端年鉴
  - React
  - 2019
categories:
  - 前端年鉴
description: "把实时物流卡片从三个类组件生命周期迁到 Hooks，讨论 Effect、依赖数组、自定义 Hook 与 reducer 的真实边界。"
cover: /img/covers/frontend-chronicle-react-hooks.svg
top_img: /img/covers/frontend-chronicle-react-hooks.svg
toc: true
---
React 16.8 发布 Hooks 后，我们没有立刻把类组件全改掉。第一个试点是一张实时物流卡片：它既要订阅订单状态，又要监听页面可见性，还要记录曝光。类组件里，同一条业务逻辑散落在 `componentDidMount`、`componentDidUpdate` 和 `componentWillUnmount`，改一个订阅条件需要来回跳三个位置。

Hooks 真正吸引我的不是“函数组件也能 setState”，而是可以按业务能力组织状态和副作用。不过在最初几次改造里，我们也把 Effect 当成了新的生命周期容器，写出了依赖缺失、重复订阅和派生状态等问题。Hooks 减少了一类复杂度，同时要求我们更准确地理解渲染与闭包。

## 改造前：物流订阅被拆在三个生命周期里

简化后的类组件是这样：

```jsx
class ShipmentCard extends React.Component {
  state = { shipment: null }

  componentDidMount() {
    this.unsubscribe = shipmentStore.subscribe(
      this.props.orderId,
      shipment => this.setState({ shipment })
    )
  }

  componentDidUpdate(prevProps) {
    if (prevProps.orderId !== this.props.orderId) {
      this.unsubscribe()
      this.unsubscribe = shipmentStore.subscribe(
        this.props.orderId,
        shipment => this.setState({ shipment })
      )
    }
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  render() {
    return <ShipmentView data={this.state.shipment} />
  }
}
```

这不是类组件写错了，而是“订阅某个 orderId”这个完整能力被生命周期切开。漏掉更新时重新订阅，切订单后就显示旧数据；漏掉卸载清理，又会在后台继续接收消息。

## 第一个自定义 Hook 只做一件完整的事

改成 Hook 后，订阅与清理靠得更近：

```jsx
function useShipment(orderId) {
  const [shipment, setShipment] = useState(null)

  useEffect(() => {
    setShipment(null)
    return shipmentStore.subscribe(orderId, setShipment)
  }, [orderId])

  return shipment
}

function ShipmentCard({ orderId }) {
  const shipment = useShipment(orderId)
  return <ShipmentView data={shipment} />
}
```

当 `orderId` 改变，React 先执行上一个 Effect 的 cleanup，再用新值建立订阅。调用者只看到 `useShipment(orderId)`，不需要知道内部是 WebSocket、轮询还是 store。

这才是自定义 Hook 的复用单位：围绕“能力”封装，而不是简单模仿 `componentDidMount` 写一个 `useMount`。如果抽象只隐藏了两行代码，却把真实依赖藏起来，反而更难维护。

## Hooks 的规则不是风格偏好

Hook 必须在组件顶层以稳定顺序调用，不能放在条件和循环中：

```jsx
// 错误：enabled 改变后，Hook 调用顺序可能变化
if (enabled) {
  const [value, setValue] = useState('')
}
```

可以把条件放进 Hook 内部，或拆成子组件：

```jsx
function ShipmentPanel({ enabled, orderId }) {
  const shipment = useShipment(enabled ? orderId : null)
  return enabled ? <ShipmentView data={shipment} /> : null
}
```

对应的 `useShipment` 也要处理 `null`，不建立订阅。稳定调用顺序让 React 能把每次渲染中的 Hook 与之前的状态槽对应起来，这不是 lint 工具随意制定的限制。

## 我们一度把所有计算都塞进 Effect

下面是早期很常见的写法：

```jsx
function ProductList({ products, keyword }) {
  const [visibleProducts, setVisibleProducts] = useState([])

  useEffect(() => {
    setVisibleProducts(
      products.filter(product => product.name.includes(keyword))
    )
  }, [products, keyword])

  return <List items={visibleProducts} />
}
```

`visibleProducts` 完全可以由当前 props 算出，却被保存成第二份状态。组件先用旧列表渲染一次，Effect 再 setState 触发第二次渲染，还要维护依赖数组。

直接计算更简单：

```jsx
function ProductList({ products, keyword }) {
  const visibleProducts = products.filter(product =>
    product.name.includes(keyword)
  )

  return <List items={visibleProducts} />
}
```

只有计算确实昂贵、并且能测到收益时才考虑 `useMemo`。它是性能优化，不是保证语义正确的缓存层。

## 依赖数组记录的是闭包用到了什么

Effect 中读取的 props、state 和组件内函数，通常都应该出现在依赖中。空数组不是“只执行一次”的装饰器，而是声明这段 Effect 不依赖会变化的渲染值。

```jsx
useEffect(() => {
  const controller = new AbortController()

  fetch(`/api/orders/${orderId}`, { signal: controller.signal })
    .then(response => response.json())
    .then(setOrder)

  return () => controller.abort()
}, [orderId])
```

如果为了阻止重复请求而删掉 `orderId`，切换订单后闭包仍保存旧 ID。正确方向是让请求可取消、让数据层去重，而不是对 lint 提示闭眼。

函数依赖每次变化时，也不要立刻给所有函数套 `useCallback`。先看能否把函数移进 Effect、把不相关逻辑移出组件，或者使用函数式状态更新减少依赖。过度 memo 会增加比较和理解成本。

## useReducer 适合有事件语义的状态

多个布尔 state 很容易组成非法状态，例如 `loading=true` 同时 `success=true`。物流卡片后来用 reducer 表达状态机式变化：

```jsx
const initialState = { status: 'idle', data: null, error: null }

function reducer(state, action) {
  switch (action.type) {
    case 'requested':
      return { status: 'loading', data: state.data, error: null }
    case 'received':
      return { status: 'success', data: action.data, error: null }
    case 'failed':
      return { status: 'error', data: null, error: action.error }
    default:
      throw new Error(`Unknown action: ${action.type}`)
  }
}
```

这不是说 state 多了就必须 reducer，而是当更新具有明确事件和约束时，reducer 能把规则集中起来。Hook 只是让它可以在函数组件中自然使用。

## 没有进行的“大重写”反而是正确决定

Hooks 与类组件可以共存。我们优先在新功能和逻辑复用困难的组件中使用，稳定的类组件只在需要修改时再迁移。因为机械转换不会自动改善边界，甚至可能把清晰的生命周期翻译成几个更混乱的 Effect。

几年以后再看，Hooks 改变了 React 项目的默认组织方式，但它并没有让副作用消失。我的经验可以缩成三句话：渲染阶段只做计算；Effect 用来同步外部系统，并始终考虑清理；自定义 Hook 按业务能力抽象，而不是按代码行数抽象。遵守这三点，比背完全部 Hook API 更有用。

## 资料

- [React v16.8：Hooks 发布说明](https://legacy.reactjs.org/blog/2019/02/06/react-v16.8.0.html)
- [React：Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [React：You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
