import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Keep this generator outside Hexo's reserved scripts directory.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const postsDir = path.join(root, 'source', '_posts')
const coversDir = path.join(root, 'source', 'img', 'covers')

const sources = {
  jquery: ['jQuery 3.2.1 发布说明', 'https://blog.jquery.com/2017/03/20/jquery-3-2-1-now-available/'],
  es2017: ['ECMAScript 2017 规范', 'https://262.ecma-international.org/8.0/'],
  react16: ['React v16.0', 'https://legacy.reactjs.org/blog/2017/09/26/react-v16.0.html'],
  webpack4: ['webpack 官方博客', 'https://webpack.js.org/blog/'],
  babel7: ['Babel 7.0.0', 'https://babeljs.io/blog/2018/08/27/7.0.0'],
  hooks: ['React v16.8：Hooks', 'https://legacy.reactjs.org/blog/2019/02/06/react-v16.8.0.html'],
  svelte3: ['Svelte 3：Rethinking reactivity', 'https://svelte.dev/blog/svelte-3-rethinking-reactivity'],
  ts37: ['TypeScript 3.7 发布说明', 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html'],
  deno1: ['Deno 1.0', 'https://deno.com/blog/v1'],
  vite: ['Vite 官方博客', 'https://vite.dev/blog/'],
  vue3: ['Vue 3.0 发布公告', 'https://blog.vuejs.org/posts/vue-3-one-piece'],
  webpack5: ['webpack 5 发布公告', 'https://webpack.js.org/blog/2020-10-10-webpack-5-release/'],
  rsc: ['React Server Components 介绍', 'https://legacy.reactjs.org/blog/2020/12/21/data-fetching-with-react-server-components.html'],
  node: ['Node.js 历史版本', 'https://nodejs.org/en/about/previous-releases'],
  next: ['Next.js 官方博客', 'https://nextjs.org/blog'],
  react18: ['React v18.0', 'https://react.dev/blog/2022/03/29/react-v18'],
  bun1: ['Bun 1.0', 'https://bun.sh/blog/bun-v1.0'],
  vue35: ['Vue 3.5 发布公告', 'https://blog.vuejs.org/posts/vue-3-5'],
  react19: ['React v19', 'https://react.dev/blog/2024/12/05/react-19'],
  tailwind4: ['Tailwind CSS v4.0', 'https://tailwindcss.com/blog/tailwindcss-v4'],
  cra: ['Create React App 停止推荐', 'https://react.dev/blog/2025/02/14/sunsetting-create-react-app'],
  ts59: ['TypeScript 5.9', 'https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/'],
  compiler: ['React Compiler v1.0', 'https://react.dev/blog/2025/10/07/react-compiler-1'],
  next16: ['Next.js 16', 'https://nextjs.org/blog/next-16'],
  foundation: ['React Foundation', 'https://react.dev/blog/2026/02/24/the-react-foundation'],
  vite8: ['Vite 8.0', 'https://vite.dev/blog/announcing-vite8'],
  ts6: ['TypeScript 6.0', 'https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/'],
  node26: ['Node.js 26.0.0', 'https://nodejs.org/en/blog/release/v26.0.0'],
  vite81: ['Vite 8.1', 'https://vite.dev/blog/announcing-vite8-1'],
  eventloop: ['MDN：事件循环', 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Event_loop'],
  stacking: ['MDN：层叠上下文', 'https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_positioned_layout/Stacking_context'],
  cors: ['MDN：跨源资源共享', 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS'],
  esm: ['Node.js：ECMAScript modules', 'https://nodejs.org/api/esm.html'],
  hydration: ['React：hydrateRoot', 'https://react.dev/reference/react-dom/client/hydrateRoot'],
  memory: ['Chrome DevTools：内存问题', 'https://developer.chrome.com/docs/devtools/memory-problems/']
}

const history = [
  {
    date: '2017-04-15', slug: 'jquery-and-the-dom-era', topic: 'jQuery',
    title: '从 jQuery 出发：DOM 操作时代的成熟与转折',
    event: '2017 年的前端项目仍大量依赖 jQuery。它把选择器、事件、动画、Ajax 与浏览器兼容性封装成统一 API，是许多团队进入工程化之前最可靠的基础设施。',
    changes: ['链式 API 降低了直接操作 DOM 的门槛', 'Ajax 与插件生态让页面从静态展示走向富交互', '组件化框架开始接管状态与视图同步，手工维护 DOM 的成本逐渐暴露'],
    impact: 'jQuery 解决的是浏览器差异和命令式 DOM 操作；React、Vue 等框架随后解决的是复杂状态下的界面组织问题。两者不是简单的“新工具淘汰旧工具”，而是问题规模发生了变化。',
    today: '维护老系统时不必立刻移除 jQuery。先锁定版本、补自动化测试、隔离插件，再把高变化区域逐步迁移到组件边界，风险通常比一次性重写更低。',
    refs: ['jquery']
  },
  {
    date: '2017-06-30', slug: 'es2017-async-await', topic: 'JavaScript',
    title: 'ES2017 与 async/await：异步代码开始像同步代码一样可读',
    event: 'ES2017 将 async/await 纳入标准，使 Promise 链可以用结构化控制流表达。异步请求、错误处理和并行任务的写法由此发生长期变化。',
    changes: ['await 让异步流程拥有普通的 try/catch 错误边界', 'Promise.all 继续承担互不依赖任务的并发调度', '构建工具与运行时兼容目标开始决定是否需要转译 async 函数'],
    impact: '可读性提高并不等于性能自动提高。连续 await 可能把本可并行的请求变成瀑布流，因此“表达清晰”和“并发正确”需要同时设计。',
    today: '默认使用 async/await 表达业务流程；对独立任务先创建 Promise 再统一等待，并明确超时、取消和失败策略。',
    refs: ['es2017']
  },
  {
    date: '2017-09-26', slug: 'react-16-fiber', topic: 'React',
    title: 'React 16 与 Fiber：渲染架构为并发能力打下基础',
    event: 'React 16 发布新的 Fiber 协调器，并带来错误边界、Fragments、Portal 等能力。对业务代码而言 API 变化有限，但底层渲染模型已经重构。',
    changes: ['错误边界让组件树局部失败时可以降级展示', 'Fragments 减少只为满足结构而添加的包装节点', 'Fiber 把渲染工作拆成可调度单元，为后来的并发渲染铺路'],
    impact: '这是一次“用户看见的功能不多、架构意义很大”的升级。前端框架开始把调度优先级纳入渲染系统，而不仅是同步计算虚拟 DOM。',
    today: '理解 Fiber 不需要依赖内部字段；更重要的是保持 render 纯净、正确处理副作用，并接受渲染可能被暂停或重新执行。',
    refs: ['react16']
  },
  {
    date: '2018-02-25', slug: 'webpack-4-zero-config', topic: 'webpack',
    title: 'webpack 4：从复杂配置走向合理默认值',
    event: 'webpack 4 引入 development 与 production 模式，强化默认优化，并显著改善构建性能。前端构建开始从“所有选项都手配”转向约定优于配置。',
    changes: ['mode 统一开发与生产环境的基础优化策略', '更好的 Tree Shaking 和模块拼接降低生产包开销', '生态开始围绕 loader、plugin 与代码分割形成稳定分工'],
    impact: '构建配置不再只是能跑即可，而成为缓存、包体积、发布稳定性和开发体验的共同入口。',
    today: '老 webpack 项目先分析产物和升级插件，不要复制一份全新的配置硬替换；每次升级都应对比构建时间、首屏资源和运行时错误。',
    refs: ['webpack4']
  },
  {
    date: '2018-08-27', slug: 'babel-7-modern-transpilation', topic: 'Babel',
    title: 'Babel 7：现代 JavaScript 转译体系重新整理',
    event: 'Babel 7 统一包命名空间、改进 TypeScript 解析支持，并推动 preset-env 与按目标环境转译成为主流。',
    changes: ['官方包迁移到 @babel 命名空间', 'preset-env 根据浏览器目标决定语法转换范围', '语法转译与运行时 polyfill 的职责被更明确地区分'],
    impact: '团队开始意识到“代码能被编译”不代表“目标浏览器拥有所需 API”。语法降级、polyfill 和浏览器列表需要作为一套兼容策略管理。',
    today: '定期更新 Browserslist 数据，避免无差别转译到 ES5；同时检查 core-js 或运行时 API 的引入方式，防止重复 polyfill。',
    refs: ['babel7']
  },
  {
    date: '2019-02-06', slug: 'react-hooks', topic: 'React',
    title: 'React Hooks：状态逻辑从类组件中解放出来',
    event: 'React 16.8 正式提供 Hooks，函数组件可以使用状态、上下文和副作用。复用逻辑从高阶组件与 render props 转向自定义 Hook。',
    changes: ['useState 和 useReducer 承担局部状态', 'useEffect 统一描述与外部系统同步的副作用', '自定义 Hook 让状态逻辑按业务能力组合'],
    impact: 'Hooks 改善了逻辑复用，也带来了依赖数组、闭包和副作用时机等新型错误。它要求开发者把“同步外部系统”与“计算派生值”区分开。',
    today: '能在渲染中计算的值不要放进 Effect；Effect 中订阅的资源必须清理；复杂状态优先通过 reducer 或更清晰的数据边界组织。',
    refs: ['hooks']
  },
  {
    date: '2019-04-22', slug: 'svelte-3-compiler-reactivity', topic: 'Svelte',
    title: 'Svelte 3：把响应式工作前移到编译阶段',
    event: 'Svelte 3 以编译器为核心重新设计响应式语法。它不依赖运行时虚拟 DOM，而是在构建阶段生成精确更新 DOM 的代码。',
    changes: ['赋值语句可以触发响应式更新', '组件产物聚焦实际使用的运行时代码', '编译器参与组件语义，而不仅是转换新语法'],
    impact: 'Svelte 证明了框架设计不只有运行时虚拟 DOM 一条路线，也推动整个生态重新讨论编译优化、信号和细粒度更新。',
    today: '选择框架时应评估团队生态、SSR、调试和长期维护，不应只比较 Hello World 包体积。',
    refs: ['svelte3']
  },
  {
    date: '2019-11-05', slug: 'typescript-3-7', topic: 'TypeScript',
    title: 'TypeScript 3.7：可选链与空值合并进入日常开发',
    event: 'TypeScript 3.7 支持可选链、空值合并和断言函数。大量防御式属性访问变得简洁，同时类型收窄能力继续增强。',
    changes: ['?. 只在 null 或 undefined 时停止访问', '?? 不会把 0、空字符串和 false 当作缺省值', 'asserts 返回类型可以把运行时校验反馈给类型系统'],
    impact: '简洁语法减少样板代码，但连续可选链也可能掩盖数据契约缺失。类型安全的目标不是让所有访问都不报错，而是尽早暴露不应该为空的数据。',
    today: '只对业务允许缺失的边界使用可选链；核心领域对象仍应通过解析和校验形成可靠类型。',
    refs: ['ts37']
  },
  {
    date: '2020-05-13', slug: 'deno-1-secure-runtime', topic: 'Deno',
    title: 'Deno 1.0：JavaScript 运行时重新思考安全与工具集成',
    event: 'Deno 1.0 发布，默认限制文件、网络和环境变量权限，并内置 TypeScript、格式化、测试等工具。',
    changes: ['权限模型从默认全开改为显式授权', 'Web 标准 API 成为运行时设计的重要参照', '单一可执行文件整合常用开发工具'],
    impact: 'Deno 没有立即替代 Node.js，但它推动运行时竞争重新活跃，并影响后来的权限模型、原生 TypeScript 支持和工具集成方向。',
    today: '选运行时应先看部署平台、依赖兼容性和团队运维能力；安全默认值值得借鉴，但生态迁移成本也必须量化。',
    refs: ['deno1']
  },
  {
    date: '2020-07-15', slug: 'vite-native-esm-origin', topic: 'Vite',
    title: 'Vite 萌芽：原生 ESM 改变开发服务器思路',
    event: 'Vite 最初从 Vue 单文件组件的快速开发原型成长起来，核心思路是不再为每次启动预先打包整个应用，而是利用浏览器原生 ESM 按需提供模块。',
    changes: ['开发阶段按请求转换模块，降低冷启动成本', '依赖预构建与源码按需编译采用不同策略', '生产构建继续交给成熟打包器完成优化'],
    impact: '大型项目中“依赖规模越大，启动越慢”的传统模型受到挑战，前端工具链开始广泛采用原生语言编写的高性能工具。',
    today: 'Vite 很快，但项目性能仍会受插件数量、巨型依赖和模块图影响；升级工具不能替代依赖治理。',
    refs: ['vite']
  },
  {
    date: '2020-09-18', slug: 'vue-3-composition-api', topic: 'Vue',
    title: 'Vue 3：Composition API、Proxy 与 TypeScript 基础重构',
    event: 'Vue 3.0 正式发布，响应式系统改用 Proxy，并提供 Composition API，以改善大型组件的逻辑组织和 TypeScript 推导。',
    changes: ['Proxy 可以观察属性新增、删除和集合类型', 'Composition API 按业务关注点组织逻辑', 'Tree-shakable API 与更好的 TypeScript 集成改善工程体验'],
    impact: 'Vue 从适合渐进增强的小型框架，进一步扩展到大型应用与跨框架工具链。迁移难点主要集中在生态兼容和响应式语义，而不是模板语法。',
    today: '优先使用官方迁移工具和兼容构建；不要把所有逻辑塞进一个 setup，仍需按领域拆分 composable。',
    refs: ['vue3']
  },
  {
    date: '2020-10-10', slug: 'webpack-5', topic: 'webpack',
    title: 'webpack 5：长期缓存与 Module Federation',
    event: 'webpack 5 完成核心架构升级，改善持久化缓存、长期缓存和 Tree Shaking，并正式带来 Module Federation。',
    changes: ['文件系统缓存显著缩短重复构建时间', '确定性模块与 chunk ID 改善浏览器长期缓存', 'Module Federation 支持运行时加载远程构建产物'],
    impact: '微前端获得强大的底层能力，但远程模块也引入版本协商、部署原子性和故障隔离等分布式系统问题。',
    today: '只有在团队和发布边界确实独立时才引入 Federation；共享依赖必须约束版本，并准备远程模块不可用时的降级方案。',
    refs: ['webpack5']
  },
  {
    date: '2020-12-21', slug: 'react-server-components-research', topic: 'React',
    title: 'React Server Components：组件边界延伸到服务器',
    event: 'React 团队公开 Server Components 研究成果：部分组件只在服务器执行，并以可流式传输的描述与客户端组件组合。',
    changes: ['服务器组件可以直接访问后端资源而不把实现发给浏览器', '客户端组件继续承载状态和交互', '打包器与框架需要理解服务器/客户端模块边界'],
    impact: '前端架构重新从纯客户端 SPA 转向服务器与客户端协同。数据获取、缓存、序列化和安全边界成为组件设计的一部分。',
    today: 'Server Components 应通过成熟框架采用；任何 use server 入口都要按公开接口进行鉴权、校验和审计。',
    refs: ['rsc']
  },
  {
    date: '2021-02-16', slug: 'vite-2', topic: 'Vite',
    title: 'Vite 2：从 Vue 工具成长为框架无关构建平台',
    event: 'Vite 2 首个稳定版本发布，核心改为框架无关，通过插件支持 Vue、React、Preact 等生态。',
    changes: ['esbuild 用于依赖预构建，显著改善冷启动', '兼容 Rollup 插件模型，降低生态建设成本', 'CSS、Worker、静态资源与 SSR 获得统一开发体验'],
    impact: 'Vite 不只是更快的 dev server，它把工具能力下沉为多种上层框架共享的基础设施。',
    today: '新项目可优先评估 Vite；旧项目迁移前要盘点 webpack 专用 loader、Node polyfill 和环境变量行为。',
    refs: ['vite']
  },
  {
    date: '2021-04-20', slug: 'node-16-esm', topic: 'Node.js',
    title: 'Node.js 16：ESM、现代 V8 与前端工具运行时升级',
    event: 'Node.js 16 发布并随后进入 LTS。前端工具链开始更广泛依赖原生 ESM、更新的 V8 和稳定 ABI。',
    changes: ['package.json 的 type 字段逐渐成为模块边界的重要配置', '工具作者需要同时处理 ESM 与 CommonJS 消费方式', '更现代的运行时允许构建工具减少语法兼容包袱'],
    impact: 'Node 版本不再只是后端问题，它直接决定 Vite、webpack、测试工具和包管理器能否运行。',
    today: '在项目中声明 engines 并在 CI 固定 Node 主版本；升级前检查原生依赖、测试环境和部署镜像。',
    refs: ['node']
  },
  {
    date: '2021-10-26', slug: 'nextjs-12-swc', topic: 'Next.js',
    title: 'Next.js 12：SWC、Middleware 与边缘运行时方向',
    event: 'Next.js 12 使用 Rust 编写的 SWC 改善编译和压缩速度，并推出 Middleware、React 18 与 Server Components 的早期支持。',
    changes: ['SWC 替代部分 Babel 与 Terser 工作', 'Middleware 把请求处理逻辑放到路由渲染之前', '框架开始同时管理编译、数据、路由与部署运行时'],
    impact: '全栈 React 框架的边界扩大，构建速度和部署模型开始由框架深度优化。',
    today: '自定义 Babel 插件较多的项目迁移 SWC 时要做语义回归；Middleware 适合轻量路由判断，不适合塞入重业务。',
    refs: ['next']
  },
  {
    date: '2022-02-07', slug: 'vue-3-default', topic: 'Vue',
    title: 'Vue 3 成为默认版本：生态迁移进入主线',
    event: 'Vue 3 正式成为 npm 与文档的默认版本，create-vue、Pinia、Vite 和新的开发工具组成推荐技术栈。',
    changes: ['Vue 3 从可选升级转为新项目默认选择', 'Pinia 逐步替代 Vuex 成为官方推荐状态库', 'Vite 与 Volar 改善启动速度和 TypeScript 开发体验'],
    impact: '重大版本迁移最终取决于路由、状态、组件库和构建插件是否就绪，而不只是框架核心稳定。',
    today: 'Vue 2 项目应先列出生态阻塞项和浏览器要求，再决定渐进迁移、兼容构建或业务重写。',
    refs: ['vue3']
  },
  {
    date: '2022-03-29', slug: 'react-18-concurrent-rendering', topic: 'React',
    title: 'React 18：并发渲染、自动批处理与流式 SSR',
    event: 'React 18 正式发布，createRoot 启用新的并发渲染基础，并加入自动批处理、Transitions 与改进的 Suspense SSR。',
    changes: ['更多异步来源中的状态更新会被自动批处理', 'startTransition 区分紧急与非紧急更新', '流式 SSR 可以逐步发送 HTML 并选择性水合'],
    impact: '渲染不再保证一次同步走到底，依赖副作用时序或可变外部状态的代码更容易暴露问题。',
    today: '升级先切换 createRoot 并开启 StrictMode 回归；修复不纯渲染和缺少清理的 Effect，不要用关闭严格模式掩盖问题。',
    refs: ['react18']
  },
  {
    date: '2022-04-19', slug: 'node-18-fetch', topic: 'Node.js',
    title: 'Node.js 18：原生 Fetch 拉近浏览器与服务器 API',
    event: 'Node.js 18 提供实验性的全局 fetch，并随后成为 LTS。前后端共享基于 Request、Response、Headers 的网络代码变得更现实。',
    changes: ['常见 HTTP 请求不再必须依赖第三方客户端', 'Web Streams、FormData 等 Web API 在服务器侧逐步完善', '测试与 SSR 环境更容易复用浏览器标准接口'],
    impact: 'API 形状统一减少学习成本，但超时、重试、代理、证书和连接池仍然是服务器工程问题。',
    today: '封装 fetch 时用 AbortSignal 明确超时，并统一处理非 2xx 响应；不要把浏览器请求封装原样搬到服务端。',
    refs: ['node']
  },
  {
    date: '2022-10-25', slug: 'nextjs-13-app-router', topic: 'Next.js',
    title: 'Next.js 13：App Router 与 Server Components 落地',
    event: 'Next.js 13 推出 app 目录、嵌套布局、Server Components、Streaming 和 Turbopack alpha，开启新的 React 全栈应用模型。',
    changes: ['布局与页面默认运行在服务器组件环境', 'loading、error 等文件约定形成路由级状态边界', '服务端数据获取与 React 缓存模型深度结合'],
    impact: '组件放在哪里执行变成架构决策。错误的客户端边界会增加 JS，错误的缓存理解则会产生陈旧数据。',
    today: '从叶子交互组件开始添加 use client，尽量保持服务器组件树；升级时逐路由迁移，不必一次删除 Pages Router。',
    refs: ['next']
  },
  {
    date: '2022-12-09', slug: 'vite-4-ecosystem', topic: 'Vite',
    title: 'Vite 4：共享工具链生态进入稳定扩张期',
    event: 'Vite 4 升级 Rollup 3，并伴随 Vitest、VitePress 以及多个元框架形成更完整生态。',
    changes: ['统一插件接口让框架、测试和文档工具共享能力', '更快的大版本节奏配合清晰迁移指南', 'Node 支持周期开始直接影响 Vite 主版本'],
    impact: '开发服务器、测试、组件文档和框架构建逐渐共享一张模块图，减少重复配置，也放大插件兼容的重要性。',
    today: '把 Vite 配置保持在标准能力内，避免深度依赖内部 API；升级主版本时运行完整插件兼容测试。',
    refs: ['vite']
  },
  {
    date: '2023-05-04', slug: 'nextjs-app-router-stable', topic: 'Next.js',
    title: 'Next.js 13.4：App Router 稳定后的缓存与边界课题',
    event: 'Next.js 13.4 将 App Router 标记为稳定，Server Components、嵌套路由和 Server Actions alpha 进入更广泛生产实践。',
    changes: ['服务器组件成为 App Router 默认组件类型', '路由段支持独立加载、错误与重新验证策略', '数据缓存和路由缓存成为性能模型的一部分'],
    impact: '框架替开发者做了更多优化，也意味着团队必须理解请求记忆化、数据缓存与客户端路由缓存的差异。',
    today: '为动态数据显式选择缓存策略；所有 Server Action 都做鉴权与输入校验，并用端到端测试覆盖缓存失效。',
    refs: ['next']
  },
  {
    date: '2023-09-08', slug: 'bun-1-runtime-toolkit', topic: 'Bun',
    title: 'Bun 1.0：运行时、包管理器与构建工具走向一体化',
    event: 'Bun 1.0 发布，将 JavaScript 运行时、包管理、测试和打包能力放进一个工具，强调启动与安装性能。',
    changes: ['单一工具覆盖 install、run、test 与 bundle', '对 Node.js API 和 npm 包保持较高兼容目标', '原生实现推动传统工具重新关注性能'],
    impact: '工具链一体化减少组合成本，但兼容性、可观测性和生产验证仍决定能否替代成熟栈。',
    today: '可以先在 CI、脚本或非核心服务试用；生产迁移要覆盖原生模块、锁文件、网络代理和边缘行为。',
    refs: ['bun1']
  },
  {
    date: '2023-11-16', slug: 'vite-5-rollup-4', topic: 'Vite',
    title: 'Vite 5：Rollup 4 与现代 Node 基线',
    event: 'Vite 5 切换到 Rollup 4，要求 Node.js 18/20+，清理废弃 API，并继续改善开发服务器性能分析能力。',
    changes: ['生产构建获得 Rollup 4 的性能改进', 'CJS Node API 被弃用，推动配置与插件转向 ESM', 'server.warmup 可提前转换常用模块'],
    impact: '工具升级越来越与 Node 生命周期、模块系统和插件维护状态绑定，长期不升级的成本会集中爆发。',
    today: '先升级 Node 和配置文件模块格式，再升级 Vite；用 ecosystem CI 思路验证关键插件而不是只看 dev 能否启动。',
    refs: ['vite']
  },
  {
    date: '2024-09-03', slug: 'vue-3-5-reactivity', topic: 'Vue',
    title: 'Vue 3.5：响应式性能、解构与 SSR 细节继续成熟',
    event: 'Vue 3.5 发布，重构响应式系统，并改进 props 解构、SSR 水合和自定义元素能力。',
    changes: ['响应式核心降低内存占用并改善大型依赖图性能', '响应式 props 解构进入稳定使用路径', '延迟水合等 API 帮助控制 SSR 交互成本'],
    impact: '框架竞争从新增 API 转向编译、内存、SSR 与开发工具等系统性细节，升级价值更多体现在长期稳定性。',
    today: '升级后重点回归 computed、watch 与 SSR 水合；不要依赖未公开的响应式内部结构。',
    refs: ['vue35']
  },
  {
    date: '2024-10-21', slug: 'nextjs-15-caching', topic: 'Next.js',
    title: 'Next.js 15：缓存默认值调整与 Turbopack Dev 稳定',
    event: 'Next.js 15 发布，调整 fetch、GET Route Handler 和客户端路由缓存默认行为，并将 Turbopack 开发模式标记稳定。',
    changes: ['动态数据默认更不容易被意外缓存', '异步 Request API 为后续渲染模型做准备', 'React 19 支持与 Server Actions 安全改进同步进入'],
    impact: '缓存从隐式性能优化转向显式业务决策。升级如果只处理类型错误而不验证数据新鲜度，容易出现行为回归。',
    today: '为每条关键数据记录缓存需求，配合 revalidate 与标签失效；升级后重点测试登录态、列表刷新和后台更新。',
    refs: ['next']
  },
  {
    date: '2024-11-26', slug: 'vite-6-environment-api', topic: 'Vite',
    title: 'Vite 6：Environment API 面向多运行时框架',
    event: 'Vite 6 推出实验性 Environment API，让框架可以为客户端、SSR、边缘或其他运行时定义不同模块执行环境。',
    changes: ['同一开发服务器可以表达多个运行时环境', '框架作者能复用更接近生产的开发基础设施', 'Sass 等生态默认 API 继续现代化'],
    impact: 'Vite 从 SPA 构建工具继续下沉为全栈框架基础设施，环境边界成为插件设计的重要维度。',
    today: '普通 SPA 不必追逐实验 API；框架和插件作者应避免假设所有模块都运行在 Node 或浏览器。',
    refs: ['vite']
  },
  {
    date: '2024-12-05', slug: 'react-19-actions', topic: 'React',
    title: 'React 19：Actions、use 与表单异步状态',
    event: 'React 19 正式发布，围绕异步 Actions、表单状态、资源预加载和服务器组件集成完善 API。',
    changes: ['useActionState 与 useOptimistic 组织提交和乐观更新', 'use 可以读取 Promise 或 Context 并与 Suspense 协作', 'ref 作为 prop 与文档元数据等 DOM 能力得到简化'],
    impact: '异步数据变更从组件外部库的专属领域，更多进入 React 自身渲染和表单模型。',
    today: 'Actions 不是鉴权机制；服务器入口仍要校验权限和参数。升级先处理弃用项，再评估是否重写已有成熟表单。',
    refs: ['react19']
  },
  {
    date: '2025-02-14', slug: 'tailwind-4-and-cra-sunset', topic: '前端工具链',
    title: 'Tailwind CSS 4 与 CRA 退场：工具链继续现代化',
    event: 'Tailwind CSS 4 使用新的高性能引擎与 CSS-first 配置；React 团队随后停止推荐 Create React App，建议新项目采用框架或 Vite 等构建工具。',
    changes: ['现代 CSS 能力承担更多主题与配置职责', 'CRA 的封闭零配置模型不再适应当前框架和构建需求', '新项目脚手架从单一模板转向按产品架构选择'],
    impact: '“官方脚手架”不再是永远正确的默认值。前端项目需要主动选择渲染方式、路由、数据层和部署模型。',
    today: '已有 CRA 项目可以继续维护，但应规划迁移并先移除 react-scripts 隐式依赖；样式工具升级要做视觉回归。',
    refs: ['tailwind4', 'cra']
  },
  {
    date: '2025-06-24', slug: 'vite-7-baseline', topic: 'Vite',
    title: 'Vite 7：现代浏览器 Baseline 与 Node 20 基线',
    event: 'Vite 7 提高 Node.js 版本要求，并把默认浏览器目标与 Web Platform Baseline 对齐，减少对过旧环境的转换负担。',
    changes: ['默认构建目标更贴近现代浏览器共同能力', 'Node 20.19+/22.12+ 成为工具运行基线', 'Rolldown 集成继续为统一构建内核做准备'],
    impact: '浏览器兼容策略开始从手写版本列表转向能力基线，但企业设备和 WebView 仍需要真实数据验证。',
    today: '根据用户监控确定 targets，不要盲从默认值；CI 和开发机必须统一 Node 版本。',
    refs: ['vite']
  },
  {
    date: '2025-10-21', slug: 'react-compiler-next-16', topic: 'React',
    title: 'React Compiler 1.0 与 Next.js 16：自动优化进入框架主线',
    event: 'React Compiler 1.0 稳定发布；Next.js 16 随后提供稳定集成，并让 Turbopack 成为默认打包器。',
    changes: ['编译器基于 React 规则自动添加记忆化优化', 'Next.js Cache Components 重整部分预渲染与缓存模型', 'Turbopack 覆盖开发与生产构建主路径'],
    impact: '性能优化从手写 memo 逐步转为编译器可证明的变换，但前提是组件遵守纯函数和 Hooks 规则。',
    today: '先运行官方 lint 规则并修复不纯代码，再启用编译器；不要一边保留所有手写 memo，一边假设编译器会自动解决架构问题。',
    refs: ['compiler', 'next16']
  },
  {
    date: '2025-12-03', slug: 'vite-8-beta-rolldown', topic: 'Vite',
    title: 'Vite 8 Beta：Rolldown 开始统一开发与生产构建',
    event: 'Vite 8 Beta 完整集成 Rolldown，准备结束开发阶段使用 esbuild、生产阶段使用 Rollup 的双内核历史。',
    changes: ['Rust 编写的 Rolldown 统一主要打包路径', 'Rollup 兼容目标帮助现有插件渐进迁移', '大项目构建性能成为本轮架构升级核心'],
    impact: '统一内核可以减少开发与生产行为差异，但底层替换仍可能暴露依赖解析、插件钩子和输出顺序差异。',
    today: 'Beta 适合在 CI 影子构建中验证，不应未经回归直接替换生产链路；重点比较产物、动态导入和插件行为。',
    refs: ['vite8']
  },
  {
    date: '2026-02-24', slug: 'react-foundation', topic: 'React',
    title: 'React Foundation：核心项目进入更独立的治理阶段',
    event: 'React Foundation 在 Linux Foundation 下成立，React 的治理从单一公司主导迈向更独立的组织结构。',
    changes: ['项目治理与商标、活动等生态工作获得独立载体', '多家生态参与者可以在共同框架下投入资源', '技术路线与社区治理的透明度成为长期关注点'],
    impact: '成熟前端框架的风险不只有 API 变化，也包括维护资金、治理和生态协调。基金会化有助于降低单一组织风险。',
    today: '团队选型仍应关注发布质量和兼容策略，而不是只看组织形式；关键依赖要有升级窗口和替代预案。',
    refs: ['foundation']
  },
  {
    date: '2026-03-12', slug: 'vite-8-rolldown', topic: 'Vite',
    title: 'Vite 8：Rolldown 统一内核正式落地',
    event: 'Vite 8 正式发布，以 Rolldown 作为统一的 Rust 打包器。官方给出的生产构建提升可达一个数量级，同时尽量保持插件兼容。',
    changes: ['开发与生产共享更多解析和转换基础设施', '大型项目获得更明显的构建与重载收益', '浏览器控制台转发等能力改善调试闭环'],
    impact: '这是 Vite 2 之后最重要的底层变化，表明前端主流工具链已全面进入原生实现与统一内核阶段。',
    today: '升级必须保留前后产物对比和端到端测试；含复杂 Rollup 插件、SSR 或库模式的项目应分阶段验证。',
    refs: ['vite8']
  },
  {
    date: '2026-07-15', slug: 'typescript-6-node-26-vite-8-1', topic: '前端工程化',
    title: '工具链进入新阶段：TypeScript 6、Node 26 与 Vite 8.1',
    event: '截至 2026 年 7 月，TypeScript 6 作为通往原生 TypeScript 7 的过渡版本，Node 26 默认启用 Temporal，Vite 8.1 则继续探索大型项目的 bundled dev mode。',
    changes: ['TypeScript 6 更新默认值并弃用一批旧时代配置', 'Node 26 把更现代的日期时间与 Web 平台能力带入运行时', 'Vite 8.1 针对超大模块图实验打包式开发模式'],
    impact: '前端工程的主线已经从“增加更多转换层”转向“删除历史兼容负担、使用原生实现、统一开发与生产语义”。',
    today: '升级优先级应是安全与运行时支持，其次才是速度；建立 Node、TypeScript、构建器的兼容矩阵，并让 CI 同时验证旧版和目标新版。',
    refs: ['ts6', 'node26', 'vite81']
  }
]

const debugGuides = [
  {
    date: '2017-11-18', slug: 'event-loop-async-order', topic: 'JavaScript',
    title: '事件循环排障：为什么 Promise、setTimeout 的顺序和预期不同',
    symptoms: ['日志顺序与代码书写顺序不一致', '循环中发起异步任务后拿到相同索引或过期值', '长计算导致点击、动画和定时器一起卡住'],
    causes: ['同步任务先清空调用栈，微任务在当前任务结束后执行', '定时器只保证最早可执行时间，不保证准点执行', '闭包捕获可变变量，执行时读取到的是后续状态'],
    steps: ['把同步日志、queueMicrotask、Promise 和 setTimeout 做成最小复现', '在 Performance 面板查看长任务与 Main 线程空档', '给每个异步操作记录创建时间、开始时间和完成时间'],
    fixes: ['用 Promise.all 明确并发，用顺序 await 明确依赖关系', '把超过 50ms 的计算拆分或放入 Worker', '使用块级变量或显式参数固定异步任务上下文'],
    prevent: '代码评审时要求异步流程说明串行、并行、取消和错误策略；不要用增加 setTimeout 延迟来掩盖竞态。', refs: ['eventloop']
  },
  {
    date: '2018-07-20', slug: 'css-z-index-stacking-context', topic: 'CSS',
    title: 'z-index 失效排查：层叠上下文、定位与遮挡问题',
    symptoms: ['把 z-index 调到 99999，弹层仍被遮住', '子元素无法越过相邻卡片或 fixed 导航', '加上 transform、opacity 或 filter 后层级突然变化'],
    causes: ['z-index 只能在同一个层叠上下文内比较', 'transform、filter、opacity、isolation 等属性会创建新上下文', '父元素的 overflow 还可能直接裁剪子元素'],
    steps: ['从被遮挡元素向上检查每一层父元素的 computed style', '在 DevTools Layers 或 3D 视图确认上下文边界', '临时移除 transform 和 overflow 验证根因'],
    fixes: ['把弹层 Portal 到 body 或统一 overlay 容器', '建立有限的 z-index token，而不是不断加位数', '只在确有需要时创建新的层叠上下文'],
    prevent: '在设计系统中统一导航、抽屉、弹窗、Toast 的层级，并为组件文档增加嵌套容器测试。', refs: ['stacking']
  },
  {
    date: '2019-08-16', slug: 'react-hooks-stale-closure', topic: 'React',
    title: 'React Hooks 闭包陷阱：旧状态、无限循环与重复订阅',
    symptoms: ['定时器或事件监听器始终读到第一次渲染的状态', 'Effect 加入依赖后不断请求或循环更新', '开发环境中订阅、请求或日志看起来执行两次'],
    causes: ['每次渲染都会创建新的闭包，旧回调保留旧值', 'Effect 同时读取并更新不稳定依赖', 'StrictMode 会额外执行 setup/cleanup 来暴露不安全副作用'],
    steps: ['启用 eslint-plugin-react-hooks 并处理完整依赖提示', '记录每次渲染的依赖引用是否变化', '检查 Effect 是否真正用于同步外部系统'],
    fixes: ['状态更新依赖旧值时使用函数式更新', '事件回调需要最新值时重构数据流或使用适当的 Effect Event/ref', '返回 cleanup 取消订阅、定时器和过期请求'],
    prevent: '减少 Effect 数量，把派生数据留在渲染阶段；不要通过禁用 exhaustive-deps 维持偶然可用的代码。', refs: ['hooks']
  },
  {
    date: '2020-08-21', slug: 'vue-reactivity-lost', topic: 'Vue',
    title: 'Vue 响应式失效排查：解构、赋值与 watch 时机',
    symptoms: ['修改数据后模板不更新', '从 reactive 对象解构后变量失去响应', 'watch 没有触发或触发次数远多于预期'],
    causes: ['普通解构复制了当前值，不再经过响应式代理', '替换整个 reactive 引用会让消费者仍指向旧代理', '深度 watch 遍历范围过大，且新旧值可能指向同一对象'],
    steps: ['用 Vue Devtools 确认实际变化的是 ref、代理还是普通值', '把问题压缩到一个 computed 和一个 watch 验证依赖', '检查异步回调是否修改了已经失效的组件状态'],
    fixes: ['解构 reactive 时使用 toRefs，单值状态优先 ref', '用 computed 表达派生值，不要用 watch 复制状态', '为 watch 指定精确 getter，并在需要时清理异步副作用'],
    prevent: '团队统一 ref/reactive 选型约定，并避免在多个 store 中保存同一业务状态副本。', refs: ['vue3']
  },
  {
    date: '2021-09-17', slug: 'chunk-load-error-after-deploy', topic: '工程化',
    title: 'ChunkLoadError 排查：前端发布后懒加载资源 404',
    symptoms: ['发布后部分在线用户点击路由出现白屏', '控制台出现 ChunkLoadError 或动态 import 失败', '刷新页面后问题暂时消失'],
    causes: ['旧 HTML 或运行中的旧应用引用了已经被删除的 hash 文件', 'CDN 与 HTML 缓存策略不一致', '多节点发布期间 HTML 和静态资源来自不同版本'],
    steps: ['记录失败 chunk URL、页面版本号和 service worker 状态', '直接请求资源并检查 CDN、源站和缓存响应头', '对照发布清单确认旧 hash 是否仍在静态目录'],
    fixes: ['静态资源使用内容 hash 和长期缓存，HTML 使用短缓存或 no-cache', '保留至少一个回滚窗口的旧资源，不要发布即删除', '捕获动态导入失败并提示用户安全刷新'],
    prevent: '采用先上传资源、再切换 HTML 的发布顺序，并在监控中按版本聚合 chunk 加载失败率。', refs: ['webpack5']
  },
  {
    date: '2022-09-16', slug: 'cors-cookie-samesite', topic: 'Web 安全',
    title: '跨域 Cookie 排查：CORS、SameSite 与 credentials',
    symptoms: ['接口返回 Set-Cookie，但浏览器没有保存', 'Cookie 已存在，请求却没有携带', '本地代理正常，上线跨域环境失败'],
    causes: ['客户端没有设置 credentials，或服务端没有允许凭据', 'Access-Control-Allow-Origin 使用了通配符', 'SameSite、Secure、Domain 或 Path 与实际场景不匹配'],
    steps: ['在 Network 面板检查预检、实际请求和被阻止 Cookie 原因', '确认前端 Origin 与服务端允许来源完全一致', '分别验证存储阶段和发送阶段，不把两类问题混在一起'],
    fixes: ['fetch 使用 credentials: include，服务端返回明确 Origin 与 Allow-Credentials', '跨站 Cookie 使用 SameSite=None; Secure，并确保 HTTPS', '优先通过同站反向代理降低跨站身份复杂度'],
    prevent: '建立本地、测试、生产三套真实域名回归；不要通过关闭浏览器安全策略解决业务配置问题。', refs: ['cors']
  },
  {
    date: '2023-08-18', slug: 'esm-cjs-module-errors', topic: 'Node.js',
    title: 'ESM/CJS 混用排查：ERR_REQUIRE_ESM 与默认导入错误',
    symptoms: ['运行时报 ERR_REQUIRE_ESM 或 require is not defined', '开发环境正常，测试或构建阶段导入失败', '默认导入得到 undefined 或多包了一层 default'],
    causes: ['package.json type、文件扩展名与编译输出模块格式不一致', '依赖只发布 ESM，而调用方仍使用 require', 'TypeScript、测试器和运行时采用不同 moduleResolution'],
    steps: ['从报错入口逐层确认每个包的 type、exports 和实际文件扩展名', '查看构建后的代码，不只检查 TypeScript 源码', '用 node 直接执行最小导入，排除框架包装影响'],
    fixes: ['新项目统一使用 ESM，并让 tsconfig 与运行时保持一致', 'CommonJS 中加载 ESM 使用动态 import，避免私自深层导入', '库包通过 exports 明确提供的入口，不依赖隐式目录解析'],
    prevent: '在 CI 同时测试发布产物与类型声明；升级纯 ESM 依赖前检查所有脚本、测试与配置文件。', refs: ['esm']
  },
  {
    date: '2024-08-16', slug: 'ssr-hydration-mismatch', topic: 'SSR',
    title: 'Hydration mismatch 排查：服务端 HTML 为什么和客户端不同',
    symptoms: ['页面首次加载闪烁并出现水合不匹配警告', '只有刷新或生产环境出现，客户端跳转正常', '事件绑定错位，部分 DOM 被客户端重新创建'],
    causes: ['渲染阶段读取 Date、Math.random、window 或本地存储', '服务端和客户端使用不同语言、时区或数据快照', '无效 HTML 嵌套被浏览器解析器自动纠正'],
    steps: ['保存服务端原始 HTML，并与水合前后的 DOM 对比', '固定时间、随机数、语言和请求数据复现', '逐层缩小客户端组件边界，定位第一个不同节点'],
    fixes: ['首屏使用服务器提供的稳定快照，浏览器专属值放到 Effect 后更新', '用合法 HTML 与确定性 key，统一时区和国际化配置', '必须跳过水合的第三方组件采用明确的客户端加载边界'],
    prevent: 'SSR 组件执行确定性测试，并在 CI 用真实浏览器检查控制台 hydration 警告。', refs: ['hydration']
  },
  {
    date: '2025-08-15', slug: 'typescript-never-inference', topic: 'TypeScript',
    title: 'TypeScript never 排查：类型为什么被收窄到不可能',
    symptoms: ['属性访问报 Property does not exist on type never', '空数组推导为 never[]，后续无法 push', '穷尽分支中的变量类型突然变成 never'],
    causes: ['初始化信息不足导致泛型或数组元素无法推导', '控制流分析认为某个分支永远不可达', '联合类型与自定义类型守卫不完整或条件互斥'],
    steps: ['把复杂表达式拆成中间变量查看每一步推导类型', '检查泛型参数、空数组和 useState 的初始类型', '用 assertNever 确认是真正穷尽还是上游类型写错'],
    fixes: ['为无信息初始值显式声明元素或泛型类型', '修正类型守卫，使返回条件与声明谓词一致', '使用可辨识联合表达状态，避免多个布尔值形成非法组合'],
    prevent: '保持 strict 模式，不用 any 压制错误；把 never 当作上游模型问题的信号，而不是需要强制断言的障碍。', refs: ['ts59']
  },
  {
    date: '2026-04-17', slug: 'frontend-memory-leak', topic: '性能优化',
    title: '前端内存泄漏排查：监听器、闭包与未释放组件',
    symptoms: ['页面使用时间越长越卡，刷新后恢复', '反复进入同一路由后内存持续上升', '已经离开的组件仍出现在 Heap Snapshot 的保留链中'],
    causes: ['全局事件监听、定时器或观察器没有在卸载时清理', '缓存和闭包长期持有大型 DOM、响应数据或组件实例', '未取消的异步任务完成后继续写入失效状态'],
    steps: ['使用 Performance Monitor 观察 JS Heap 与 DOM 节点趋势', '执行进入/离开页面动作后拍摄多次 Heap Snapshot 并比较', '沿 Retainers 找到把对象保留在 GC Root 下的引用'],
    fixes: ['统一清理监听器、定时器、Observer 与第三方实例', '用 AbortController 取消请求，限制缓存容量和生命周期', '避免把 DOM 或完整响应对象存进全局单例'],
    prevent: '为复杂页面增加循环挂载压力测试和内存基线；代码评审时让每个 subscribe/addEventListener 都对应 unsubscribe/remove。', refs: ['memory']
  }
]

function yaml(value) {
  return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}

function references(keys) {
  return keys.map((key) => {
    const [label, url] = sources[key]
    return `- [${label}](${url})`
  }).join('\n')
}

const articleHeadings = {
  'jquery-and-the-dom-era': ['为什么 2017 年的页面离不开 jQuery', '事件委托到底方便在哪里', '链式调用背后的工程边界', '从操作 DOM 到描述界面', '老项目迁移不必推倒重来', '当年的 jQuery 发布记录'],
  'es2017-async-await': ['Promise 链写久了，问题出在哪', '把串行等待改成真正并发', 'async/await 没有消灭异步', '错误处理终于回到 try/catch', '今天写异步流程的几个习惯', 'ES2017 规范入口'],
  'react-16-fiber': ['React 为什么要重写协调器', '用错误边界兜住局部崩溃', 'Fiber 不等于一个新 API', '可中断渲染从这里埋下伏笔', '升级 React 16 时应该检查什么', 'React 16 官方说明'],
  'webpack-4-zero-config': ['配置文件为什么越写越长', '从 mode 开始精简配置', 'Tree Shaking 与默认优化', '构建工具开始提供合理默认值', '老项目升级 webpack 4 的顺序', 'webpack 的版本记录'],
  'babel-7-modern-transpilation': ['Babel 到底在转换什么', '按目标浏览器决定转译范围', '语法转换和 Polyfill 是两件事', 'TypeScript 进入 Babel 工具链', '避免把所有代码都编译成 ES5', 'Babel 7 发布说明'],
  'react-hooks': ['类组件的逻辑为什么难复用', '把订阅封装成一个 Hook', '依赖数组不是性能开关', '函数组件开始承载完整状态', '少写 Effect 比多写技巧更重要', 'Hooks 的首个稳定版本'],
  'svelte-3-compiler-reactivity': ['不使用虚拟 DOM 会怎样', '响应式赋值写起来是什么感觉', '编译器替运行时做了哪些工作', 'Svelte 带来的另一条框架路线', '别只拿包体积决定技术选型', 'Svelte 3 的设计说明'],
  'typescript-3-7': ['层层判空曾经有多麻烦', '可选链与空值合并的正确用法', '0 和空字符串不应该被误判', '类型收窄开始贴近真实代码', '别用可选链掩盖错误数据', 'TypeScript 3.7 发布说明'],
  'deno-1-secure-runtime': ['为什么还要再做一个 JS 运行时', '权限必须写进启动命令', '内置工具减少了多少选择', 'Deno 对 Node 生态提出的问题', '什么项目适合先试 Deno', 'Deno 1.0 发布记录'],
  'vite-native-esm-origin': ['打包器为什么拖慢开发启动', '浏览器原生 ESM 能做什么', '依赖预构建和源码转换要分开', 'Vite 最初解决的就是等待', '快并不代表可以忽略模块治理', 'Vite 的早期思路'],
  'vue-3-composition-api': ['Vue 2 大组件为什么越来越难拆', '把同一业务逻辑放回一起', 'Proxy 补上了哪些响应式缺口', 'Composition API 不是换一种写法', '迁移前先盘点组件库和插件', 'Vue 3.0 发布公告'],
  'webpack-5': ['webpack 5 为什么等了这么久', '远程模块如何暴露给其他应用', '持久化缓存与稳定 Hash', '微前端开始面对分布式问题', 'Module Federation 不适合所有团队', 'webpack 5 发布记录'],
  'react-server-components-research': ['组件为什么要回到服务器', '服务器组件可以直接读取什么', '客户端边界决定发送多少 JS', '数据获取重新进入组件模型', '不要自己拼装 RSC 基础设施', '最初的 Server Components 介绍'],
  'vite-2': ['Vite 如何从 Vue 工具变成通用平台', '框架能力为什么放进插件', 'esbuild 负责了哪一段工作', 'Rollup 生态如何被复用', 'webpack 项目迁移前先找专用 Loader', 'Vite 2.0 发布说明'],
  'node-16-esm': ['前端工具为什么关心 Node 版本', '先把 ESM 包边界声明清楚', 'type 与 exports 如何一起工作', '双模块生态带来的兼容成本', '在 CI 固定运行时版本', 'Node.js 历史版本'],
  'nextjs-12-swc': ['Next.js 为什么换掉一部分 Babel', 'Middleware 应该保持多轻', 'SWC 带来的不只是速度', '框架开始接管更多工具链', '自定义 Babel 插件怎么迁移', 'Next.js 12 发布记录'],
  'vue-3-default': ['Vue 3 何时真正成为主线', 'script setup 的日常写法', 'Pinia、Vite 与 Volar 拼齐生态', '框架升级取决于周边是否就绪', 'Vue 2 项目先列阻塞清单', 'Vue 3 默认版本说明'],
  'react-18-concurrent-rendering': ['并发渲染到底并发在哪里', '用 transition 区分更新优先级', '自动批处理改变了哪些时序', 'StrictMode 为什么更容易暴露问题', '先修不纯渲染再谈性能', 'React 18 发布说明'],
  'node-18-fetch': ['服务端为什么也需要标准 Fetch', '给请求补上超时与状态检查', 'Web API 统一后仍有服务端问题', '连接池、代理和重试没有消失', '封装 Fetch 时应该统一什么', 'Node.js 18 版本记录'],
  'nextjs-13-app-router': ['App Router 改变了什么边界', '页面默认留在服务器', 'loading 与 error 进入路由约定', '缓存开始影响业务正确性', '从叶子组件开始添加 use client', 'Next.js 13 发布记录'],
  'vite-4-ecosystem': ['Vite 为什么不再只是一台开发服务器', '让测试与构建共享模块解析', 'Vitest、VitePress 与元框架汇合', 'Node 生命周期开始影响主版本', '插件兼容比配置技巧更重要', 'Vite 4 的发布记录'],
  'nextjs-app-router-stable': ['App Router 稳定意味着什么', '写入之后如何让缓存失效', '三类缓存不要混在一起', 'Server Action 也是公开入口', '逐路由迁移比整体重写可靠', 'Next.js 13.4 发布记录'],
  'bun-1-runtime-toolkit': ['一个工具包办所有事情可行吗', '直接用 Bun 跑一条测试', '安装、测试与构建合并后的体验', '快之外还要验证兼容性', '先从非核心脚本开始试用', 'Bun 1.0 发布说明'],
  'vite-5-rollup-4': ['Vite 5 为什么提高 Node 基线', '把配置文件迁移到 ESM', 'Rollup 4 带来的构建变化', '旧插件会在哪些地方出问题', '升级顺序应该从运行时开始', 'Vite 5 发布说明'],
  'vue-3-5-reactivity': ['响应式核心还能怎样优化', 'Props 解构为什么仍能响应', '内存与依赖图的改进', 'SSR 水合开始变得更细', '升级后重点回归 watch 与 computed', 'Vue 3.5 发布公告'],
  'nextjs-15-caching': ['缓存默认值为什么再次调整', '把动态策略写在路由旁边', '异步 Request API 在准备什么', '数据新鲜度比类型通过更重要', '升级后重点测试哪些页面', 'Next.js 15 发布说明'],
  'vite-6-environment-api': ['一个模块可能运行在哪些环境', '在配置里区分 Client 与 SSR', '插件不能再假设只有浏览器', 'Environment API 服务的是谁', '普通 SPA 不必追实验接口', 'Vite 6 发布说明'],
  'react-19-actions': ['React 为什么开始关心表单提交', 'Action 如何管理 pending 状态', 'use 读取 Promise 意味着什么', '乐观更新进入内置模型', '服务器 Action 仍然需要鉴权', 'React 19 发布说明'],
  'tailwind-4-and-cra-sunset': ['两个旧默认为什么同时变化', '把 Tailwind 主题写回 CSS', 'CRA 退场后脚手架怎么选', '现代 CSS 承担了更多职责', '老 CRA 项目不必连夜重写', 'Tailwind 与 React 官方记录'],
  'vite-7-baseline': ['浏览器兼容为什么改看 Baseline', '显式写出项目的构建目标', 'Node 20 成为新的工具基线', '旧 WebView 仍要看真实数据', '升级前先统一开发机与 CI', 'Vite 7 发布记录'],
  'react-compiler-next-16': ['手写 memo 会慢慢消失吗', '在 Next.js 中开启编译器', '自动优化依赖哪些代码规则', 'Turbopack 成为默认意味着什么', '先修不纯组件再打开编译器', 'React Compiler 与 Next.js 16'],
  'vite-8-beta-rolldown': ['为什么 Vite 想统一两套内核', '用影子构建验证 Beta', 'Rolldown 要兼容哪些插件能力', '开发与生产差异能否变小', 'Beta 不应该直接替换生产链路', 'Vite 8 Beta 记录'],
  'react-foundation': ['React 为什么需要独立基金会', '先盘点项目里的 React 版本', '治理变化不会直接改一行 API', '单一组织风险如何被降低', '技术选型仍要看发布质量', 'React Foundation 公告'],
  'vite-8-rolldown': ['Vite 8 最重要的变化是什么', '留下升级前后的构建日志', 'Rolldown 如何统一构建路径', '大项目为什么收益更明显', '复杂插件项目要分阶段验证', 'Vite 8 正式版说明'],
  'typescript-6-node-26-vite-8-1': ['2026 年工具链在删除哪些历史包袱', '用现代 tsconfig 接住升级', 'Temporal 与原生工具开始落地', '统一内核成为新的关键词', '先做兼容矩阵再追求速度', '2026 年官方发布记录'],
  'event-loop-async-order': ['先确认你看到的是哪一种乱序', '四行代码看清微任务与定时器', '定时器为什么从来不保证准点', '沿着调用栈和任务队列排查', '别用更多 setTimeout 掩盖竞态', '事件循环参考资料'],
  'css-z-index-stacking-context': ['z-index 写到 99999 为什么仍没用', '用一个父级 transform 复现问题', '哪些属性会创建层叠上下文', '从被遮挡元素一路向上检查', '弹层应该放进统一 Overlay 容器', '层叠上下文参考资料'],
  'react-hooks-stale-closure': ['为什么定时器总读到旧状态', '函数式更新避开过期闭包', '依赖数组加完为什么死循环', '检查 Effect 是否真的有必要', '订阅、请求与定时器都要清理', 'Hooks 相关资料'],
  'vue-reactivity-lost': ['数据明明改了，模板为什么不动', '解构时保留 ref', '替换 reactive 引用会发生什么', '用 Devtools 找到失去代理的位置', '派生值优先交给 computed', 'Vue 响应式资料'],
  'chunk-load-error-after-deploy': ['为什么发布后只有老用户白屏', '给动态导入留一条恢复路径', '旧 HTML 指向了已经删除的 Chunk', '检查 CDN、源站与版本号', '静态资源至少保留一个回滚窗口', 'webpack 与缓存资料'],
  'cors-cookie-samesite': ['Set-Cookie 返回了为什么没有保存', '前后端两侧都要允许凭据', '先区分保存失败还是发送失败', '逐项检查 SameSite、Secure 与 Domain', '用真实域名覆盖三套环境', 'CORS 参考资料'],
  'esm-cjs-module-errors': ['ERR_REQUIRE_ESM 到底是谁抛的', '把动态 import 收敛到模块边界', 'type、exports 与扩展名如何配合', '一定要检查编译后的文件', '发布包同时测试运行时与类型声明', 'Node.js ESM 资料'],
  'ssr-hydration-mismatch': ['服务端和客户端究竟哪里不同', '把浏览器信息放到水合之后', '时间、随机数和时区都是高风险项', '保存原始 HTML 再对比 DOM', 'SSR 组件需要确定性测试', 'React 水合资料'],
  'typescript-never-inference': ['变量为什么突然变成 never', '给空数组补上元素类型', '控制流认为哪个分支不可达', '拆开表达式观察每一步推导', '别用 any 把上游模型问题盖住', 'TypeScript 参考资料'],
  'frontend-memory-leak': ['页面越用越卡时先看什么', '给监听器与请求补上清理函数', '谁还在持有已经卸载的组件', '用 Heap Snapshot 沿 Retainer 追踪', '把循环挂载加入压力测试', 'Chrome 内存排查资料']
}

function headingsFor(post) {
  return articleHeadings[post.slug] || [
    post.topic + ' 当时解决的问题',
    post.topic + ' 的最小示例',
    '实现细节与边界',
    '这次变化带来的影响',
    '项目中的落地方式',
    '相关资料'
  ]
}

const extraSections = {
  'jquery-and-the-dom-era': [
    ['一个更现实的迁移切口', '假设后台里有一张依赖 jQuery 插件的复杂表格，最稳妥的做法通常不是先换框架，而是先把请求、数据转换和 DOM 更新分开。接口层先改成普通函数，事件入口集中到一个模块，最后再替换视图。这样每一步都能单独回归，出了问题也知道该退回哪一层。'],
    ['插件最难替换的不是语法', '日期选择器、树形控件和上传组件往往把状态挂在 DOM、全局变量或 data 属性上。真正的迁移工作是找清楚初始化、更新和销毁三个生命周期。如果只把选择器改成 querySelector，隐藏的状态和监听器仍会留在页面里。']
  ],
  'react-hooks': [
    ['Effect 最容易被误用的地方', '很多组件把“根据 props 计算一个值”也写进 Effect，再调用 setState 保存结果。这样会多一次渲染，还会制造依赖数组问题。只要结果能由当前 props 和 state 算出，就应该直接在渲染阶段计算；Effect 更适合连接网络、订阅、DOM 或第三方实例。'],
    ['自定义 Hook 的边界怎么划', '一个 Hook 最好表达完整能力，例如 useOnlineStatus、useDocumentTitle，而不是机械地按生命周期拆成 useMount、useUpdate。调用者应该关心它提供什么结果，不需要知道内部用了几个 Effect。']
  ],
  'vue-3-composition-api': [
    ['ref 和 reactive 不必二选一', '单个值、可能整体替换的对象，使用 ref 往往更直观；一组始终一起修改的字段可以放进 reactive。真正需要避免的是为了少写 value 而随意混用，最后在解构、传参和 watch 时失去响应关系。团队形成固定约定，比争论哪一个更高级有用。'],
    ['Composable 也会变成新的大组件', '把 Options API 搬进一个超大的 usePage 并没有改善结构。可复用逻辑应围绕业务动作拆分，并清楚暴露只读状态和修改入口。网络请求还要处理取消、竞态和组件卸载，不能只返回 data 与 loading。']
  ],
  'webpack-5': [
    ['远程模块失败时页面怎么办', 'Module Federation 把编译期依赖变成运行时网络依赖。远程入口超时、版本尚未同步或 CDN 缓存异常时，宿主应用必须有降级界面。共享 React 等单例依赖还要防止版本不兼容，否则问题会从构建失败变成线上运行时错误。'],
    ['缓存优化要看发布结果', '确定性 ID 和 contenthash 只有在非相关模块改动后保持稳定，才真正减少用户下载。升级后可以连续构建两次，只修改一个业务模块，再比较 dist 中其他文件的 hash；这比只看配置项是否开启更可靠。']
  ],
  'react-18-concurrent-rendering': [
    ['StrictMode 的重复执行不是线上重复渲染', '开发环境额外执行 setup 与 cleanup，是为了暴露没有清理的订阅和不纯逻辑。看到两次请求时，应该先让请求可取消或移动到数据层，而不是直接关闭 StrictMode。被重复执行就出错的 Effect，通常本来就缺少幂等性。'],
    ['Transition 不是通用防抖', 'startTransition 只是在 React 调度里降低更新优先级，并不会减少请求次数。搜索输入仍然需要取消过期请求，昂贵计算仍可能需要 Worker。它解决的是渲染响应性，不是所有异步性能问题。']
  ],
  'nextjs-13-app-router': [
    ['use client 应该放得多低', '一旦文件声明 use client，它导入的客户端依赖会一起进入浏览器边界。实际项目里可以让页面、布局和数据读取保持服务器组件，只把按钮、弹窗、表单等交互叶子标成客户端。这样既保留组合能力，也不会把整个页面重新变成 SPA。'],
    ['缓存错误往往不像报错', '缓存配置不正确时页面仍能正常渲染，只是用户看到旧数据，所以它比编译错误更危险。列表新增、登录状态和后台修改需要端到端测试，验证写入后哪个路径或标签被失效，而不是仅确认 Server Action 返回成功。']
  ],
  'react-19-actions': [
    ['乐观更新失败后必须能回滚', 'useOptimistic 让界面先显示预期结果，但服务端仍可能因为权限、库存或校验失败而拒绝操作。乐观状态需要和真实响应关联，失败时恢复原值并告诉用户发生了什么。只追求“立即变化”而没有失败路径，会让界面与数据永久不一致。'],
    ['服务器函数不是私有函数', '带有服务器指令的 Action 最终可以被客户端触发，应当像 API 路由一样做身份校验、参数解析、速率限制和审计。不要因为函数和组件写在同一个仓库里，就信任来自表单的 ID、价格或角色字段。']
  ],
  'vite-8-rolldown': [
    ['先比较产物，再比较秒数', '构建时间下降很吸引人，但升级首先要保证动态导入、CSS 顺序、资源路径和库模式输出没有变化。可以把旧版与新版产物分别保存，在同一套端到端测试中运行，再记录冷启动和构建耗时。性能数字应该排在正确性之后。'],
    ['插件兼容要覆盖真实钩子', '只启动开发服务器不能证明插件兼容。使用 transform、generateBundle、虚拟模块或 SSR 钩子的插件，应同时跑开发、生产构建和服务端渲染。内部 API 用得越多，越适合拆成单独升级批次。']
  ],
  'chunk-load-error-after-deploy': [
    ['为什么刷新以后往往就好了', '用户打开页面时已经下载了旧版入口，发布后服务器只保留新版 Chunk。正在运行的旧页面继续请求旧 hash，自然得到 404；刷新会拿到新版 HTML，所以看起来像“偶发问题”。这不是用户缓存太顽固，而是发布过程没有兼容仍在线的旧客户端。'],
    ['一次更安全的发布顺序', '先上传带内容 hash 的静态资源，确认 CDN 可访问后再切换 HTML；旧资源至少保留一个回滚窗口。监控中记录应用版本和失败 URL，才能判断是单个 CDN 节点、某次发布还是 Service Worker 引起。']
  ],
  'cors-cookie-samesite': [
    ['Cookie 有保存和发送两道门', 'Network 面板看到 Set-Cookie 只说明响应尝试写入。浏览器还会检查 Domain、Path、Secure 和 SameSite；保存成功以后，下次请求又会根据站点关系和 credentials 决定是否发送。排查时把这两个阶段分开，速度会快很多。'],
    ['本地代理为什么会掩盖问题', '开发服务器代理让浏览器看到的是同源请求，因此生产环境的跨站限制没有被触发。测试环境最好使用接近线上的 HTTPS 域名和子域结构，并同时检查预检响应与实际响应。']
  ],
  'ssr-hydration-mismatch': [
    ['页面其实经历了三份状态', '排查水合问题时要区分服务器返回的 HTML、浏览器解析后的 DOM，以及 React 水合后的树。无效标签嵌套会在第二步被浏览器自动修正，即使服务端字符串看起来一致，真正参与水合的结构也可能已经不同。'],
    ['不要把警告简单压掉', 'suppressHydrationWarning 只适合已知且局部的差异，例如不可避免的时间文本。它不会修复事件错位，也不应包住整块页面。更可靠的方案是给首屏提供确定数据，再在 Effect 中更新浏览器专属信息。']
  ],
  'frontend-memory-leak': [
    ['一次快照不够判断泄漏', '内存升高可能只是垃圾回收尚未发生。更有效的方法是执行固定操作：进入页面、退出页面、手动触发 GC，再重复多轮并比较快照。只有同类对象数量持续增长，而且能沿 Retainer 找到稳定引用链，才更接近真正泄漏。'],
    ['缓存也需要生命周期', 'Map、查询缓存和图片预览常被当成性能优化，却可能无限持有数据。缓存应有容量、过期时间或按路由释放策略。对大对象来说，少一次请求带来的收益可能抵不过长时间占用内存的成本。']
  ]
}

function renderExtraSections(post) {
  return (extraSections[post.slug] || [])
    .map(([title, body]) => markdownSection(title, body))
    .join('\n\n')
}

function codeExample(post) {
  const bySlug = {
    'jquery-and-the-dom-era': ['js', '老项目里很常见的事件委托：', ["$('.js-menu').on('click', '.js-item', function () {", "  $(this).toggleClass('is-active')", '})']],
    'es2017-async-await': ['js', '没有依赖关系的请求应该并发：', ['const [profile, permissions] = await Promise.all([', '  fetchProfile(userId),', '  fetchPermissions(userId)', '])']],
    'react-16-fiber': ['jsx', 'React 16 开始可以用错误边界隔离局部渲染失败：', ['class ErrorBoundary extends React.Component {', '  state = { failed: false }', '  static getDerivedStateFromError() { return { failed: true } }', '  render() { return this.state.failed ? <Fallback /> : this.props.children }', '}']],
    'react-hooks': ['jsx', '自定义 Hook 把订阅和清理放在同一个地方：', ['function useOnlineStatus() {', '  const [online, setOnline] = useState(navigator.onLine)', '  useEffect(() => {', "    const update = () => setOnline(navigator.onLine)", "    window.addEventListener('online', update)", "    return () => window.removeEventListener('online', update)", '  }, [])', '  return online', '}']],
    'svelte-3-compiler-reactivity': ['svelte', 'Svelte 3 的响应式关系可以直接写出来：', ['<script>', '  let price = 99', '  let count = 1', '  $: total = price * count', '</script>', '<strong>{total}</strong>']],
    'typescript-3-7': ['ts', '可选链和空值合并不会误伤合法的零值：', ['const retryCount = config.network?.retryCount ?? 3', "const name = user.profile?.nickname ?? '匿名用户'"]],
    'deno-1-secure-runtime': ['bash', 'Deno 脚本把所需权限写在启动命令里：', ['deno run --allow-net=api.example.com --allow-read=./config app.ts']],
    'webpack-5': ['js', 'Module Federation 需要明确远程边界与共享依赖：', ['new ModuleFederationPlugin({', "  name: 'checkout',", "  exposes: { './Cart': './src/Cart' },", "  shared: { react: { singleton: true } }", '})']],
    'react-18-concurrent-rendering': ['jsx', '不紧急的列表更新可以放进 transition：', ['const [isPending, startTransition] = useTransition()', 'function handleChange(value) {', '  setInput(value)', '  startTransition(() => setKeyword(value))', '}']],
    'node-18-fetch': ['js', '服务端 fetch 也要处理超时与非 2xx：', ['const response = await fetch(url, { signal: AbortSignal.timeout(5000) })', "if (!response.ok) throw new Error('HTTP ' + response.status)"]],
    'nextjs-13-app-router': ['tsx', '页面留在服务器，把真正需要交互的叶子放到客户端：', ['export default async function Page() {', '  const products = await getProducts()', '  return <ProductList products={products} />', '}']],
    'react-19-actions': ['jsx', 'Action 可以承接提交和 pending 状态：', ['const [error, action, pending] = useActionState(renameUser, null)', 'return <form action={action}>', '  <input name="name" />', '  <button disabled={pending}>保存</button>', '</form>']],
    'tailwind-4-and-cra-sunset': ['css', 'Tailwind CSS 4 把主题配置带回 CSS：', ['@import "tailwindcss";', '@theme {', '  --color-brand-500: oklch(0.62 0.19 255);', '}']],
    'typescript-6-node-26-vite-8-1': ['json', '现代工具链最好用显式配置接住升级：', ['{', '  "compilerOptions": {', '    "strict": true,', '    "module": "esnext",', '    "moduleResolution": "bundler",', '    "types": ["node"]', '  }', '}']],
    'event-loop-async-order': ['js', '先运行最小例子，再判断微任务和定时器顺序：', ["console.log('A')", "queueMicrotask(() => console.log('microtask'))", "setTimeout(() => console.log('timer'), 0)", "console.log('B')"]],
    'css-z-index-stacking-context': ['css', '问题经常藏在创建层叠上下文的父元素：', ['.card { transform: translateZ(0); }', '.overlay-root {', '  position: fixed;', '  inset: 0;', '  z-index: var(--z-modal);', '}']],
    'react-hooks-stale-closure': ['jsx', '依赖旧状态的更新改成函数式写法：', ['useEffect(() => {', '  const timer = setInterval(() => setCount(value => value + 1), 1000)', '  return () => clearInterval(timer)', '}, [])']],
    'vue-reactivity-lost': ['ts', '解构 reactive 对象时保留 ref：', ["const state = reactive({ keyword: '', page: 1 })", 'const { keyword, page } = toRefs(state)']],
    'chunk-load-error-after-deploy': ['js', '动态导入失败时提供可控恢复路径：', ['try {', "  return await import('./pages/Report.js')", '} catch (error) {', "  if (error.name === 'ChunkLoadError') location.reload()", '  throw error', '}']],
    'cors-cookie-samesite': ['js', '前后端两侧都要允许凭据：', ["await fetch('https://api.example.com/profile', { credentials: 'include' })", "res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com')", "res.setHeader('Access-Control-Allow-Credentials', 'true')"]],
    'esm-cjs-module-errors': ['js', 'CommonJS 加载纯 ESM 包时收敛动态导入边界：', ['async function loadPackage() {', "  const { default: api } = await import('esm-only-package')", '  return api', '}']],
    'ssr-hydration-mismatch': ['jsx', '首屏使用确定值，浏览器信息在水合后更新：', ["const [timezone, setTimezone] = useState('UTC')", 'useEffect(() => {', '  setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)', '}, [])']],
    'typescript-never-inference': ['ts', '空容器缺少推导信息时直接声明元素类型：', ['type Task = { id: string; done: boolean }', 'const tasks: Task[] = []', "tasks.push({ id: 'build', done: false })"]],
    'frontend-memory-leak': ['js', '监听器和请求都要有对称的释放路径：', ['const controller = new AbortController()', "window.addEventListener('resize', handleResize)", 'fetch(url, { signal: controller.signal })', 'return () => {', '  controller.abort()', "  window.removeEventListener('resize', handleResize)", '}']]
  }

  if (bySlug[post.slug]) return bySlug[post.slug]
  if (post.topic === 'Vite') return ['js', '先用一份小配置验证升级前后的行为：', ["import { defineConfig } from 'vite'", 'export default defineConfig({', "  build: { target: 'es2020' }", '})']]
  if (post.topic === 'Vue') return ['vue', '把状态、派生值和副作用的边界写清楚：', ['<script setup>', "import { computed, ref } from 'vue'", 'const count = ref(0)', 'const doubled = computed(() => count.value * 2)', '</script>']]
  if (post.topic === 'React') return ['jsx', '组件保持纯净，副作用只负责同步外部系统：', ['function Counter() {', '  const [count, setCount] = useState(0)', '  return <button onClick={() => setCount(value => value + 1)}>{count}</button>', '}']]
  if (post.topic === 'Next.js') return ['ts', '缓存策略与数据写入放在同一个业务边界里：', ["'use server'", "import { revalidatePath } from 'next/cache'", 'await save(data)', "revalidatePath('/posts')"]]
  if (post.topic === 'Node.js') return ['js', '运行时升级前先验证实际支持的 API：', ["console.log(process.version)", "console.log(typeof fetch, typeof AbortSignal.timeout)"]]
  if (post.topic === 'webpack') return ['js', '构建配置先保持可测量，再逐项加入优化：', ['module.exports = {', "  mode: 'production',", "  entry: './src/index.js'", '}']]
  return ['js', '先把问题缩小到一个能独立运行的例子：', ['function reproduce(input) {', '  console.log({ input })', '  return input', '}']]
}

function renderExample(post) {
  const [language, caption, lines] = codeExample(post)
  const heading = headingsFor(post)[1]
  const fence = String.fromCharCode(96).repeat(3)
  return ['## ' + heading, '', caption, '', fence + language, ...lines, fence].join('\n')
}

const palettes = [
  ['#0f172a', '#2563eb', '#22d3ee'],
  ['#18181b', '#7c3aed', '#f472b6'],
  ['#052e16', '#059669', '#a3e635'],
  ['#451a03', '#ea580c', '#facc15'],
  ['#172554', '#4f46e5', '#c084fc'],
  ['#082f49', '#0284c7', '#67e8f9'],
  ['#3f0d2a', '#db2777', '#fb7185'],
  ['#1c1917', '#78716c', '#f59e0b'],
  ['#052e2b', '#0d9488', '#5eead4'],
  ['#312e81', '#6366f1', '#38bdf8'],
  ['#3b0764', '#9333ea', '#e879f9'],
  ['#111827', '#dc2626', '#fb923c']
]

function hashCode(value) {
  let hash = 0
  for (const character of value) hash = ((hash << 5) - hash + character.codePointAt(0)) | 0
  return Math.abs(hash)
}

function xml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function wrapTitle(value, maxWidth = 15, maxLines = 3) {
  const lines = []
  let line = ''
  let width = 0

  for (const character of value) {
    const characterWidth = character.codePointAt(0) > 255 ? 1 : 0.56
    if (line && width + characterWidth > maxWidth) {
      lines.push(line.trim())
      line = ''
      width = 0
    }
    line += character
    width += characterWidth
  }

  if (line.trim()) lines.push(line.trim())
  if (lines.length > maxLines) {
    lines.length = maxLines
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -1)}…`
  }
  return lines
}

function coverName(post, kind) {
  return `frontend-${kind}-${post.slug}.svg`
}

function coverUrl(post, kind) {
  return `/img/covers/${coverName(post, kind)}`
}

function renderCover(post, kind) {
  const hash = hashCode(`${kind}-${post.slug}`)
  const [dark, primary, accent] = palettes[hash % palettes.length]
  const title = kind === 'chronicle'
    ? `${post.date.slice(0, 4)} · ${post.title}`
    : post.title
  const lines = wrapTitle(title)
  const series = kind === 'chronicle' ? 'FRONTEND CHRONICLE' : 'DEBUGGING FIELD GUIDE'
  const badge = kind === 'chronicle' ? post.date.slice(0, 4) : 'FIX & PREVENT'
  const lineMarkup = lines
    .map((line, index) => `<tspan x="72" y="${238 + index * 68}">${xml(line)}</tspan>`)
    .join('')
  const orbit = 112 + (hash % 70)
  const angle = 18 + (hash % 42)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">${xml(title)}</title>
  <desc id="desc">${xml(post.topic)} 技术文章封面</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="0.58" stop-color="${primary}"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff" stop-opacity=".32"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="38" height="38" patternUnits="userSpaceOnUse">
      <path d="M38 0H0V38" fill="none" stroke="#fff" stroke-opacity=".07"/>
    </pattern>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#020617" flood-opacity=".3"/>
    </filter>
  </defs>
  <rect width="1200" height="630" rx="28" fill="url(#bg)"/>
  <rect width="1200" height="630" rx="28" fill="url(#grid)"/>
  <circle cx="1030" cy="110" r="280" fill="url(#glow)"/>
  <circle cx="1030" cy="316" r="${orbit}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-dasharray="9 13" transform="rotate(${angle} 1030 316)"/>
  <circle cx="1030" cy="316" r="74" fill="#fff" fill-opacity=".12" stroke="#fff" stroke-opacity=".42"/>
  <path d="M992 316h76M1030 278v76" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".78"/>
  <g filter="url(#shadow)">
    <rect x="72" y="62" width="270" height="44" rx="22" fill="#fff" fill-opacity=".14" stroke="#fff" stroke-opacity=".3"/>
    <text x="94" y="91" fill="#fff" font-family="Inter, PingFang SC, Microsoft YaHei, sans-serif" font-size="17" font-weight="700" letter-spacing="2">${series}</text>
  </g>
  <text fill="#fff" font-family="Inter, PingFang SC, Microsoft YaHei, sans-serif" font-size="50" font-weight="800" letter-spacing="-1">${lineMarkup}</text>
  <g transform="translate(72 516)">
    <rect width="154" height="46" rx="23" fill="#fff" fill-opacity=".16" stroke="#fff" stroke-opacity=".28"/>
    <text x="77" y="30" text-anchor="middle" fill="#fff" font-family="Inter, PingFang SC, Microsoft YaHei, sans-serif" font-size="17" font-weight="700">${xml(badge)}</text>
    <text x="178" y="30" fill="#fff" fill-opacity=".86" font-family="Inter, PingFang SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="600">${xml(post.topic)}</text>
  </g>
  <text x="1128" y="578" text-anchor="end" fill="#fff" fill-opacity=".72" font-family="Inter, sans-serif" font-size="18" font-weight="700" letter-spacing="2">95Y.DEV</text>
</svg>
`
}

function markdownSection(title, body) {
  return ['## ' + title, '', body].join('\n')
}

function bulletList(items) {
  return items.map((item) => '- ' + item).join('\n')
}

function numberedList(items) {
  return items.map((item, index) => (index + 1) + '. ' + item).join('\n')
}

function pick(post, salt, values) {
  return values[hashCode(post.slug + salt) % values.length]
}

function renderHistoryBody(post) {
  const year = post.date.slice(0, 4)
  const variant = hashCode(post.slug) % 6
  const intros = [
    '如果把时间拨回 ' + year + ' 年，' + post.topic + ' 所面对的问题和今天并不完全一样。回头看这次变化，最有意思的不是版本号，而是开发方式从这里拐了一个弯。',
    '整理这段历史时，我更想回答一个实际问题：这次升级到底替开发者省掉了什么，又带来了哪些新的约束？',
    '很多技术在发布当天看起来只是多了几个 API，真正的影响往往要过一两年才看得清。' + post.topic + ' 这次变化就是一个典型例子。',
    '这不是一篇发布日志翻译。我只挑项目里真正能感知到的变化，再看看它们放到今天是否仍然值得借鉴。',
    '前端工具更新很快，但并不是每个版本都值得记住。' + year + ' 年这次变化之所以留下来，是因为它改变了后续项目的默认做法。'
  ]
  const [contextHeading, , detailHeading, impactHeading, practiceHeading, sourceHeading] = headingsFor(post)
  const sourcesBlock = markdownSection(sourceHeading, references(post.refs))
  const extra = renderExtraSections(post)

  if (variant === 0) {
    return [
      intros[variant],
      markdownSection(contextHeading, post.event),
      renderExample(post),
      extra,
      markdownSection(impactHeading, post.impact + '\n\n' + bulletList(post.changes)),
      markdownSection(practiceHeading, post.today),
      sourcesBlock
    ].join('\n\n')
  }

  if (variant === 1) {
    return [
      intros[variant],
      markdownSection(impactHeading, post.impact),
      markdownSection(contextHeading, post.event),
      markdownSection(detailHeading, numberedList(post.changes)),
      renderExample(post),
      extra,
      markdownSection(practiceHeading, post.today),
      sourcesBlock
    ].join('\n\n')
  }

  if (variant === 2) {
    return [
      intros[variant],
      markdownSection(contextHeading, post.event + '\n\n' + post.impact),
      renderExample(post),
      extra,
      markdownSection(detailHeading, bulletList(post.changes)),
      markdownSection(practiceHeading, post.today),
      sourcesBlock
    ].join('\n\n')
  }

  if (variant === 3) {
    return [
      intros[variant],
      markdownSection(impactHeading, post.impact),
      renderExample(post),
      extra,
      markdownSection(detailHeading, bulletList(post.changes)),
      markdownSection(contextHeading, post.event),
      markdownSection(practiceHeading, post.today),
      sourcesBlock
    ].join('\n\n')
  }

  if (variant === 4) {
    return [
      intros[variant],
      post.event,
      renderExample(post),
      extra,
      markdownSection(detailHeading, post.changes.join('；') + '。'),
      markdownSection(impactHeading, post.impact),
      markdownSection(practiceHeading, post.today),
      sourcesBlock
    ].join('\n\n')
  }

  return [
    intros[variant],
    post.event + '\n\n' + post.impact,
    renderExample(post),
    extra,
    markdownSection(detailHeading, bulletList(post.changes)),
    markdownSection(practiceHeading, post.today),
    sourcesBlock
  ].join('\n\n')
}

function renderDebugBody(post) {
  const variant = hashCode(post.slug) % 5
  const [symptomHeading, , causeHeading, diagnoseHeading, fixHeading, sourceHeading] = headingsFor(post)
  const extra = renderExtraSections(post)
  const intros = [
    '这个问题最麻烦的地方，是表面现象和真正根因经常不在同一层。下面按一次实际排查的顺序来走。',
    '遇到这类报错时，先别急着改配置。稳定复现、缩小范围，通常比在搜索结果里反复复制答案更快。',
    '我把这类问题拆成了“看到什么、怎么定位、最后改哪里”三部分。下次再遇到，可以直接照着检查。',
    '这类 Bug 很少靠一行代码彻底解决。修复现场问题之外，还要把缓存、生命周期或发布流程一起补上。',
    '先说结论：不要从报错文字直接猜答案。把现场压缩成最小例子，再顺着引用、网络或渲染链路往回找，通常更稳。'
  ]
  const source = markdownSection(sourceHeading, references(post.refs))

  if (variant === 0) {
    return [
      intros[variant],
      markdownSection(symptomHeading, bulletList(post.symptoms)),
      renderExample(post),
      extra,
      markdownSection(diagnoseHeading, numberedList(post.steps)),
      markdownSection(causeHeading, bulletList(post.causes)),
      markdownSection(fixHeading, numberedList(post.fixes) + '\n\n' + post.prevent),
      source
    ].join('\n\n')
  }

  if (variant === 1) {
    return [
      intros[variant],
      markdownSection(symptomHeading, bulletList(post.symptoms)),
      markdownSection(diagnoseHeading, numberedList(post.steps)),
      renderExample(post),
      extra,
      markdownSection(causeHeading, bulletList(post.causes)),
      markdownSection(fixHeading, numberedList(post.fixes)),
      post.prevent,
      source
    ].join('\n\n')
  }

  if (variant === 2) {
    return [
      intros[variant],
      markdownSection(symptomHeading, numberedList(post.symptoms)),
      markdownSection(diagnoseHeading, numberedList(post.steps)),
      markdownSection(causeHeading, post.causes.join('；') + '。'),
      renderExample(post),
      extra,
      markdownSection(fixHeading, bulletList(post.fixes) + '\n\n' + post.prevent),
      source
    ].join('\n\n')
  }

  if (variant === 3) return [
    intros[variant],
    markdownSection(fixHeading, post.prevent),
    markdownSection(symptomHeading, bulletList(post.symptoms)),
    renderExample(post),
    extra,
    markdownSection(diagnoseHeading, numberedList(post.steps)),
    markdownSection(causeHeading, bulletList(post.causes) + '\n\n' + numberedList(post.fixes)),
    source
  ].join('\n\n')

  return [
    intros[variant],
    post.symptoms.join('；') + '。',
    renderExample(post),
    extra,
    markdownSection(diagnoseHeading, numberedList(post.steps) + '\n\n' + bulletList(post.causes)),
    markdownSection(fixHeading, numberedList(post.fixes) + '\n\n' + post.prevent),
    source
  ].join('\n\n')
}

function renderHistory(post) {
  const year = post.date.slice(0, 4)
  const description = `${post.event.split('。')[0]}。梳理核心变化、工程影响与今天的实践建议。`
  return `---
title: ${yaml(post.title)}
date: ${post.date} 09:00:00
tags:
  - 前端年鉴
  - ${post.topic}
  - ${year}
categories:
  - 前端年鉴
description: ${yaml(description)}
cover: ${coverUrl(post, 'chronicle')}
top_img: ${coverUrl(post, 'chronicle')}
toc: true
---
${renderHistoryBody(post)}
`
}

function renderDebug(post) {
  const description = `${post.symptoms[0]}。从症状、根因、定位步骤到修复与预防，给出完整排查路径。`
  return `---
title: ${yaml(post.title)}
date: ${post.date} 14:00:00
tags:
  - 前端排障
  - ${post.topic}
categories:
  - 前端排障
description: ${yaml(description)}
cover: ${coverUrl(post, 'debug')}
top_img: ${coverUrl(post, 'debug')}
toc: true
---
${renderDebugBody(post)}
`
}

fs.mkdirSync(postsDir, { recursive: true })
fs.mkdirSync(coversDir, { recursive: true })

for (const name of fs.readdirSync(postsDir)) {
  if (/^frontend-(chronicle|debug)-.*\.md$/.test(name)) {
    fs.unlinkSync(path.join(postsDir, name))
  }
}

for (const name of fs.readdirSync(coversDir)) {
  if (/^frontend-(chronicle|debug)-.*\.svg$/.test(name)) {
    fs.unlinkSync(path.join(coversDir, name))
  }
}

for (const post of history) {
  const yearMonth = post.date.slice(0, 7)
  fs.writeFileSync(
    path.join(postsDir, `frontend-chronicle-${yearMonth}-${post.slug}.md`),
    renderHistory(post)
  )
  fs.writeFileSync(path.join(coversDir, coverName(post, 'chronicle')), renderCover(post, 'chronicle'))
}

for (const post of debugGuides) {
  fs.writeFileSync(
    path.join(postsDir, `frontend-debug-${post.slug}.md`),
    renderDebug(post)
  )
  fs.writeFileSync(path.join(coversDir, coverName(post, 'debug')), renderCover(post, 'debug'))
}

console.log(`Generated ${history.length} chronicle posts, ${debugGuides.length} debugging guides, and ${history.length + debugGuides.length} unique covers.`)
