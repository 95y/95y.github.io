---
title: "Babel 7：现代 JavaScript 转译体系重新整理"
date: 2018-08-27 09:00:00
tags:
  - 前端年鉴
  - Babel
  - 2018
categories:
  - 前端年鉴
description: "IE 报错 includes 不存在，但 Babel 明明已经生效：借一次兼容事故分清语法转换、目标浏览器与 polyfill。"
cover: /img/covers/frontend-chronicle-babel-7-modern-transpilation.svg
top_img: /img/covers/frontend-chronicle-babel-7-modern-transpilation.svg
toc: true
---
有一次测试同事拿着 IE 11 的报错截图来找我：`对象不支持“includes”属性或方法`。我打开构建产物，箭头函数、模板字符串都已经被 Babel 转成旧语法，于是下意识地认为“Babel 明明生效了”。

后来才意识到，`Array.prototype.includes` 是运行时 API，不是可以简单改写的语法。Babel 能把箭头函数变成普通函数，却不能凭空让旧浏览器拥有一个不存在的方法。Babel 7 前后，团队逐渐把“语法转换、目标环境、polyfill”当作三个相连但不同的问题，这比包名升级本身重要得多。

## 先把 Babel 的工作分成三层

以这段代码为例：

```js
const loadUsers = async () => {
  const response = await fetch('/api/users')
  const users = await response.json()
  return users.find(user => user.active)
}
```

这里混着三类兼容性：

- `const`、箭头函数和 async 函数属于语法；
- async 转换后可能需要 generator/runtime 辅助；
- `fetch` 与 `Array.prototype.find` 是宿主或内建 API。

Babel 负责解析并转换语法，preset 根据目标环境决定哪些转换需要启用，polyfill 策略则补齐目标运行时缺少的 API。把三者都叫“转译”，排查时就很容易答非所问。

## Babel 7 升级不是只改包名前缀

官方包进入 `@babel` 命名空间后，配置也更容易看出职责：

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": "> 0.5%, not dead",
        "useBuiltIns": "usage",
        "corejs": "3.0"
      }
    ]
  ]
}
```

这只是当时的一种项目配置示意，不能不加判断地复制到今天。关键是 `targets` 必须对应产品实际支持范围，`useBuiltIns` 与 core-js 版本必须由项目统一管理。若入口又手工导入整套 polyfill，业务文件里还按需注入，产物可能出现重复代码。

我们升级时把旧包逐个对应到新名字，而不是同时更换所有 preset：

```text
babel-core       -> @babel/core
babel-preset-env -> @babel/preset-env
babel-loader     -> 与 Babel 7 兼容的 babel-loader
```

先保证转换结果不变，再调整浏览器目标与 polyfill。把“版本迁移”和“兼容策略重构”拆开后，出现问题时才知道是哪一层造成的。

## Browserslist 才是产品支持声明

以前很多配置直接写 `targets: { ie: 11 }`，另一个工具又维护自己的浏览器列表。后来我们把目标集中到 `package.json` 的 Browserslist：

```json
{
  "browserslist": {
    "production": [
      "> 0.5%",
      "last 2 versions",
      "not dead"
    ],
    "development": [
      "last 1 chrome version"
    ]
  }
}
```

Babel、Autoprefixer 等工具可以共享这份声明。但百分比查询不是永久答案，浏览器使用数据会变化，企业内网、收银设备和 WebView 也未必反映在公共统计里。我们会结合线上 UA/能力监控确认，而不是为了少几 KB 擅自放弃仍有用户的环境。

## “编译成功”为什么仍会白屏

那次 `includes` 故障最终按下面的顺序定位：

1. 在目标浏览器打开控制台，记录第一个异常而不是后续连锁报错；
2. 检查 source map，确认来自业务代码还是第三方依赖；
3. 在构建产物中搜索对应语法/API；
4. 用兼容性数据确认目标环境是否原生支持；
5. 检查 polyfill 是否被注入，以及是否早于业务入口执行。

修复没有选择在全局随手加一段：

```js
Array.prototype.includes = function () { /* 临时手写实现 */ }
```

这种补丁很难完整复现规范边界，还可能污染全局。我们改为统一 core-js 策略，并为目标浏览器增加一条真实构建产物的冒烟测试。

## 应用与组件库的 polyfill 策略不同

应用知道自己的运行环境，可以在入口统一补齐能力；发布到 npm 的组件库却不应该随意修改消费者全局对象。库更适合使用 `@babel/plugin-transform-runtime` 来复用辅助函数，并在文档中声明需要的环境能力。

```json
{
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      { "helpers": true, "regenerator": true }
    ]
  ]
}
```

否则多个依赖各自内联 `_extends`、`_classCallCheck` 等 helper，体积会重复；而库偷偷引入全局 polyfill，又可能与宿主应用版本冲突。

## TypeScript 能解析，不代表做了类型检查

Babel 7 对 TypeScript 语法的支持让一条快速构建链路成为可能。使用 `@babel/preset-typescript` 时，Babel 会移除类型语法，但它不负责像 `tsc` 那样验证类型。

```ts
type User = { id: number }

const user: User = { id: 'not-a-number' }
console.log(user.id)
```

这段代码可以被 Babel 成功输出 JavaScript，但类型显然错误。因此我们的 CI 仍单独运行 `tsc --noEmit`。构建速度和类型检查是两个任务，合在同一工具里不是唯一选择，拆开以后也不能漏掉后者。

## 不再默认把所有代码压回 ES5

为了兼容最老环境而把全部代码转换到 ES5，会增加 helper、破坏部分原生优化，也让现代用户下载更多代码。更实际的做法是明确支持矩阵：确实需要旧环境就保留对应构建与测试；只支持现代浏览器时就及时提高目标，不让历史配置永久存在。

Babel 7 给我留下的经验，是不要把“能构建”当作兼容性证明。每次调整都应该能回答：代码使用了哪些语法和 API，目标环境缺什么，哪一层负责补，最后有没有在真实目标上跑过。只有这条链闭合，转译配置才不是一堆碰巧工作的 JSON。

## 资料

- [Babel 7.0 发布说明](https://babeljs.io/blog/2018/08/27/7.0.0)
- [Babel：@babel/preset-env](https://babeljs.io/docs/babel-preset-env)
- [Browserslist](https://github.com/browserslist/browserslist)
