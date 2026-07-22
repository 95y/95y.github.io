---
title: "React Foundation：核心项目进入更独立的治理阶段"
date: 2026-02-24 09:00:00
tags:
  - 前端年鉴
  - React
  - 2026
categories:
  - 前端年鉴
description: "React Foundation 正式落地后，普通项目无需改代码，但应该重新检查关键依赖负责人、官方安全源与供应链响应。"
cover: /img/covers/frontend-chronicle-react-foundation.svg
top_img: /img/covers/frontend-chronicle-react-foundation.svg
toc: true
---
2026 年 2 月，React Foundation 在 Linux Foundation 下正式启动。React、React Native 和 JSX 等项目不再由 Meta 持有，而由新的独立基金会承接。基金会董事会负责资源、基础设施与生态支持，技术方向则计划由独立的技术治理结构决定。

这条新闻不会让组件多一个 Hook，也不会让应用快一毫秒。但对一个依赖 React 十年的团队来说，治理、商标、CI、发布基础设施和维护者来源，本来就是技术风险的一部分。我们借这次变化更新了依赖治理文档，而不是写一段无关的示例组件。

## 先区分基金会治理和技术治理

官方公告里有一个很重要的分离：基金会董事会与 React 的技术治理并不是同一件事。董事会由创始成员代表组成，负责基金会资源与生态；React 技术方向继续由贡献者/维护者主导，并由临时领导委员会设计更独立的结构。

这能避免简单把“出资公司”理解为“直接决定 API”。最终章程、决策流程、维护者晋升和 RFC 透明度仍需后续观察，成立当天并不表示所有治理细节都已经完成。

官方列出的八个白金创始成员包括 Amazon、Callstack、Expo、Huawei、Meta、Microsoft、Software Mansion 和 Vercel。多家浏览器外/云/框架生态公司共同参与，至少让资源来源不再只挂在单一公司名下。

## 对普通项目，明天的 package.json 不会变化

React 的 npm 包名、许可证、升级路径不会因为基金会公告自动改变。我们没有发起“基金会迁移 PR”，也没有修改代码。真正做的是把依赖风险从版本号扩大到维护状态。

项目新增一份简短的依赖政策：

```yaml
# dependency-policy.yml
critical:
  - name: react
    owner: frontend-platform
    review: quarterly
    sources:
      - https://react.dev/blog
      - https://github.com/facebook/react/releases
    checks:
      - security-advisories
      - supported-versions
      - license
      - release-cadence
      - migration-window
```

它不直接参与构建，但明确谁关注官方安全公告、谁安排升级窗口。核心依赖无人负责，比治理模式本身更现实的风险。

## 2025 年的 RSC 安全事件说明“官方来源”有多重要

基金会正式成立前后，React Server Components 生态曾出现需要快速升级的严重安全问题。类似事件中，团队最危险的做法是从群聊截图判断受影响版本。

我们的响应流程是：

```text
官方安全公告 -> 识别受影响框架/版本 -> 锁定修复版
-> 测试与构建 -> 灰度部署 -> 验证线上实际版本 -> 复盘
```

框架经常封装 React 的服务器能力，不能只查 `react` 顶层版本；要看 Next/其他框架公告、lockfile 实际解析与部署产物。基金会可以改善长期基础设施，不能替每个使用方完成供应链响应。

## SBOM 和锁文件比“我们用了 React 19”更准确

monorepo 中可能同时存在多个 React/renderer 版本，口头说主版本不够。我们在发布产物生成依赖清单并检查重复版本：

```bash
npm ls react react-dom --all
npm audit --omit=dev
```

`npm audit` 不是完整安全方案，但能作为一条输入；还需跟踪框架官方 advisory 和运行时暴露面。锁文件要纳入评审，生产镜像/静态产物应能对应到具体 commit 与 release。

## 基金会降低的是哪类风险

可能的长期好处包括：

- 仓库、网站、CI、商标和大会有独立法律/资金载体；
- 多家公司能通过共同机制投入维护资源；
- React 与 React Native/JSX 等生态项目能获得持续支持；
- 技术决策机制有机会更公开地与单一公司组织解耦。

但基金会结构并不自动保证 API 稳定、没有安全漏洞或所有 RFC 都符合某个团队偏好。工程选型仍要看 release 质量、维护者响应、文档、生态兼容和迁移成本。

## 我们如何评估“关键开源依赖”

React 只是其中一个。对于构建器、框架、包管理器和监控 SDK，我们都会看：

1. 是否有多名活跃维护者，bus factor 怎样；
2. 安全公告是否有明确渠道和修复节奏；
3. 版本支持/弃用政策是否可预测；
4. 财务/组织支持是否可持续；
5. 是否存在开放的 issue/RFC/发布记录；
6. 项目若停更，迁移出口和数据格式是否开放。

这里没有一个分数能自动决定选型。基金会是积极信号，实际技术证据仍要持续观察。

## 不因为治理变化做“框架逃生演习”，但保留边界

我们不会为假想的 React 停更重写 UI；会避免把领域逻辑全部绑在组件生命周期里。请求、权限、数据转换和业务规则尽量保持可独立测试，设计系统有清楚接口，部署不只支持单一云平台。

这不是为了随时换框架，而是正常的软件边界。即便永远使用 React，它也能让测试和升级更容易。

## 这条新闻真正值得记录的原因

React 从 Meta 内部项目成长为跨公司生态，组织形式终于跟上了影响范围。基金会正式落地，意味着开源项目的“谁拥有基础设施、谁提供资源、谁决定技术方向”开始被更明确地拆开。

对业务团队，最务实的动作不是庆祝或质疑口号，而是确保关键依赖有负责人、官方信息源、升级演练和可追踪产物。组织治理能降低一部分上游风险，下游使用责任仍然在我们自己手里。

## 资料

- [React Foundation 正式成立公告](https://react.dev/blog/2026/02/24/the-react-foundation)
- [React Foundation 筹备公告](https://react.dev/blog/2025/10/07/introducing-the-react-foundation)
