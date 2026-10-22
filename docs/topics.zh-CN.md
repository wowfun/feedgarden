# 主题治理

在 `config/topics.json` 的主题对象中设置 `hidden: true` 可隐藏主题；未设置时默认为 false。隐藏与 `deprecated` 相互独立，不改写历史 item、文章和收藏中的标签。

隐藏可撤销：通过 `topics apply` 将 `hidden` 改回 false，未废弃的主题就会重新进入默认筛选项和 Agent 候选。

首页、独立栏目、收藏及导出的主题候选默认隐藏这些主题。点击“主题”下方的“显示隐藏主题”可临时展开；收起时，已选中的隐藏主题仍保留为可取消的筛选项。展开按钮不改变 Agent 的候选范围。

Agent 不得选择隐藏或废弃主题，也不得创建隐藏主题。完整注册表仍传入 Agent，隐藏主题的 ID、中英文名称及别名继续保留，防止以同义词重复创建。缓存和恢复中的结果接受前会再次校验；已接受的历史摘要不会仅因注册表改变而重新分类。两种语言的 `_locale.yml` 生成一致、排序稳定的 `hidden_tags`。

使用 runner 锁应用修改：

```sh
npm run feedgarden -- topics apply revised-topics.json
```

保留 ID 及旧名称、别名。需要合并的主题使用 `deprecated` 和指向未废弃、未隐藏主题的 `replacedBy`。省略 `hidden` 与显式设置 `hidden: false` 在校验和合并时等价。不要在运行中的任务外直接覆盖注册表。

[English](topics.md) · [网站筛选](site.zh-CN.md)
