# 每日 agent 任务

让 agent 直接读取[操作 Skill](../skills/feedgarden/SKILL.md)，无需安装到它的 Skill 目录。从仓库根目录使用以下 prompt：

```text
读取并遵循 skills/feedgarden/SKILL.md，更新并发布昨天的信息流。按实例时区，仅更新已到采集时间的来源：默认 06:00 起采集 Hacker News、Reddit、Anthropic、OpenAI、GitHub、X、播客，18:00 起采集 arXiv、Product Hunt。
```

在仓库根目录之外使用时，将 skill 路径替换为绝对路径。直接引用默认使用 CLI 的标准用户实例，也可显式指定工作区或配置文件。skill 的位置只用于定位程序，不决定操作哪个实例。仍可选用 `skill install /absolute/skills/feedgarden`，通过 `invocation.json` 将安装副本绑定到经过验证的运行时和实例。

实例应已初始化，并配置所需订阅和发布目标。每次调用只更新任务开始时已到点、已配置且启用的来源；实例自定义的 `processAfter` 优先于 prompt 中的默认时间。缺失或禁用的来源会列入结果。没有发布目标时仍更新符合条件的来源，并明确报告未发布。

这些时间是此 agent 工作流的采集门槛。Skill 会在采集前检查 `processAfter`；CLI 本身只用该设置判断加工就绪时间，直接运行 `sync` 仍可提前采集。agent 不会等待下个时间点或创建周期任务。执行、恢复和结果报告规则统一放在 skill 中；需要持久调度时，参见[原生调度](operations.md#scheduling)。
