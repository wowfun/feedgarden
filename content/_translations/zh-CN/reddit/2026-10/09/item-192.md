---
publish: true
content_type: "post"
title: "Hermie：让 API 密钥不进入 Claude Code 上下文的本地代理"
description: "作者开发了 Hermie，一个位于 Claude Code 与 API 之间的小型本地代理，用来避免每次都按 Claude Code 的要求打开 IDE、把 API 密钥复制进 env 文件的繁琐流程。 其机制是占位符替换：请求离开本机之前，Hermie 把真实密钥换成占位符；Claude 在 Write 调用里写下的是这个占位符，请求回传时 Hermie 再把真实值换回工具调用中，最终真实密钥落入 .env 文件。作者称云端只见到占位符，并说保存下来的请求体可以证明这一点。"
date: "2026-10-09T07:11:06.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1eprb/now_i_can_write_my_api_key_in_claude_code_without/"
tags: ["source/reddit","topics/security-privacy","topics/coding"]
---

作者开发了 Hermie，一个位于 Claude Code 与 API 之间的小型本地代理，用来避免每次都按 Claude Code 的要求打开 IDE、把 API 密钥复制进 env 文件的繁琐流程。

其机制是占位符替换：请求离开本机之前，Hermie 把真实密钥换成占位符；Claude 在 Write 调用里写下的是这个占位符，请求回传时 Hermie 再把真实值换回工具调用中，最终真实密钥落入 .env 文件。作者称云端只见到占位符，并说保存下来的请求体可以证明这一点。

Hermie 的 install-hooks 命令还会让 Claude Code 在每次发生替换时打印一行提示，从而让这一行为可被观察而不必仅凭信任；作者用一张 GIF 演示了效果。项目已发布在 GitHub 上。作者特别希望得到反馈：Hermie 还漏掉了哪些密钥格式或客户端。

## 图片与视频

- [图片: Now I can write my api key in Claude Code without let Claude know it.](<https://preview.redd.it/8pgo7a6u4euh1.gif?width=640&crop=smart&s=d0382537e96cd8fb5d63599aabc295b6a2910382>)
