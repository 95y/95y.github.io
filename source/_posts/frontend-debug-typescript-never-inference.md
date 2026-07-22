---
title: "TypeScript never 排查：类型为什么被收窄到不可能"
date: 2025-08-15 14:00:00
tags:
  - 前端排障
  - TypeScript
categories:
  - 前端排障
description: "把 never 当成“这里已无可能值”的诊断信号，逐例排查空数组、穷尽分支、错误守卫、条件类型与 React ref。"
cover: /img/covers/frontend-debug-typescript-never-inference.svg
top_img: /img/covers/frontend-debug-typescript-never-inference.svg
toc: true
---
`never` 第一次出现在业务代码里时很像 TypeScript 发脾气：变量明明存在，为什么提示 `Property 'id' does not exist on type 'never'`？后来我把它当成一个诊断信号——类型系统认为“走到这里已经没有任何可能值”。

有时这是推导信息不足，例如空数组；有时是控制流已经穷尽；还有时是上游模型写错，两个条件把所有可能性排除了。直接 `as any` 会把线索抹掉。下面按几个真实常见病例分别查。

## 病例一：空数组没有元素信息

```ts
const tasks = []
tasks.push({ id: 'build', done: false })
```

在不同上下文和编译选项下，空数组可能被推导得过窄，React `useState([])` 也常得到 `never[]`：

```tsx
const [tasks, setTasks] = useState([])

setTasks(current => [
  ...current,
  { id: 'build', done: false }
])
```

初始值没有告诉泛型元素类型。直接补业务类型：

```tsx
type Task = {
  id: string
  done: boolean
}

const [tasks, setTasks] = useState<Task[]>([])
```

这不是“骗过 TypeScript”，而是初始化数据确实不足以推导未来元素。容器 API 设计也应该允许调用方提供泛型。

## 病例二：一个分支已经不可能进入

```ts
type Status = 'idle' | 'loading' | 'success'

function label(status: Status) {
  if (status === 'idle') return '等待'
  if (status === 'loading') return '加载中'
  if (status === 'success') return '完成'

  console.log(status) // never
}
```

这里 `never` 是正确的：三种联合成员已经处理完。可以利用它做穷尽检查：

```ts
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`)
}

function label(status: Status) {
  switch (status) {
    case 'idle': return '等待'
    case 'loading': return '加载中'
    case 'success': return '完成'
    default: return assertNever(status)
  }
}
```

以后 Status 新增 `'error'`，default 中的 status 不再是 never，编译器会提醒补分支。这里不应该“修掉 never”，它正在保护完整性。

## 病例三：业务状态用多个布尔值，条件互相打架

```ts
type RequestState = {
  loading: boolean
  success: boolean
  error?: Error
}
```

它允许 `loading=true`、`success=true`、`error` 同时存在。开发者再写复杂判断，控制流很快进入难以理解的交集。

用可辨识联合表达合法状态：

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

function render<T>(state: RequestState<T>) {
  switch (state.status) {
    case 'idle': return '尚未加载'
    case 'loading': return '加载中'
    case 'success': return state.data
    case 'error': return state.error.message
  }
}
```

`never` 经常是在提醒上游模型不够准确，而不是某个属性需要强制断言。

## 病例四：类型守卫说了一个不真实的承诺

```ts
type Cat = { kind: 'cat'; meow(): void }
type Dog = { kind: 'dog'; bark(): void }
type Pet = Cat | Dog

function isCat(pet: Pet): pet is Cat {
  return pet.kind === 'dog' // 实现与谓词相反
}
```

TypeScript 会信任用户定义的 type predicate，错误守卫让后续分支收窄到荒谬状态。应该让谓词和实际检查一致，并给守卫写运行时测试：

```ts
function isCat(pet: Pet): pet is Cat {
  return pet.kind === 'cat'
}
```

对不可信 JSON，不要仅用 `as Pet` 后再守卫一两个字段；使用完整 schema 校验建立可信类型。

## 病例五：泛型条件类型分发后没有成员

```ts
type ExtractByKind<T, K> = T extends { kind: K } ? T : never

type Event =
  | { kind: 'click'; x: number; y: number }
  | { kind: 'submit'; formId: string }

type ScrollEvent = ExtractByKind<Event, 'scroll'> // never
```

这里没有 kind=scroll 的成员，结果理应 never。若业务以为存在 scroll，应该修联合类型或调用参数，而不是在使用处断言。

调试复杂类型时，把每一步拆成命名别名：

```ts
type Kinds = Event['kind']
type ClickOnly = ExtractByKind<Event, 'click'>
type Missing = ExtractByKind<Event, 'scroll'>
```

IDE hover 每个中间类型，比盯着一条 200 字符条件类型有效。

## 病例六：`filter` 以后推断比预期窄或不够窄

过滤空值建议提供正确守卫：

```ts
const values: Array<string | null> = ['a', null, 'b']

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null
}

const strings = values.filter(isDefined) // string[]
```

不要写一个无论输入什么都声称 `value is never` 或不准确的通用 helper。类型工具越通用，错误影响范围越大。

## 一个实际的 React ref 误判

```tsx
const inputRef = useRef(null)

function focus() {
  inputRef.current?.focus()
}
```

没有泛型时 current 只知道初始 null，某些上下文会导致属性访问错误。声明元素类型：

```tsx
const inputRef = useRef<HTMLInputElement>(null)
```

注意 ref 在挂载前/卸载后确实为 null，可选链仍有意义。非空断言 `inputRef.current!.focus()` 只有在调用时机被严格保证时才用，否则只是把错误推到运行时。

## 我实际如何定位一条 never

1. 把报错表达式拆成中间变量，逐个看 hover 类型；
2. 找到最早出现 never 的地方，不在最后属性访问处修；
3. 检查空数组/null 是否缺泛型上下文；
4. 检查 if/switch 前面的联合成员是否已全部排除；
5. 检查自定义守卫、assertion function 是否说真话；
6. 展开条件类型，看输入联合是否真的有匹配成员；
7. 用 `satisfies` 验证对象契约，少用宽泛 `as`。

```ts
const transitions = {
  idle: ['loading'],
  loading: ['success', 'error'],
  success: ['loading'],
  error: ['loading']
} satisfies Record<string, readonly string[]>
```

## `any`、双重断言和关闭 strict 为什么不算修复

```ts
const task = value as unknown as Task
```

双重断言可以让几乎任何类型通过，但没有产生运行时校验，也没有修正模型。它只适合极少数无法表达、又有外部证明的边界，并应封装和注释。大多数业务 never 都能通过补泛型、修联合/守卫或删除不可能条件解决。

关闭 strict 会让更多问题晚到运行时，不会让代码逻辑更正确。

## 把 never 当作“无可能值”来读

看到错误时，把句子改写成：“在 TypeScript 已知条件下，这里没有任何可能值。”然后问为什么：确实穷尽了，还是信息丢了，还是上游撒了谎？

空数组要补信息；穷尽分支应该利用 never；错误守卫和状态模型要从源头修。理解这三类以后，`Property does not exist on never` 就不再像随机报错，而是一条很具体的推理结果。

## 资料

- [TypeScript Handbook：Narrowing - The never type](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)
- [TypeScript Handbook：Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
