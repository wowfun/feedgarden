---
name: x-daily
description: 获取 X (Twitter) 每日推文动态（无需 API Token）。通过 Nitter RSS 抓取数据并存入 SQLite，由 Agent 分析撰写日报。
---

# X Daily

获取 X (Twitter) 关注账号的每日推文动态。工作分为两阶段：`scripts/fetch.py` 通过 Nitter RSS 完成所有确定性抓取（无需 API Token），Agent 负责分析撰写。

## 技能目录结构

```
x-daily/
├── SKILL.md                     # 本文件
├── config/
│   └── users.json               # 追踪账号列表 & Nitter 实例配置
├── scripts/
│   └── fetch.py                 # 确定性：Nitter RSS + SQLite
└── references/
    └── nitter.md                 # Nitter RSS 参考
```

## 触发条件

- 用户要求获取 X/Twitter 日报 / 推文动态
- 用户已运行 `fetch.py` 并要求继续分析撰写日报

---

## 阶段 1：运行 fetch.py

从项目根目录用 skill 的实际安装路径运行：

```bash
python /path/to/x-daily/scripts/fetch.py
```

如果当前工作目录不是项目根目录，显式传入项目根：

```bash
python /path/to/x-daily/scripts/fetch.py --project /path/to/project
```

`fetch.py` 完成以下操作：

1. 读取 skill 目录内的 `config/users.json` 获取追踪账号列表
2. 对每个账号，依次尝试配置的 Nitter 实例拉取 RSS
3. 解析 RSS XML，提取推文（ID、正文、时间、链接）
4. 按日期筛选今日推文，写入已有 `feeds/.cache/x.db`（三表：users / tweets / daily_picks）
5. RSS 无法获取 like/retweet/reply 计数，均填 0

数据库已就绪，进入阶段 2。

---

## 阶段 2：Agent 分析 & 撰写

### 2.1 检查 fetch.py 输出

关注打印行：如果 `daily_picks: 0`，说明今日无推文，检查网络或 Nitter 实例可用性。

同时注意 `⚠` 标记的账号，这些是所有 Nitter 实例均失败的账号。

### 2.2 清洗推文正文

RSS 中的推文正文保留 HTML 标签（`<br>`、`<a>`），Agent 须用 `strip_html()` 逻辑清洗为纯文本后方可阅读分析。

### 2.3 查询今日数据

```sql
SELECT t.id, t.user_id, u.name, u.handle, t.text, t.created_at, t.url, dp.rank
FROM tweets t
JOIN users u ON t.user_id = u.id
JOIN daily_picks dp ON t.id = dp.tweet_id
WHERE dp.date = 'YYYY-MM-DD'
ORDER BY u.id, t.created_at;
```

统计信息：

```
users_count ← SELECT COUNT(DISTINCT t.user_id) FROM daily_picks dp JOIN tweets t ON dp.tweet_id = t.id WHERE dp.date = ?
tweets_count ← SELECT COUNT(*) FROM daily_picks WHERE date = ?
model ← 当前 AI 模型名称
generated_at ← 当前 UTC 时间（ISO 8601 格式）
```

### 2.4 撰写章节

#### 统一汇总（文件头之后紧接）

按 config/users.json 顺序，将有推文的账号和其余账号分开。在文件头 `---` 分隔线之后，先输出汇总段落：

```markdown
**今日有推文的账号：** @gdb (1), @simonw (3)

**今日暂无推文的账号：** @sama, @karpathy, @JeffDean, @_akhaliq, @ylecun, @fchollet, @aidan_mclau, @steipete

**抓取失败的账号：** @kaboroeconomics
```

规则：
- "暂无推文"行列出当天 RSS 返回 0 条的账号
- "抓取失败"行列出所有 Nitter 实例均失败的账号（fetch.py 输出含 `⚠` 标记）。若全部成功，省略此行
- "有推文"行列出当天至少有 1 条推文的账号，标注数量。若无任何推文，仅保留汇总、不生成后续章节
- 三类之间空行分隔
- 按 config/users.json 顺序排列，而非字母序

#### 各账号章节

仅为有推文的账号输出独立的 `##` 标题章节，排序与 config/users.json 一致：

```markdown
## 显示名 (@handle)

tweets: N

- [中文提炼推文核心内容，1-2 句]
  - raw: 英文原文（不含双引号）
  - time: YYYY-MM-DD HH:MM
  - url: https://twitter.com/handle/status/{id}

- [中文提炼推文核心内容，1-2 句]
  - raw: 英文原文（不含双引号）
  - time: YYYY-MM-DD HH:MM
  - url: https://twitter.com/handle/status/{id}
```

#### 章节规则

- 仅为有推文的账号创建 `##` 章节，排序与 config/users.json 一致
- 账号小标题格式：`显示名 (@handle)`
- 标题下紧跟 `tweets: N` 标明该账号今日推文数
- 每条推文以列表项 `- 中文摘要` 开头，缩进子项标注 `raw`、`time`、`url`
- `raw` 保留英文原文，不含双引号
- `time` 格式 `YYYY-MM-DD HH:MM`（UTC）
- URL 使用 `https://twitter.com/{handle}/status/{tweet_id}` 格式
- 避免 AI 腔："在当今时代""值得注意的是""综上所述"
- 正文用中文，链接/项目名保留原文
- 账号之间用 `---` 分隔
- 纯转推/灌水推文可忽略不写

### 2.5 写入文件

写入 `feeds/YYYY-MM-DD/x-hot-HH-MM.md`（HH-MM 为生成时刻的时-分，UTC）。

先写 YAML frontmatter 和文件头：

```markdown
---
title: "X 日报 — YYYY-MM-DD"
date: YYYY-MM-DD
generated_at: "YYYY-MM-DDTHH:MM:SSZ"
tweets_count: 42
users_count: 8
model: "model-name"
---

> 数据来源：X (Twitter) 公开推文 via Nitter RSS · 生成于 YYYY-MM-DD HH:MM UTC
> 追踪账号：@{handle1}, @{handle2}, ...

**今日有推文的账号：** ...

**今日暂无推文的账号：** ...

**抓取失败的账号：** ...（仅在有失败时出现）

---
```

然后在 `---` 分隔线之后，逐个写入有推文账号的章节。

### 2.6 收尾

- 验证文件存在且 > 1KB
- 无需删除数据库（`feeds/.cache/x.db` 持续累积，供跨天查询）

---

## 边界

| 情况 | 处理 |
|------|------|
| `daily_picks` 为空 | 检查 fetch.py 输出，确认网络或实例可用 |
| 某账号今日无推文 | 列入顶部"今日暂无推文"汇总行，不创建章节 |
| 某账号抓取失败 | 列入顶部"抓取失败"汇总行（仅在 `⚠` 标记时） |
| 推文正文仍含 HTML | Agent 清洗为纯文本后再分析 |
| Nitter 实例全部不可用 | 更新 `config/users.json` 中 `nitter_instances` 列表 |
| 日报文件已存在 | 读取已有内容，跳过已完成条目 |
| 推文正文含单引号 | SQL 中转义为 `''` |

## 数据目录

```
feeds/
├── .cache/
│   ├── hn.db                  # HN SQLite（持续累积）
│   └── x.db                   # X SQLite（持续累积）
├── 2026-04-27/
│   ├── hackernews-hot-19-22.md
│   └── x-hot-09-01.md
└── 2026-04-28/
    └── x-hot-09-01.md
```

## 跨天

```sql
-- 某用户累计推文数
SELECT u.handle, COUNT(*) cnt FROM tweets t JOIN users u ON t.user_id = u.id GROUP BY t.user_id ORDER BY cnt DESC;

-- 某话题多次出现（按关键词搜索）
SELECT t.id, t.text, GROUP_CONCAT(dp.date) dates FROM tweets t JOIN daily_picks dp ON t.id = dp.tweet_id WHERE t.text LIKE '%关键词%' GROUP BY t.id HAVING COUNT(*) > 1;
```
