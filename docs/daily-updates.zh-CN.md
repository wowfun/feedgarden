# 每日信息流任务

[English](daily-updates.md)

以下是可复制的任务 prompt，不会自动创建 Codex 定时任务。两个任务均使用本机 `D:\Projects\feedgarden`，时区设为 **Asia/Shanghai**；本地运行时需要电脑和 Codex 保持运行。

| 时间 | 来源 ID | 用意 |
| --- | --- | --- |
| 每天 06:00 | `hackernews reddit anthropic openai github x podcast` | 昨天结束后留出六小时，再整理早间阅读内容 |
| 每天 18:00 | `arxiv producthunt` | 给延迟公开的论文及洛杉矶日榜更多更新时间 |

06:00 适合作为早间阅读的折中，但不保证完整覆盖昨天：HN/Reddit 是当前排名快照，X 是有限样本。18:00 也不保证 arXiv 昨天提交的论文都已公开。Product Hunt 使用洛杉矶日榜日期（夏令时影响换算），不是精确发布时间。遵守严格日期策略时，迟到且已过期的条目会被跳过；本任务不补抓、不补救。

有明确日期的候选只处理上海昨天 `[00:00, 次日 00:00)`，上界不包含。无明确日期的来源使用首次观察时间，只接受执行开始前 7 天内首次观察的条目；重复抓取不会重置首次观察日期。内容保留实际日期，不改写成昨天。迁移截止线、关键词、Top 50、隐藏 topics 和已有预算仍然生效。Top 50 筛选待处理候选，已发布内容保留。

`run --due` 顺序执行采集、排名、摘要、渲染、关联和备份，`--no-publish` 阻止远端发布。采集渠道可能返回比日期窗口更宽的快照；摘要与首次发布再次过滤。每个来源独立保存最近一次摘要窗口，随后执行 `rank`/`render` 或重启仍然有效；处理其他来源不会覆盖它。不带日期的 `summarize` 仅移除所选来源的窗口上界，因此下面的任务不得降级为无日期运行。重复执行相同窗口会保留内容抓取的退避时间。每次成功备份都会刷新当天和当周的快照，包含同一任务中此前来源的结果。

若 `site:build` 因锁定主题版本不支持现有配置而失败，保留生成内容和已有预览，报告具体错误。不要自动升级依赖、删除隐藏标签配置或绕过构建校验。本地主题候选的预览验收与锁定发布版构建是不同结果。

## 06:00 任务 prompt

```text
在 D:\Projects\feedgarden 执行早间信息流更新。只处理来源 hackernews、reddit、anthropic、openai、github、x、podcast，不处理其他来源。

开始时读取仓库 AGENTS.md 和 docs/daily-updates.zh-CN.md，确认当前 CLI 支持 --until 和 --observed-days；不支持则报告并停止，不修改代码或退回无界运行。使用 Luxon 的 Asia/Shanghai 时区计算执行日今天 00:00 的 until 和昨天 00:00 的 since，保留 ISO 时区偏移。冻结这两个值，整个任务和重试期间不重新计算，包括跨午夜情况。

按上述来源顺序逐个执行，每次等待结束：
npm run feedgarden -- run --due --source SOURCE --since SINCE --until UNTIL --observed-days 7 --no-publish
把 SOURCE、SINCE、UNTIL 替换为当前来源和冻结的实际 ISO 值。

严格遵守昨天的有日期候选窗口；无日期候选只使用最近 7 天内的首次观察时间，保留真实日期。保持现有 Top 50、关键词、隐藏 topics、ACP 预算和冷却规则。不补抓、不扩大日期、不补救已过期候选，不用 --history、--refresh、--rebuild 或 --retry-failed。保留已发布内容，不因排名变化删除历史。不要修改配置、代码、凭据或任务设置，不提交、不推送、不发布远端站点。

单个来源部分失败时保留成功结果，记录原因后继续下一个来源；锁冲突、租约丢失或取消时停止整个任务。预算耗尽不绕过限额。不把 X 有限样本、有效空响应、未到间隔或过滤后的零条目描述成来源没有发布内容。读取 CLI 输出和本次 runs.details，按来源记录 fetchedItems、newItems、eligibleCandidates、generated、newPublications，以及窗口内 pending/failed 和覆盖说明；跨渠道统计不要把 fetchedItems 当成唯一新增数。

若本次有首次发布或公开文件变化，运行 npm run site:build，刷新现有本地预览；未运行预览时用 npm run site:serve 启动并打开输出的本地地址。仅在有新增内容、失败、未完成任务或需要用户处理时通知；全部正常且没有公开变化时保持安静。通知列出冻结日期范围、每个来源的实际新增发布数及异常原因，不声称完整覆盖。
```

## 18:00 任务 prompt

```text
在 D:\Projects\feedgarden 执行晚间信息流更新。只处理来源 arxiv、producthunt，不处理其他来源。

开始时读取仓库 AGENTS.md 和 docs/daily-updates.zh-CN.md，确认当前 CLI 支持 --until 和 --observed-days；不支持则报告并停止，不修改代码或退回无界运行。使用 Luxon 的 Asia/Shanghai 时区计算执行日今天 00:00 的 until 和昨天 00:00 的 since，保留 ISO 时区偏移。冻结这两个值，整个任务和重试期间不重新计算，包括跨午夜情况。

按 arxiv、producthunt 顺序逐个执行，每次等待结束：
npm run feedgarden -- run --due --source SOURCE --since SINCE --until UNTIL --observed-days 7 --no-publish
把 SOURCE、SINCE、UNTIL 替换为当前来源和冻结的实际 ISO 值。

有日期候选严格使用上海昨天窗口。arXiv 的日期是提交日期，Product Hunt 的日期是洛杉矶日榜日期对应的时间点，不能改成公告日或精确发布时间。无日期候选只使用最近 7 天内的首次观察时间，保留真实日期。保留 arXiv 关键词、已有筛选、隐藏 topics、ACP 预算和冷却规则。不补抓、不扩大日期、不补救已过期候选，不用 --history、--refresh、--rebuild 或 --retry-failed。保留已发布内容。不要修改配置、代码、凭据或任务设置，不提交、不推送、不发布远端站点。

单个来源部分失败时保留成功结果，记录原因后继续下一个来源；锁冲突、租约丢失或取消时停止整个任务。预算耗尽不绕过限额。不把 API 尚未可见、有效空响应、未到间隔或过滤后的零条目描述成来源没有发布内容。读取 CLI 输出和本次 runs.details，按来源记录 fetchedItems、newItems、eligibleCandidates、generated、newPublications，以及窗口内 pending/failed 和覆盖说明；跨渠道统计不要把 fetchedItems 当成唯一新增数。

若本次有首次发布或公开文件变化，运行 npm run site:build，刷新现有本地预览；未运行预览时用 npm run site:serve 启动并打开输出的本地地址。仅在有新增内容、失败、未完成任务或需要用户处理时通知；全部正常且没有公开变化时保持安静。通知列出冻结日期范围、每个来源的实际新增发布数及异常原因，不声称完整覆盖。
```

## 检查结果

`eligibleCandidates` 统计符合条件的候选集合，其中可能包括已经接受或可复用的摘要，并非剩余生成任务数。候选数大于零，而 `generated` 和 `pending` 都为零，是正常情况。

`fetchedItems` 是渠道返回数；`newItems` 是新入库身份数；`eligibleCandidates` 是符合窗口与现有规则的候选数；`generated` 是本轮接受的摘要副本数；`newPublications` 才是首次发布的 item 数，不包含启动时接管或导入的已有公开历史。刷新摘要不等于首次发布。候选计数只在显式指定 `--since` 时计算，上述任务均满足；无日期范围的运行返回 `eligibleCandidates: null`，避免为诊断扫描全部历史。缺失或 null 计数不能当零。失败后的已完成报告仍保存在 `runs.details`。

不要为“零新增”自动改用更早日期。排查时区、采集间隔、fallback、过滤和摘要预算，参见 [来源说明](sources.md)、[运行维护](operations.md) 与 [归档维护](archives.md)。误采的生成文章可通过 `archives remove` 按身份移除中英文，保留私有证据与发布历史；这不是每日任务的自动清理步骤。
