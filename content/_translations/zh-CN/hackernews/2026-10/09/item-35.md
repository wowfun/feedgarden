---
publish: true
content_type: "post"
title: "ArtCraft 的“氛围编程”应用对 Adobe 意味着什么"
description: "作者是一位长期使用创意软件的用户，描述了自己与 Adobe 关系不断恶化的过程：公司无视 Mac 的设计惯例，把订阅变成唯一现实选择，持续涨价，并把服务重心转向每年购买数百个许可的客户。大量高级用户转向 Linux，却基本被忽视；Adobe 的许多 AI 功能也常常违背创意人的意愿推出。 这一背景解释了 ArtCraft 的吸引力：它是一个用“氛围编程”方式、以净室方法重建 Creative Cloud 全套应用的开源项目。应用名称陌生，但对应关系清晰——分别对标 Photo"
date: "2026-10-08T18:44:29.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://tedium.co/2026/10/08/artcraft-vibe-coding-creative-cloud-remake/"
discussion_url: "https://news.ycombinator.com/item?id=50010170"
tags: ["source/hackernews","topics/products","topics/coding"]
---

## 正文提炼

作者是一位长期使用创意软件的用户，描述了自己与 Adobe 关系不断恶化的过程：公司无视 Mac 的设计惯例，把订阅变成唯一现实选择，持续涨价，并把服务重心转向每年购买数百个许可的客户。大量高级用户转向 Linux，却基本被忽视；Adobe 的许多 AI 功能也常常违背创意人的意愿推出。

这一背景解释了 ArtCraft 的吸引力：它是一个用“氛围编程”方式、以净室方法重建 Creative Cloud 全套应用的开源项目。应用名称陌生，但对应关系清晰——分别对标 Photoshop、Premiere Pro、Acrobat，甚至还有 InDesign 的替代品。用 Rust 编写、以 AppImage 分发，启动快、体积小，占用从数百兆降到数十兆；立即识别出作者的独立显卡，几分钟内就能编辑图片。

粗糙之处依然存在：取色器和二级菜单不够精致；DesignCraft 直到安装了数分钟前刚发布的更新才识别出作者的字体；PhotoCraft 支持十六进制颜色输入，DesignCraft 却不支持。尽管如此，作者仍觉得足够熟悉，可以想象用它做一本 zine，或打开那些不订阅就无法访问的旧文件，并指出项目迭代非常快。

作者认为，即使不喜欢 AI，这类项目也值得支持：它们回应了针对 Adobe 长期存在的伦理与经济抱怨，其摸索出的技术也可能反哺更注重工艺的开源项目。他同时提出保留意见：认为以“craft（工艺）”为这个项目命名并不合适，因为该词暗示投入了大量心血，而当前版本还未能体现这一点。原文摘录在此处中断。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

- 一位评论者认为这些克隆应用不值得欢呼，因为它们“抽走了开源生态的氧气”，而 GIMP、Photopea、FreeCAD 等更可信的项目需要这些资源；有人反驳这一说法，指出 Photopea 其实是专有软件，并称当前版本确实不太好用，但给足时间和 token 仍有改进空间，同时反问 GIMP 已有几十年时间为何仍难获认可。
- 另有评论者把该项目视为值得关注的实验：能否用纯粹的“氛围编程”构建大型应用，以及由此产生的架构腐化会比人类设计的架构更好还是更糟——人类架构同样会腐化。他认为目前证据偏向“做不到”，但实验尚未结束。
- 关于工具能力的边界，有评论者表示让大模型产出完整可用的产品很难，最好也就六成把握，加上各种技巧可到约七成五至八成，并提到自己使用较便宜的中国模型和美国实验室的 20 美元套餐。有人回复称严格规格说明也没用，因为规格越细需要的上下文越多，模型无法遵守；只有把规格写成测试才可靠，而写测试本身仍是编程，需要对代码与架构有细致理解。
- 还有评论者称该项目属于“雾件”，认为作者大力宣传，但功能与 Adobe 相差甚远。样本很小，并不具备代表性。

评论来源：[liuliu](https://news.ycombinator.com/item?id=50011123) · [rpdillon](https://news.ycombinator.com/item?id=50011232) · [rerdavies](https://news.ycombinator.com/item?id=50012274) · [getcrunk](https://news.ycombinator.com/item?id=50011146) · [anonymous908213](https://news.ycombinator.com/item?id=50011206) · [sneak](https://news.ycombinator.com/item?id=50010589)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50010170>)

## 图片与视频

- [图片: Here’s how fast this project is moving. When I initially started messing around with this, it didn’t show my list of fonts. I then went to the GitHub page for DesignCraft, downloaded a new version that had just been released, and all of a s](<https://proxy.tedium.co/TlsUZ3Z1kth_BJ5g-VEEG3t-hJE=/1014x1001/filters:quality(80)/uploads/screenshot_2026-10-08_10-57-55.png>)
