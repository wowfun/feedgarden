# 首页来源与主题筛选

导航栏提供播客、GitHub、arXiv 独立栏目。源仍在配置中时，禁用采集不会移除其历史栏目；删除来源配置后，不再生成或保护相应栏目索引。

[Clippings](clippings.zh-CN.md) 位于首页和播客之间，手工维护的条目同时显示在首页，中英文界面共用一份正文。该能力已由固定的 0.3.2 正式版本支持，验证方式见[开发说明](development.md#local-clippings-validation)。

Clippings 的来源筛选标签取自各语言 `config/locales/*.json` 中的 `tag_labels["source/clippings"]`，无需增加采集来源配置。

Clippings 可直接使用 Obsidian Web Clipper 的原始 frontmatter：`published` 作为文章日期，`source` 作为原文链接，作者双链保持原样。目录默认将条目发布为文章，并在构建时补充来源标签；`agents` 等已维护的主题 ID 自动映射到筛选标签，无需改写原稿。使用 `publish: false` 排除草稿。省略 `lang` 时正文语言为 `und`，文本方向自动判定。

可选的 `source_title` 用于显示原文链接的标题，覆盖列表、详情页、收藏和 Markdown 导出；省略时显示原 URL，不改变站内文章的 `title`。

Feedgarden 开启 `website.home.hide_tab_sources: true`，首页默认排除播客、GitHub、arXiv 这些按来源选择的独立栏目及其 items；按目录收录的 Clippings 保持显示。在“来源”标题下方点击“显示独立栏目”可一并展开来源和内容。“主题”下方的“显示隐藏主题”只展开候选标签，不改变结果。各栏目、收藏、搜索和文章标签仍保留完整历史。

展开状态使用 `include_tabs=1`、`show_hidden=topic` 保留在 URL 中，支持翻页、刷新、分享、切换语言与前进后退。旧链接明确选择独立栏目来源时会自动展开；收起来源时清除已选的独立栏目来源并回到第一页，保留主题和日期条件。收起主题时保留已选隐藏主题，便于取消筛选。

首页的“全部”、来源及主题计数、日期导航、分页、导出均使用当前来源范围。导出弹窗打开时继承页面状态，弹窗内调整不改变页面 URL。无 JavaScript 时，默认首页内容与计数仍正确，栏目及文章链接可正常访问。

来源与主题筛选设置由已锁定的 `jekyll-obsidian-site` 0.3.2 正式版本支持。两套主题还会在滚动超过一屏后显示“回到顶部”按钮。

[English](site.md) · [主题治理](topics.zh-CN.md)
