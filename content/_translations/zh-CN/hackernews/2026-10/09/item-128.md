---
publish: true
content_type: "post"
title: "Deno 加入 Cloudflare"
description: "据一篇署名 Ry Dahl 的文章，整个 Deno 团队将加入 Cloudflare。作者给出的理由是 Deno 运行时的演进路径：从 Deno 到 Deno Deploy，再到 celld——一个基于 Cloudflare Workers 编程模型、以 Durable Objects 为核心的系统。他写道，目标是让这套编程模型成为构建服务器的默认方式，既可运行在 Cloudflare 的网络上，也可运行在开发者自有的基础设施上。文中提到，对 Node.js 的兼容性和..."
date: "2026-10-09T13:03:48.000Z"
updated: "2026-10-10T05:10:37.706Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://deno.com/blog/cloudflare"
discussion_url: "https://news.ycombinator.com/item?id=50019911"
tags: ["source/hackernews","topics/coding","topics/open-source","topics/industry"]
---

## 正文提炼

据一篇署名 Ry Dahl 的文章，整个 Deno 团队将加入 Cloudflare。作者给出的理由是 Deno 运行时的演进路径：从 Deno 到 Deno Deploy，再到 celld——一个基于 Cloudflare Workers 编程模型、以 Durable Objects 为核心的系统。他写道，目标是让这套编程模型成为构建服务器的默认方式，既可运行在 Cloudflare 的网络上，也可运行在开发者自有的基础设施上。文中提到，对 Node.js 的兼容性和完整的工具链，与运行时本身一样，都是早期的重要方向。

公告也明确列出了对现有用户的具体影响：

- Deno 运行时将继续支持一年，期间按月发布包含缺陷修复和安全更新的版本；一年后停止该运行时的开发。Deno 仍将保持开源，欢迎其他人继续开发。
- Deno Deploy 将继续运营六个月后关停，付费客户迁移到 Cloudflare Workers 时将获得迁移支持。
- JSR 将继续运营，其基础设施迁移到 Cloudflare。
- rusty&#95;v8 将继续维护，并推进将其集成进 workerd。

Dahl 表示，AI 让更好的抽象变得尤为迫切，他认为 Durable Objects 把低成本的无服务器执行、持久化状态、WebSocket 和高层 JavaScript 接口结合在一起，非常适合智能体运行框架。他提到 celld 以 Durable Objects 为核心，并引用了与 Kenton Varda 共同在 Cloudflare 博客发布的文章，同时邀请大规模构建智能体、希望在自有基础设施上运行的人与他联系。

文章承认这一变化对基于 Deno 构建的人影响重大，并感谢贡献代码者、在其上做业务的公司以及报告问题的人。作者把该决定描述为选择把精力聚焦于何处：未来开发将投入共享平台，而不是继续维护一个独立的运行时与托管服务。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论集中在时间安排的实际含义上。一位评论者指出，除非有人接手，Deno 将不再获得支持；另一位称这一细节被埋在文章底部，并提到有些公司曾大规模从 Node.js 迁移，认为这正是追逐新工具的风险。

多位评论者讨论了 Deno 方向转变的原因。一位表示，当 npm 兼容性成为优先事项时自己的热情就消退了，认为 Deno 从简洁走向臃肿，不过早期 Deno 至少促使 Node 借鉴了部分特性。有回复不同意这一归因，认为真正的推动力是 Bun 凭借 npm 兼容性获得的高采用率，而非融资，并称正是融资才让“慢而稳”的策略成为可能。

也有人质疑这笔交易本身：有人问 Cloudflare 是想让这个团队转向其他优先级，还是想让 Deno 消亡，并疑惑既然 Workers 依赖 JS 运行时，投资 Deno 岂不更具战略意义。另有人建议用更直白的标题表述为“人才收购”，还有人列举一连串开发者工具收购，视为行业整合的证据。一位评论者对这一运行时表示惋惜，同时对 workerd 和 celld 这种更完整的可自托管后端表达兴趣，并指出此举使其他公司无法为 celld 而收购 Deno。

评论来源：[theodorejb](https://news.ycombinator.com/item?id=50020072) · [binlog](https://news.ycombinator.com/item?id=50020218) · [sholladay](https://news.ycombinator.com/item?id=50021907) · [carefulfungi](https://news.ycombinator.com/item?id=50022915) · [atif089](https://news.ycombinator.com/item?id=50023986) · [networked](https://news.ycombinator.com/item?id=50021206)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50019911>)
