---
title: "z-index 失效排查：层叠上下文、定位与遮挡问题"
date: 2018-07-20 14:00:00
tags:
  - 前端排障
  - CSS
categories:
  - 前端排障
description: "z-index 写到 999999 仍被侧栏盖住：沿祖先找到 transform 层叠上下文，再区分遮挡、overflow 裁剪与点击命中。"
cover: /img/covers/frontend-debug-css-z-index-stacking-context.svg
top_img: /img/covers/frontend-debug-css-z-index-stacking-context.svg
toc: true
---
“我已经把 z-index 改成 999999 了，怎么还被导航栏盖住？”

这个问题我遇到过很多次。数字继续加大通常没有意义，因为参与比较的两个元素根本不在同一个层叠上下文里。它有点像两个小区都各自有一栋 100 号楼，不能因为门牌号一样就判断谁更高。

下面用一个能复现的商品卡片说明我平时怎么查，不先罗列几十条 CSS 规则。

## 复现：卡片里的提示框永远越不过侧栏

HTML 很普通：

```html
<aside class="sidebar">固定侧栏</aside>

<main class="page">
  <article class="card">
    <button>显示提示</button>
    <div class="tooltip">库存只剩 2 件</div>
  </article>
</main>
```

CSS 中为了“开启 GPU 加速”，有人给 page 加了 `transform`：

```css
.sidebar {
  position: fixed;
  z-index: 10;
}

.page {
  position: relative;
  z-index: 1;
  transform: translateZ(0);
}

.tooltip {
  position: absolute;
  z-index: 999999;
}
```

`.page` 因为定位与 z-index（同时 transform 也会创建）形成自己的层叠上下文。`.tooltip` 的 999999 只在 `.page` 内部比较；整个 `.page` 在根上下文里仍然是 1，而侧栏是 10，所以提示框无法越过去。

## 我的排查顺序：从元素向祖先走

看到遮挡以后，我会在 Elements 面板选中被盖住的元素，然后逐层向上看 computed style。重点不是先盯着它自己的 z-index，而是找第一个创建层叠上下文或发生裁剪的祖先。

可以临时逐项关闭这些属性来验证：

- 带非 `auto` z-index 的 positioned/flex/grid 子项；
- `transform`、`filter`、`perspective`；
- 小于 1 的 `opacity`；
- `isolation: isolate`；
- `contain`、`will-change` 等会建立独立绘制边界的属性。

这个列表会随规范能力扩展，所以我不会只凭记忆。DevTools 中关闭一项、观察结果，比一口气删除整段样式更容易锁定原因。

如果临时去掉 `.page` 的 `transform` 后提示框立刻正常，就已经有很强证据。接下来再判断 transform 是误加的，还是动画确实需要它。

## 遮挡和裁剪是两种不同问题

有时把层级修好，浮层还是只显示一半。这通常不是 z-index，而是祖先的 `overflow: hidden` 在裁剪。

```css
.card {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
}
```

卡片为了圆角裁掉溢出内容，里面的下拉菜单也一起被裁。无论 z-index 多大，子元素都不能绘制到裁剪区域之外。临时关闭 overflow 可以快速区分：

- 关闭后完整显示但仍在别的元素下方：还有层叠问题；
- 关闭后直接恢复正常：主要是裁剪问题；
- fixed 元素滚动时行为异常：还要检查 transform 是否改变了包含块。

把所有 overflow 都改成 visible 会破坏圆角和滚动容器。更好的方案通常是让浮层脱离这个 DOM 子树。

## 弹窗、Toast 和下拉菜单放到统一出口

复杂应用里，我会在 body 下放一个 overlay 根节点：

```html
<div id="app"></div>
<div id="overlay-root"></div>
```

React 可以用 Portal，Vue 可以用 Teleport，把浮层渲染到这里。原组件仍管理打开状态，DOM 不再受卡片的 transform 和 overflow 限制。

```jsx
function Dialog({ children }) {
  return createPortal(
    <div className="dialog-layer">{children}</div>,
    document.getElementById('overlay-root')
  )
}
```

这并不代表所有 tooltip 都必须传送到 body。紧贴局部按钮、不会越过容器边界的小提示留在原位更简单；跨区域的弹窗、抽屉和全局消息更适合统一 overlay。选型要看它是否需要突破祖先边界。

## 我不再使用“最大 z-index”

项目里一旦开始出现 999、9999、2147483647，后面的人只能继续加。我们后来把层级收敛成几个 token：

```css
:root {
  --z-base: 0;
  --z-sticky: 20;
  --z-dropdown: 40;
  --z-modal: 60;
  --z-toast: 80;
}
```

数字之间留间隔只是方便局部插层，重点是每一级有语义。组件不能自己发明全局 z-index；需要跨层时，应该进入对应的 overlay 容器。

设计系统还要规定同层多个浮层的顺序。比如 modal 中再打开日期选择器，日期浮层应跟随当前 modal 的 stacking scope，而不是因为全局 dropdown=40 被 modal=60 压住。实际实现可以让每个 modal 内有自己的局部 overlay，或者由浮层管理器按打开顺序分配层级。

## 一个容易被误诊的 pointer-events 问题

视觉上浮层已经在最上面，按钮却点不到，不一定还是 z-index。可能有一层透明遮罩覆盖在上面，或祖先设置了 `pointer-events: none`。

在控制台运行 `document.elementFromPoint(x, y)`，可以看某个坐标真正命中了谁：

```js
const target = document.elementFromPoint(420, 180)
console.log(target, getComputedStyle(target).pointerEvents)
```

这一步经常能找到透明但仍接收点击的元素。层叠顺序解决“画谁在上面”，命中测试决定“点击给谁”，两者不要混为一谈。

## 最后如何避免它再次出现

这类问题修完一页还不够。我会做三件事：

1. 删除没有证据的 `translateZ(0)` 和 `will-change`，不要把它们当通用性能开关；
2. 在组件文档中增加嵌套在 transform、overflow、滚动容器里的浮层用例；
3. 让弹窗、抽屉、Toast 通过同一个 overlay 系统，并统一层级 token。

所以 z-index 失效时，第一反应不应该是继续加数字。先找它所在的层叠上下文，再查祖先是否裁剪，最后确认点击命中。边界找对以后，999999 往往可以改回一个很小、也更可维护的值。

## 资料

- [MDN：层叠上下文](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_positioned_layout/Stacking_context)
- [MDN：理解 z-index](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index)
- [MDN：elementFromPoint](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/elementFromPoint)
