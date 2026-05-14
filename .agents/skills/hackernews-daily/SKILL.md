---
name: hackernews-daily
description: 获取 Hacker News 每日热门话题及精彩讨论。先运行 scripts/fetch.py 抓取数据并存入 SQLite，再由 Agent 逐条分析写出日报。
---

# Hacker News Daily

获取 Hacker News 每日热门话题与精彩讨论。工作分为两阶段：`scripts/fetch.py` 完成所有确定性抓取，Agent 负责分析撰写。

## 技能目录结构

```
hackernews-daily/
├── SKILL.md                     # 本文件
├── scripts/
│   └── fetch.py                 # 确定性：HN API + SQLite
└── references/
    └── api.md                   # HN API 参考
```

## 触发条件

- 用户要求获取 Hacker News 日报 / 热门话题 / 精彩讨论
- 用户已运行 `fetch.py` 并要求继续分析撰写日报

---

## 阶段 1：运行 fetch.py

```bash
python /path/to/hackernews-daily/scripts/fetch.py
```

如果当前工作目录不是项目根目录，显式传入项目根：

```bash
python /path/to/hackernews-daily/scripts/fetch.py --project /path/to/project
```

`fetch.py` 完成以下操作：

1. 从 HN API 获取 Top 30 故事 ID
2. 并行获取所有故事详情（标题、得分、评论数、链接等）
3. 按 score 前 10 + descendants 前 10 去重，取 12 条
4. 写入 `feeds/.cache/hn.db`（三表：stories / comments / daily_picks）
5. 尝试抓取每篇文章的原文（失败标记 `[FETCH_FAILED]`）
6. 尝试抓取每条故事的评论（已缓存的跳过）

数据库已就绪，进入阶段 2。

---

## 阶段 2：Agent 分析 & 撰写

### 2.1 检查 fetch.py 输出

关注最后的 `print_status` 行：`⚠ N 篇文章抓取失败 [FETCH_FAILED]`。

### 2.2 补抓失败的原文

对 `content = '[FETCH_FAILED]'` 的故事，使用网页抓取能力重新获取原文内容，然后更新数据库：

```sql
UPDATE stories SET content = 'new content', updated_at = datetime('now') WHERE id = ?;
```

> 原文中的单引号需转义为 `''`。

URL 为空或为 HN 自引用（不含 `http` 或包含 `news.ycombinator.com`）的文章设 `content = '[HN 原帖]'`。

### 2.3 查询今日数据

```sql
SELECT s.id, s.title, s.url, s.by, s.score, s.descendants, s.content, dp.rank
FROM stories s
JOIN daily_picks dp ON s.id = dp.story_id
WHERE dp.date = 'YYYY-MM-DD'
ORDER BY dp.rank;
```

对每条故事查询评论：

```sql
SELECT id, by, text, time FROM comments
WHERE story_id = ?
ORDER BY id;
```

收集 YAML frontmatter 所需统计：

```
stories_count ← SELECT COUNT(*) FROM daily_picks WHERE date = ?
comments_count ← SELECT COUNT(*) FROM comments WHERE story_id IN (SELECT story_id FROM daily_picks WHERE date = ?)
model ← 当前 AI 模型名称
generated_at ← 当前 UTC 时间（ISO 8601 格式）
```

### 2.4 撰写章节

每条话题输出为一个独立的 `##` 标题章节：

```markdown
## 话题标题

url: https://example.com
hn: https://news.ycombinator.com/item?id={id}
score: {score}
comments: {descendants}
by: {by}

### 总结

[基于 stories.content 和评论的核心摘要，2-4 句话]

### 讨论亮点

- [中文提炼评论核心观点，1 句]
  - raw: 英文原文（不含双引号）
  - by: commenter_username
  - url: https://news.ycombinator.com/item?id={comment_id}

- [中文提炼评论核心观点]
  - raw: 英文原文（不含双引号）
  - by: ...
  - url: ...
```

#### 章节规则

- 元数据用 `key: value` 格式，易读且可被程序解析
- sum 基于 `stories.content` 和评论内容，不凭标题臆测
- 每条评论以中文提炼开头，`raw` / `by` / `url` 标注来源
- `raw` 保留原文语种，不含双引号（如 `raw: hello world` 而非 `raw: "hello world"`）
- `raw` 过长时摘录关键句
- 正文用中文（总结、标题、分析），`raw` 保留原文语种
- 避免 AI 腔："在当今时代""值得注意的是""综上所述"
- 话题之间用 `---` 分隔

### 2.5 写入文件

逐条追加写入 `feeds/YYYY-MM-DD/hackernews-hot-HH-MM.md`（HH-MM 为生成时刻的时-分）。

首次写入先写 YAML frontmatter 和文件头：

```markdown
---
title: "Hacker News 日报 — YYYY-MM-DD"
date: YYYY-MM-DD
generated_at: "YYYY-MM-DDTHH:MM:SSZ"
stories_count: 12
comments_count: 95
model: "model-name"
---

> 数据来源：[Hacker News](https://news.ycombinator.com) · 生成于 YYYY-MM-DD HH:MM UTC

---
```

```

后续每条话题章节追加到文件末尾。

### 2.6 收尾

- 验证文件存在且 > 1KB
- 无需删除数据库（`feeds/.cache/hn.db` 持续累积，供跨天查询）

---

## 边界

| 情况 | 处理 |
|------|------|
| `content` 为空或 `[FETCH_FAILED]` | 先尝试补抓；仍失败则基于标题 + 评论总结 |
| 某故事无评论 | 亮点区标注"暂无热门文章" |
| `daily_picks` 为空 | 先确保 `fetch.py` 已成功 |
| 日报文件已存在 | 读取已有话题的 HN 链接，跳过已完成条目 |
| 标题含单引号 | SQL 中转义为 `''` |

## 数据目录

```
feeds/
├── .cache/
│   └── hn.db                  # SQLite（持续累积）
├── 2026-04-27/
│   └── hackernews-hot-19-22.md
└── 2026-04-28/
    └── hackernews-hot-09-01.md
```

## 跨天

```sql
-- 哪些故事多次入选
SELECT s.id, s.title, GROUP_CONCAT(dp.date) dates
FROM stories s JOIN daily_picks dp ON s.id = dp.story_id
GROUP BY s.id HAVING COUNT(*) > 1;

-- 某故事的入选历史
SELECT dp.date, dp.rank FROM daily_picks dp WHERE dp.story_id = ? ORDER BY dp.date;
```
