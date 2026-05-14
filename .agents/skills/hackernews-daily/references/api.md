# Hacker News Firebase API 参考

Hacker News 通过 [Firebase API](https://github.com/HackerNews/API) 提供免费的只读公开接口。

## 基础 URL

```
https://hacker-news.firebaseio.com/v0/
```

## 端点

### 获取热门 / 最新 / 最佳故事 ID

```
GET /v0/topstories.json     → [27178, 27177, ...]  （最多 500 条）
GET /v0/newstories.json     → [...]                  （最多 500 条）
GET /v0/beststories.json    → [...]                  （最多 500 条）
GET /v0/askstories.json     → [...]                  （Ask HN）
GET /v0/showstories.json    → [...]                  （Show HN）
GET /v0/jobstories.json     → [...]                  （Job 帖子）
```

### 获取条目详情

```
GET /v0/item/{id}.json
```

## 条目字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int | 条目 ID |
| `deleted` | bool | 是否已删除 |
| `type` | string | `job`, `story`, `comment`, `poll`, `pollopt` |
| `by` | string | 作者用户名 |
| `time` | int | Unix 时间戳 |
| `text` | string | HTML 正文（评论 / Ask HN 等） |
| `dead` | bool | 是否已 dead |
| `parent` | int | 父条目 ID（评论用） |
| `poll` | int | 关联的 poll ID（pollopt 用） |
| `kids` | array[int] | 子评论 / 子条目 ID 列表 |
| `url` | string | 外链 URL（story 类型） |
| `score` | int | 得分 |
| `title` | string | 标题 |
| `parts` | array[int] | poll 选项 ID 列表 |
| `descendants` | int | 评论总数（story 类型） |

## 常用查询模式

### 获取今日热门 + 评论

```bash
# 1. 获取热门 ID 列表
IDS=$(curl -s "https://hacker-news.firebaseio.com/v0/topstories.json" | jq '.[0:30] | .[]')
echo "$IDS" | head -30

# 2. 获取单条详情
curl -s "https://hacker-news.firebaseio.com/v0/item/47914165.json" | jq '{id, title, url, score, descendants}'

# 3. 获取评论
curl -s "https://hacker-news.firebaseio.com/v0/item/47915397.json" | jq '{by, text, time}'
```

## 速率限制

- 无官方速率限制文档，实测约 10 请求 / 秒为安全水位
- firebaseio.com 对突发大量请求会返回 429
- 建议在批量请求之间添加 100ms 间隔

## 注意事项

- 所有时间戳为 Unix 时间（秒）
- 评论正文为 HTML，需自行处理（`<p>` 标签、`&gt;` 等实体）
- 已删除条目的 `deleted` 为 `true`，大部分字段会缺失
- `kids` 只包含直接子评论，不包含嵌套孙子评论
