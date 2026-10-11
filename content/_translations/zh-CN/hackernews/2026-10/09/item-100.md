---
publish: true
content_type: "post"
title: "用惰性导入加速 Python 启动"
description: "Python 程序启动时通常要导入全部依赖。即将发布的新版 Python 支持惰性导入（lazy import），只需在 import 语句前加上 lazy 关键字，此时 json 这样的名字不再是模块，而只是一个占位对象。真正的导入只在首次使用该名字时发生；如果始终不用，模块就永远不会被加载。 作者用一个玩具命令行工具测量了效果。该工具导入十六个模块：json、csv、decimal、sqlite3、asyncio、email.parser、http.client、urll"
date: "2026-10-09T03:16:39.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://lemire.me/blog/2026/10/09/faster-python-startup-with-lazy-imports/"
discussion_url: "https://news.ycombinator.com/item?id=50015571"
tags: ["source/hackernews","topics/coding","topics/inference","topics/evaluation"]
---

## 正文提炼

Python 程序启动时通常要导入全部依赖。即将发布的新版 Python 支持惰性导入（lazy import），只需在 import 语句前加上 lazy 关键字，此时 json 这样的名字不再是模块，而只是一个占位对象。真正的导入只在首次使用该名字时发生；如果始终不用，模块就永远不会被加载。

作者用一个玩具命令行工具测量了效果。该工具导入十六个模块：json、csv、decimal、sqlite3、asyncio、email.parser、http.client、urllib.request、xml.etree.ElementTree、zipfile、tarfile、statistics，以及 numpy、pandas、requests、rich 等第三方包。工具有三条路径：--version 只打印字符串，mean 用 csv 模块读取一个小 CSV 文件并调用 statistics.fmean，stats 用 pandas 加载同一文件并打印摘要。惰性版本唯一的区别是每行 import 前多了一个词。

在 Python 3.15.0b4、Intel Xeon Gold 6548N（Emerald Rapids）、numpy 2.5、pandas 3.0、requests 2.34 的环境下，测得结果如下：

- --version：急切实 295 ms，惰性 20 ms，约 15 倍加速。
- mean：296 ms 对 24 ms，约 12 倍。
- stats：299 ms 对 224 ms，仅 1.3 倍。

扣除 11.7 ms 的解释器启动开销后，--version 的导入成本从 283 ms 降到约 8 ms，约减少 35 倍。也就是说，实际用到的模块越少，收益越大；当某条路径确实需要大部分模块时，收益很小。

作者也指出代价：错误的位置发生了移动。急切导入时缺失模块会在启动时失败；惰性导入时则推迟到首次使用，可能深藏在函数内部，也可能在长时间运行的服务里几小时后才暴露。作者同时公开了源码。

## HN 热门讨论

根据 1 条选取的评论与回复整理。

一位评论者（EdwardDiego）提出缓解延迟失败风险的实际做法：像 Mypy 或 ty 这样的检查工具应当仍能发现 venv 中并不存在的库，而单元测试可以覆盖所有代码分支。这一观点是作为弥补手段提出的，并非否认文中所报告的启动加速。

评论来源：[EdwardDiego](https://news.ycombinator.com/item?id=50015834)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50015571>)

## 图片与视频

- [图片: Eager imports take about 300 ms. Lazy imports take 20 ms for --version, 24 ms for mean, and 224 ms for stats.](<https://lemire.me/blog/wp-content/uploads/2026/10/lazy-startup.webp>)
