---
publish: true
content_type: "post"
title: "Claude 编写的浏览器扩展：把蜘蛛、章鱼或史莱姆投到任意网页上"
description: "一位开发者发布了一款免费、开源的浏览器扩展，可以把蜘蛛、章鱼或史莱姆放到任意网页上。这只生物会去“捕捉”用户指定的链接，并把其余的链接用丝、墨或黏液包裹起来。全部代码由 Claude 编写，采用纯 Manifest V3，无需构建步骤。 随后该扩展被用 Playwright 加载进真实的 Chromium 中进行测量。据其报告：行走时脚和触须末端的偏移为 0 像素；“Jev”在测试页面上抓到了 6/6 个蜘蛛链接，并包裹了 2/2 个诱饵链接；在三只生物、霓虹与 8-bit "
date: "2026-10-09T07:02:16.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1ekpl/i_had_claude_build_a_browser_extension_that_drops/"
tags: ["source/reddit","topics/coding","topics/products"]
---

一位开发者发布了一款免费、开源的浏览器扩展，可以把蜘蛛、章鱼或史莱姆放到任意网页上。这只生物会去“捕捉”用户指定的链接，并把其余的链接用丝、墨或黏液包裹起来。全部代码由 Claude 编写，采用纯 Manifest V3，无需构建步骤。

随后该扩展被用 Playwright 加载进真实的 Chromium 中进行测量。据其报告：行走时脚和触须末端的偏移为 0 像素；“Jev”在测试页面上抓到了 6/6 个蜘蛛链接，并包裹了 2/2 个诱饵链接；在三只生物、霓虹与 8-bit 两种风格、桌面与移动端两种布局的组合下，控制台错误为零。第一版的腿只是简单摆动时，作者把参考推文发给 Claude，它抓取了视频、抽取帧，并用反向运动学重写了腿部逻辑。

安装需要手动操作：从 Releases 下载 zip，解压，打开 chrome&#58;//extensions，开启开发者模式并选择“加载已解压的扩展程序”。它可在 Chrome、Edge 和 Brave 中使用。如果使用 Jev 密钥，密钥保存在 chrome.storage.local 中，只会发送给用户自行选择的服务商；OpenCode Zen 提供免费额度，可在不付费的情况下试用 AI 判断功能。作者欢迎提交皮肤相关的 PR，并询问接下来该添加哪种生物。

## 图片与视频

- [图片: I had Claude build a browser extension that drops a spider, octopus or slime onto any web page. It hunts the links you ask for and wraps the rest in silk, ink or goo &#40;free, open source&#41;](<https://external-preview.redd.it/dnR2NWh3OGg0ZXVoMRkD9J3i3cyf-msbel0gagb5h0rxsJ_5qROyDWPmS4A3.png?width=640&crop=smart&auto=webp&s=e9664e39348e763aa444f09fc359d1a1a89fa7ae>)
