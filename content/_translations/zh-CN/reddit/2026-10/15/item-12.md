---
publish: true
content_type: "post"
title: "我用 Claude Code 搭建了一个 MCP 服务器，让 Claude 能搜索并投递工作。以下是整个开发过程（以及可供借鉴之处）"
description: "作者此前发帖介绍过他用 Claude Code 开始搭建的求职平台，他说收到最多的问题是：能不能直接在 Claude 里面做这件事？于是团队又搭建了一个 MCP 服务器，同样主要用 Claude Code 完成。它在上周四上线，目前有 450 名用户、75 名日活。作者还报告说，自 X 上发布消息以来，每 100 名使用 autopilot 的付费订阅者带来 83 次面试。 它能做什么：添加该 MCP 后即可免费搜索职位数据库、上传简历查看匹配结果、获得定制简历，并在你..."
date: "2026-10-14T19:16:03.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:05:18.966Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x60bmf/i_built_an_mcp_server_with_claude_code_that_lets/"
tags: ["source/reddit","topics/agents","topics/coding","topics/products"]
---

作者此前发帖介绍过他用 Claude Code 开始搭建的求职平台，他说收到最多的问题是：能不能直接在 Claude 里面做这件事？于是团队又搭建了一个 MCP 服务器，同样主要用 Claude Code 完成。它在上周四上线，目前有 450 名用户、75 名日活。作者还报告说，自 X 上发布消息以来，每 100 名使用 autopilot 的付费订阅者带来 83 次面试。

它能做什么：添加该 MCP 后即可免费搜索职位数据库、上传简历查看匹配结果、获得定制简历，并在你确认后由后端在雇主自己的网站上提交申请。你还可以设置日程，让智能体每天给你推送新的匹配职位。他们每天抓取约 1.5 万个新职位。

他们用 Claude 搭建的方式，作者认为值得借鉴：

- 网页应用和 MCP 共用一份能力清单。Claude Code 构建了一个类型化的注册表，涵盖用户在网站上能做的一切。每个 MCP 工具都由该注册表生成，因此网页应用新增的功能会同步出现在 MCP 中。如果某项能力被刻意排除在 MCP 之外，代码必须写明原因，否则无法编译。
- 第 1 天就从一连串大型 PR 开始。作者写了一份交接文档，基于网页应用描述想要的服务器，Claude Code 把它拆成 12 个 PR，每个能力一个：搜索、申请准备、就绪检查、文档处理、提交、收件箱等等。每个 PR 都针对真实的 Postgres 运行集成测试。
- 用 OAuth 做一个托管版本。Claude Code 编写了 HTTP 服务器和一套 OAuth 2.1 登录流程（动态客户端注册与 PKCE），因此无需粘贴 API 密钥就能把它作为连接器添加到 claude.ai。关于可发现性，作者指出必须把连接器提交给 Anthropic 审批，才能出现在连接器库中。
- 弄清楚聊天界面里能做和不能做什么。他们需要把修改后的简历发给用户，同时保留 PDF 的排版。最终选择了一种有效期 10 分钟的下载链接，因为用于提高面试率的特殊排版，如果由本地智能体重写就无法保留。
- 重度自用（dogfood）。他们自己用这个连接器投递真实职位，写下 20 个感觉不对的地方，然后是 10 个、5 个、1 个、0 个。在自认为把 bug 清零之后，第一批深度用户又提出了 30 多项改动建议，目前均已实现。作者说，由于大语言模型具有概率性，你必须持续测试、迭代和修复；深度用户会遇到的、你完全没想到的场景数量惊人。

关于收费：职位搜索、新匹配通知、简历编辑以及许多其他功能都可通过 MCP 免费使用；只有自动投递功能开始收费，因为那部分 token 很贵。

## 媒体

![图片: I built an MCP server with Claude Code that lets Claude search and apply to jobs. Here’s how the build went &#40;and what you can learn&#41;](<https://external-preview.redd.it/aG53a3NhenljaHZoMVbsotEFYFzHUfwHlfPArts0mbbllCMKYJjr5sAoDp74.png?width=640&crop=smart&auto=webp&s=3b9f35c715871aa4fe11a1dd362636a794835dfa>)

[图片: I built an MCP server with Claude Code that lets Claude search and apply to jobs. Here’s how the build went &#40;and what you can learn&#41;](<https://external-preview.redd.it/aG53a3NhenljaHZoMVbsotEFYFzHUfwHlfPArts0mbbllCMKYJjr5sAoDp74.png?width=640&crop=smart&auto=webp&s=3b9f35c715871aa4fe11a1dd362636a794835dfa>)
