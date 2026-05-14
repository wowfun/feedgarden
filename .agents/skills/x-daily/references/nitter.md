# Nitter RSS 参考

[Nitter](https://github.com/zedeus/nitter) 是 Twitter/X 的替代前端，提供无需登录的公开推文浏览和 RSS 订阅。

## RSS 端点

```
GET https://<nitter-instance>/<username>/rss
```

返回 RSS 2.0 格式，包含该用户最近的公开推文（通常 ~20 条）。

## 公共实例

| 实例 | URL | 状态 |
|------|-----|------|
| nitter.net | `https://nitter.net` | 主实例，可能限流或返回 404 对某些账号 |
| nitter.poast.org | `https://nitter.poast.org` | 备用 |
| nitter.privacydev.net | `https://nitter.privacydev.net` | 备用 |

> **xcancel.com** 是 Nitter 替代品但需邮件白名单审批，未审批前返回占位 RSS（标题 "RSS reader not yet whitelisted!"），不建议在此脚本中使用。

更多实例可在 [Nitter Wiki](https://github.com/zedeus/nitter/wiki/Instances) 查找。
另可访问 [https://status.d420.de/](https://status.d420.de/) 查看 Nitter 实例运行状态。

> 注意：Nitter 实例可能因 Twitter/X 政策变动而不可用。建议在 `config/users.json` 中配置多个实例做故障转移。部分账号可能在特定实例上不可用（返回 404）。

## RSS 字段

### channel

| 字段 | 示例 | 说明 |
|------|------|------|
| `title` | `Sam Altman / @sama` | 显示名 + handle，可用于提取显示名 |
| `link` | `https://nitter.net/sama` | Nitter 用户页面 |
| `description` | `Twitter feed for Sam Altman` | 描述 |

### item（每条推文）

| 字段 | 示例 | 说明 |
|------|------|------|
| `guid` | `https://nitter.net/sama/status/123456#m` | 推文唯一 ID（可从中提取数字 ID） |
| `link` | `https://nitter.net/sama/status/123456` | 推文链接 |
| `description` | `<CDATA>推文正文（含 HTML）</CDATA>` | 推文内容，HTML 格式（`<br>` 换行，`<a>` 链接） |
| `pubDate` | `Sun, 27 Apr 2026 14:30:00 GMT` | 发布时间（RFC 822 格式） |
| `dc:creator` | `@sama` | 发布者 |

## 限制

- **无互动数据**：RSS 不包含 like、retweet、reply 数量
- **无引用关系**：不包含 quote tweet 信息
- **无媒体**：不包含图片/视频 URL 或 alt text
- **数量有限**：每个用户通常只返回最近 ~20 条推文
- **时效性**：Nitter 实例更新频率不确定，可能延迟数小时

## 推文正文处理

RSS `description` 中的推文正文为 HTML，需清洗为纯文本：

- `<br>` / `<br/>` → 换行
- `<a href="url">text</a>` → `text (url)`
- `<` `>` `&` → 对应字符
- `&rsquo;` `&ldquo;` 等 HTML 实体 → 对应 Unicode 字符
- 开头的 `RT by @user:` → 表示该推文为转推

## 用到的 HTTP 头

```python
User-Agent: x-daily-fetch/1.0
```
