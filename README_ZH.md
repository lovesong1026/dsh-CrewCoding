<p align="right">
  <a href="./README.md">English</a> · <strong>简体中文</strong>
</p>

# dsh-CrewCoding

> 为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 设计的受控多 Agent 编码协作插件。

普通编码问题继续由 DSH 主 Agent 完成。只有需要并行审查，或需要“实现 → 验证”的受控交付时，才启动一个小型 Crew。

## 只保留两条命令

| 命令 | 适用场景 | 执行方式 |
| --- | --- | --- |
| `/crew-check <目标>` | 安全、性能审查 | 两个只读审查者并发工作。 |
| `/crew-build <目标>` | 功能开发、重构、跨模块改动 | 一个实现者写入；一个验证者独立审查与测试。 |

刻意不提供通用 `/crew`，也不做自然语言自动分流。小问题应由主 Agent 直接完成，不为协作付出额外 token 和调度成本。

## 在共享工作区中如何保持安全

- **同一时刻只有一个写入者。** 实现和修复任务必须获取持久化写入租约；检查、审查和测试任务仍可并发。
- **先审阅计划，再启动。** 命令先生成待审批的成员与任务图；点击 **Approve & Run** 前不会创建子 Agent。
- **交付有可核验的契约。** 写任务记录范围、验收条件、验证命令、实际修改路径与证据。
- **实现与验证分离。** 实现者不能批准自己的修改；验证者基于真实 diff 做独立检查。
- **状态可恢复。** 团队状态保存在 `<workspace>/.crew-coding/`；重试或转派后，旧 attempt 的迟到更新会被拒绝。

> 写入租约能阻止插件调度出的写任务重叠；它不是宿主级文件沙箱，不能物理阻止模型任意执行 shell 写操作。

## 运行流程

```text
/crew-check 鉴权中间件
  → 生成待审批计划
  → 批准
  → security + performance 并行只读审查
  → 汇总有代码证据的问题

/crew-build 为 API 增加限流
  → 生成待审批计划
  → 批准
  → implementer 唯一写入
  → verifier 审查 diff 并运行验证
  → 仅在发现真实问题时进入 repair
```

右上角悬浮监控器保持不变：显示当前任务、成员、写入状态和进度，但不占用主对话。

## 安装

### 从 npm 安装

```sh
dsh plugin --profile web add @nanmicoder/dsh-crew-coding
```

### 从本地源码安装

```sh
pnpm install
pnpm build
dsh plugin --profile web add /绝对路径/dsh-CrewCoding
```

检查组合配置后重启 DSH：

```sh
dsh --profile web --dump-config
dsh web --no-open
```

## 默认 Profile

发行包内置两种最小 profile：

```yaml
profiles:
  check:
    # security + performance，均为只读
  build:
    # implementer 写入，verifier 只读
```

Profile 覆盖会替换整段插件配置，因此请重新声明所需字段：

```yaml
- id: crew-coding
  config:
    stateDir: .crew-coding
    memberProvider: spawn
    memberMaxDepth: 1
    maxMembers: 3
    profiles:
      # 自定义 check/build
```

`memberMaxDepth: 1` 表示 Captain 可创建一级成员，成员不能继续委派。

## 开发

```sh
pnpm install
pnpm build
pnpm verify
```

改动 host、包元数据或 profile 后要重启 DSH；普通客户端构建后刷新当前 Web 页面即可。

## 边界

- 这是 Coding 协作插件，不是通用研究或专家路由器。
- 一个 Captain 同时只管理一个活动团队。
- 未经用户明确请求，不部署、不发送外部消息，也不产生其他外部副作用。
- 不要让多个 DSH 进程同时操作同一个 `.crew-coding` 团队状态。

## 许可证

[MIT](./LICENSE)
