---
publish: true
content_type: "post"
title: "用 SystemVerilog 制作 VGA 驱动"
description: "唯一一位评论者回忆起一个类似的课程项目：在 Digital Design II 课上，团队必须在不使用帧缓冲的情况下驱动 VGA 显示，评论者指出用帧缓冲“太容易了”。他们改为搭建逻辑电路来显示棋盘和一个以位图呈现的棋子，并通过输入移动棋子。Cyclone FPGA 板载的 ARM 处理器运行 Linux，其中的 C 程序把棋盘位置发送给该棋盘逻辑电路。评论者形容这个过程很难、自己也挣扎了一阵，但最终做通了。"
date: "2026-10-20T16:00:15.000Z"
updated: "2026-10-20T17:26:05.173Z"
first_seen: "2026-10-20T17:16:18.208Z"
date_basis: "published"
source_url: "https://lukaswerner.com/post/2026-10-20@bottom-up-vga"
discussion_url: "https://news.ycombinator.com/item?id=50168376"
tags: ["source/hackernews","topics/hardware","topics/coding"]
---

## HN 热门讨论

根据 1 条选取的评论与回复整理。

唯一一位评论者回忆起一个类似的课程项目：在 Digital Design II 课上，团队必须在不使用帧缓冲的情况下驱动 VGA 显示，评论者指出用帧缓冲“太容易了”。他们改为搭建逻辑电路来显示棋盘和一个以位图呈现的棋子，并通过输入移动棋子。Cyclone FPGA 板载的 ARM 处理器运行 Linux，其中的 C 程序把棋盘位置发送给该棋盘逻辑电路。评论者形容这个过程很难、自己也挣扎了一阵，但最终做通了。

评论来源：[wildzzz](https://news.ycombinator.com/item?id=50169550)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50168376>)
