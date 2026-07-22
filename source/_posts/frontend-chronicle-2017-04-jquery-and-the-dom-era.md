---
title: "从 jQuery 出发：DOM 操作时代的成熟与转折"
date: 2017-04-15 09:00:00
tags:
  - 前端年鉴
  - jQuery
  - 2017
categories:
  - 前端年鉴
description: "从一张越改越乱的订单表出发，记录 jQuery 老项目怎样拆状态、管插件，并在不推倒重来的前提下逐步迁移。"
cover: /img/covers/frontend-chronicle-jquery-and-the-dom-era.svg
top_img: /img/covers/frontend-chronicle-jquery-and-the-dom-era.svg
toc: true
---
第一次接手那套运营后台时，页面里没有组件，也没有统一状态。筛选条件藏在表单控件中，当前页码挂在 DOM 的 `data-page` 上，弹窗是否打开要看某个 class。一个列表页能找到十几处 `$('.result')`，任何一处都可能重画同一块内容。

这就是我记忆里的 2017 年。Vue 和 React 已经很热门，但大量真正挣钱的项目仍由 jQuery 驱动。回头看，jQuery 并不是“落后的代名词”，它曾经非常准确地解决了选择器、事件、Ajax 和浏览器差异这些现实问题。后来让人吃力的，是页面规模已经变了，代码的组织方式却没跟上。

## 那张越改越乱的订单表

订单表最开始只有查询和翻页，后来陆续加上批量勾选、状态修改、导出和行内编辑。代码仍然沿用“事件发生后直接修改 DOM”的写法：

```js
$('#search').on('click', function () {
  $.get('/api/orders', $('#filters').serialize(), function (result) {
    $('#result').html(renderRows(result.list))
    $('#total').text(result.total)
  })
})

$('#result').on('click', '.js-cancel', function () {
  var id = $(this).closest('tr').data('id')
  $.post('/api/orders/' + id + '/cancel', function () {
    $('#search').trigger('click')
  })
})
```

这段代码短，也确实能工作。麻烦在于状态没有明确归属：筛选条件来自 DOM，数据在 Ajax 回调里，分页又可能读全局变量。取消订单后只能模拟点击查询按钮，因为项目里并不存在一个可以复用的“重新加载订单”动作。

新增需求时，开发者通常再绑一个事件、再找一次元素。时间久了，同一个按钮可能在页面初始化、弹窗打开和局部刷新后被重复绑定。偶发的重复请求不是接口问题，而是初始化函数走了三遍。

## 事件委托是优点，也容易藏住边界

jQuery 的事件委托非常适合动态列表。父元素只绑定一次，后插入的行仍然可以响应点击：

```js
$('#result').on('click.orders', '.js-detail', function (event) {
  var orderId = $(event.currentTarget).closest('tr').data('id')
  openOrderDetail(orderId)
})
```

这里我特意加了 `.orders` 命名空间。它允许模块销毁时精确解绑：

```js
function destroyOrderPage() {
  $('#result').off('.orders')
  $('#filters').off('.orders')
  orderTable && orderTable.destroy()
}
```

以前我只关心“点了有没有反应”，后来才意识到初始化和销毁必须成对出现。页面被 PJAX、标签页容器或微前端反复挂载时，没有销毁路径的 jQuery 模块一样会产生监听器和内存泄漏。

## 没有先换框架，而是先把状态拿出 DOM

直接把整张表重写成新框架风险很大：日期插件、打印控件和导出逻辑都缺少测试，业务人员又每天使用。我们先做了一个不起眼的改动，把查询参数和请求动作收进普通 JavaScript 模块。

```js
var orderState = {
  filters: { keyword: '', status: 'all' },
  page: 1,
  pageSize: 20
}

function loadOrders() {
  $('#result').addClass('is-loading')

  return $.getJSON('/api/orders', {
    ...orderState.filters,
    page: orderState.page,
    pageSize: orderState.pageSize
  }).then(function (result) {
    renderOrderTable(result)
    return result
  }).always(function () {
    $('#result').removeClass('is-loading')
  })
}
```

搜索按钮只更新 `orderState`，翻页也只更新 `orderState.page`，最后都调用 `loadOrders()`。这一步没有改变视觉效果，却让数据来源第一次变得清楚。等到后来把表格视图换成组件时，请求和业务规则都能继续使用。

## 最难搬走的是插件，不是 `$`

把 `$('.title').text(value)` 改成 `document.querySelector('.title').textContent = value` 没有多大价值。真正昂贵的是那些把状态存在元素内部的插件。

以日期选择器为例，迁移前至少要回答四个问题：

- 它在什么时候初始化，重复初始化会不会再插入一份浮层；
- 外部值变化时，调用哪个 API 才能同步到控件；
- 插件注册了哪些 document/window 级监听；
- 元素移除之前有没有 `destroy`，销毁后还能否重新挂载。

我们给旧插件包了一层适配器，只暴露 `mount`、`setValue` 和 `destroy`。新旧页面都通过这层调用。这样替换插件时改的是适配器，而不是在几十个页面里搜索字符串。

## 逐步迁移时留下的几条规矩

老系统最怕“看起来现代、实际不可回滚”的重写。后来再处理类似项目，我会坚持几条比较朴素的规则：

1. 先锁住 jQuery 和关键插件版本，避免迁移期间继续漂移。
2. 用真实业务路径补回归测试，至少覆盖查询、翻页、提交和弹窗关闭。
3. 新代码不再随处读取 DOM 状态，请求与数据转换先写成普通函数。
4. 每个旧模块都有明确的初始化和销毁入口。
5. 以页面区域为单位替换，不让两个视图系统同时修改同一块 DOM。

今天从零写项目，我不会再用 jQuery 组织复杂应用；但维护老项目时，我也不会把“删掉 `$`”当成目标。迁移真正要做的是把隐含状态、生命周期和模块边界重新找回来。框架只是接住这些边界的工具。

## 资料

- [jQuery 3.2.1 发布说明](https://blog.jquery.com/2017/03/20/jquery-3-2-1-now-available/)
- [jQuery API：`.on()`](https://api.jquery.com/on/)
