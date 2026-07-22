---
title: "TypeScript 3.7：可选链与空值合并进入日常开发"
date: 2019-11-05 09:00:00
tags:
  - 前端年鉴
  - TypeScript
  - 2019
categories:
  - 前端年鉴
description: "重试次数 0 被 || 偷偷改成 3：通过这个小 Bug 讲清可选链、空值合并、断言函数和数据契约。"
cover: /img/covers/frontend-chronicle-typescript-3-7.svg
top_img: /img/covers/frontend-chronicle-typescript-3-7.svg
toc: true
---
TypeScript 3.7 最先替我修掉的不是类型错误，而是一个被 `||` 写坏的业务规则。系统允许用户把重试次数设为 0，表示失败后不重试；旧代码却把 0 当成“没有配置”，偷偷改回默认值 3。

```ts
const retryCount = config.retryCount || 3
```

可选链和空值合并进入 TypeScript 后，大量层层判断终于可以缩短，但它们不是纯粹的语法糖。`?.` 与 `??` 对“缺失”的定义更精确，也迫使我们重新区分 null/undefined、空字符串、0 和 false。

## `||` 处理的是假值，`??` 处理的是空值

JavaScript 中这些值都会被 `||` 当成 false：

```ts
0
''
false
NaN
null
undefined
```

配置项如果允许 0、空字符串或 false，它们就不是缺省值。改成 `??` 后，只有 `null` 与 `undefined` 会走右侧默认值：

```ts
const retryCount = config.retryCount ?? 3
const nickname = user.nickname ?? '匿名用户'
const showTips = settings.showTips ?? true
```

这一处变化让业务语义更准确，但也不能机械替换所有 `||`。搜索框的展示值如果真的希望空字符串回落到“全部”，`keyword || '全部'` 仍可能是正确的。选哪个运算符取决于产品如何定义“没有值”。

## 可选链消掉了守卫金字塔

过去读取接口深层字段常写成：

```ts
const city = response
  && response.user
  && response.user.address
  && response.user.address.city
```

TypeScript 3.7 后可以写：

```ts
const city = response?.user?.address?.city
```

还有方法调用和索引形式：

```ts
logger?.warn?.('profile missing')
const firstError = errors?.[0]
```

短路只发生在紧挨着 `?.` 的访问链上。下面的除法仍会执行，`foo?.bar` 可能得到 undefined，在严格空值检查下也会报出风险：

```ts
const ratio = foo?.bar / 100
```

应该先明确缺失时的业务处理：

```ts
const ratio = foo?.bar == null ? null : foo.bar / 100
```

## 可选链太多，可能是在掩盖接口问题

刚支持可选链时，我们一度把接口访问都写成：

```ts
const amount = order?.payment?.detail?.amount ?? 0
```

页面不再报错了，但如果“已支付订单必须有 payment.detail”，这里显示 0 元会掩盖脏数据。可选链适合业务上允许缺失的边界，比如访客可能没有头像；对于领域模型中必需的数据，应该在入口校验并形成可靠类型。

```ts
type PaidOrder = {
  status: 'paid'
  payment: {
    detail: { amount: number }
  }
}

function parsePaidOrder(input: unknown): PaidOrder {
  // 真实项目可使用 schema 库完成运行时校验
  if (!isObject(input) || input.status !== 'paid') {
    throw new Error('Invalid paid order')
  }
  // 省略其余字段检查
  return input as PaidOrder
}
```

类型只能约束编译时已经信任的数据，接口 JSON、localStorage 和 URL 参数仍要做运行时验证。

## 断言函数把运行时检查告诉类型系统

TypeScript 3.7 还加入了 assertion functions。以前写一个通用断言，执行后类型系统未必知道值已经非空：

```ts
function assertDefined<T>(value: T, name: string): asserts value is NonNullable<T> {
  if (value == null) {
    throw new Error(`${name} is required`)
  }
}

function renderUser(user: User | undefined) {
  assertDefined(user, 'user')
  console.log(user.name) // 此处已经收窄为 User
}
```

这类函数适合程序无法继续的前置条件，例如根 DOM 节点、必要配置和经过鉴权后必须存在的上下文。它不是把值“变安全”，而是在运行时失败路径与编译时收窄之间建立联系。

如果断言函数实现写错，类型系统会相信错误承诺。因此通用 assertion 应保持短小并有测试，不能只写 `return` 或滥用 `as`。

## Optional call 很适合可选回调

组件 API 中的回调经常可选：

```ts
type SaveOptions = {
  onSuccess?: (id: string) => void
  onError?: (error: Error) => void
}

async function save(options: SaveOptions) {
  try {
    const id = await requestSave()
    options.onSuccess?.(id)
  } catch (error) {
    options.onError?.(error as Error)
  }
}
```

它比 `if (options.onSuccess)` 更紧凑，也准确表达“函数可能不存在”。不过如果属性存在却不是函数，调用仍会抛错；来自不可信 JSON 的值不能只靠可选调用保护。

## 升级时不只检查 TypeScript 编译器

新语法需要整条工具链认识。TypeScript 能编译，不代表旧版 Babel、ESLint、压缩器和测试器都能解析源码。我们升级时检查了：

1. `tsc` 输出目标是否符合浏览器范围；
2. Babel/loader 是否重复转换或破坏 source map；
3. ESLint parser 与格式化工具是否支持新语法；
4. Jest 等测试环境读取的是源码还是编译产物；
5. 实际生产包中是否保留目标浏览器不支持的语法。

## 写得更短不等于模型更可靠

TypeScript 3.7 让日常代码舒服了很多。到今天，可选链与空值合并已经像默认语言能力一样自然。但我仍会在评审时问一句：这个值为什么可能为空？

如果答案是“业务允许缺失”，`?.`/`??` 很合适；如果答案是“接口偶尔不靠谱”，应该先校验和修数据契约；如果答案是“不知道”，连续十个问号只会把错误推迟到更难发现的位置。简洁语法的最好用法，是更准确地表达边界，而不是让所有异常都沉默。

## 资料

- [TypeScript 3.7 发布说明](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html)
- [ECMAScript：Optional Chaining](https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-optional-chaining)
