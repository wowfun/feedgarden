---
publish: true
content_type: "post"
title: "Once：为命令行输出提供短期缓存的 CLI 工具"
description: "once 是一个小型 Go 命令行工具：它在当前目录执行命令、打印其 stdout，并把输出保存在内存中，由一个每用户的后台守护进程托管。相同命令、目录和租户键的重复调用会直接从内存返回结果，直到条目过期；当最后一个条目过期后，守护进程会自行退出。 作者给出的典型用途是减少重复的密钥授权：README 中的示例用 `op read` 从 1Password 读取令牌，因此第一次调用需要指纹确认，而在 TTL 内的后续调用则不需要。用法为 `once --ttl DURATIO"
date: "2026-10-09T09:43:06.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/alex0ptr/once"
discussion_url: "https://news.ycombinator.com/item?id=50018239"
tags: ["source/hackernews","topics/coding","topics/security-privacy","topics/open-source"]
---

## 正文提炼

once 是一个小型 Go 命令行工具：它在当前目录执行命令、打印其 stdout，并把输出保存在内存中，由一个每用户的后台守护进程托管。相同命令、目录和租户键的重复调用会直接从内存返回结果，直到条目过期；当最后一个条目过期后，守护进程会自行退出。

作者给出的典型用途是减少重复的密钥授权：README 中的示例用 &#96;op read&#96; 从 1Password 读取令牌，因此第一次调用需要指纹确认，而在 TTL 内的后续调用则不需要。用法为 &#96;once --ttl DURATION &#91;--until TIME&#93; &#91;--tenant KEY&#93; &#91;--refresh&#93; &#91;--no-dir&#93; -- COMMAND &#91;ARGS...&#93;&#96;，通过 &#96;go install github.com/alex0ptr/once@latest&#96; 安装（需 Go 1.27+，除标准库外无依赖，仅支持 macOS 和 Linux）。&#96;--&#96; 之后的内容会直接执行、不经过 shell，因此管道和通配符需要自行用 &#96;sh -c&#96; 包裹。

只有 stdout 会被缓存，stdin 和 stderr 直接透传，交互式提示仍可正常工作。以非零状态退出的命令结果从不缓存，退出码会原样传递。默认情况下工作目录是缓存键的一部分，因为 &#96;git rev-parse HEAD&#96; 之类的命令在不同目录下输出不同；&#96;--no-dir&#96; 会去掉目录，带与不带该选项创建的条目彼此独立。&#96;--until&#96; 设置绝对截止时间，条目以 &#96;--ttl&#96; 和 &#96;--until&#96; 中先到者为准过期；工具本身不计算相对日期，需要由 shell 提供。若 &#96;--until&#96; 已经过去，命令会正常执行但结果不缓存。缓存键是 HMAC-SHA256&#40;租户, 工作目录 ‖ 命令 ‖ 参数&#41;。作者说明租户键只是命名空间而非安全边界，也不要求保密。&#96;once status&#96; 显示守护进程和条目数量；&#96;once clear&#96; 清除全部缓存并停止守护进程。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

不少评论集中在 1Password 这个例子上。ShakataGaNai 表示读取密钥的场景最打动他，并描述了在智能体驱动测试时反复批准凭据访问的挫败感，还承认曾让智能体把凭据写进 .env 文件以省去每次批准；作者 alex0ptr 回复说，此前担心没人有类似的工作流。另一些人对比了既有工具：aktau 提到自己写的 shell 脚本工具 memo，指出它无需编译，会把输出压缩后存放在 /tmp，而 once 把缓存放在运行中的守护进程里，并认为两者的取舍涉及安全考量。thomascountz 说自己每天都在用那个脚本，并从其设计中有所收获。&#95;&#95;MatrixMan&#95;&#95; 希望能有应用暴露足够的元数据，让操作系统自行判断是否需要重跑，并以 NixOS 的构建为例，指出这种能力尚未推广到任意进程；jchw 则认为许多场景可以在不同程度上硬套进 Nix 构建系统。deadbunny 则调侃终于能在终端里处理缓存失效了。

评论来源：[ShakataGaNai](https://news.ycombinator.com/item?id=50024528) · [alex0ptr](https://news.ycombinator.com/item?id=50025257) · [aktau](https://news.ycombinator.com/item?id=50019267) · [thomascountz](https://news.ycombinator.com/item?id=50022081) · [&#95;&#95;MatrixMan&#95;&#95;](https://news.ycombinator.com/item?id=50020663) · [deadbunny](https://news.ycombinator.com/item?id=50019198)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50018239>)
