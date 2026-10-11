---
publish: true
content_type: "post"
title: "他自制“Flock 式”摄像头追踪警察，警方并不欢迎"
description: "加拿大 YouTuber Anthony Sistilli 自制了一台车牌识别设备，但拍摄对象不是普通司机，而是警车。他说这个项目的用意是反转商业监控网络 Flock 的逻辑。在为他 14 万订阅者发布两段短视频后，安大略省皮尔区警局的警员于 9 月 20 日到他家登门拜访。Sistilli 称这次会面大约持续 30 分钟，警方关注的是他的意图，以及他是否打算绘制追踪警察行踪的地图。警员提出，绘制警察行动地图可能危及警员安全，并可能帮到犯罪分子；他们还表示，警方自己的摄像头和"
date: "2026-10-09T01:16:13.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://san.com/cc/he-built-his-own-flock-style-camera-to-track-police-the-police-didnt-like-it/"
discussion_url: "https://news.ycombinator.com/item?id=50014792"
tags: ["source/hackernews","topics/security-privacy","topics/hardware","topics/industry"]
---

## 正文提炼

加拿大 YouTuber Anthony Sistilli 自制了一台车牌识别设备，但拍摄对象不是普通司机，而是警车。他说这个项目的用意是反转商业监控网络 Flock 的逻辑。在为他 14 万订阅者发布两段短视频后，安大略省皮尔区警局的警员于 9 月 20 日到他家登门拜访。Sistilli 称这次会面大约持续 30 分钟，警方关注的是他的意图，以及他是否打算绘制追踪警察行踪的地图。警员提出，绘制警察行动地图可能危及警员安全，并可能帮到犯罪分子；他们还表示，警方自己的摄像头和自动车牌识别（ALPR）技术并没有他所说的那么令人担忧。Sistilli 说，他的印象是这些警员并不了解美国国内许多相关争议和滥用案例。

他强调的差别在于系统架构。据估计 Flock 在 49 个州运营超过 12 万台设备；这些摄像头拍下每一辆经过车辆的车牌，把号码和其他细节汇入一个庞大的数据库，其他城市和州的执法机构往往都能查询，不论图像最初在哪里采集。相比之下，Sistilli 的设备只用一台相对便宜的亚马逊摄像头、他的笔记本电脑和机器学习软件。他说这套软件是他借助人工智能在大约 20 分钟内搭建的。软件实时扫描画面，寻找任何类似警车的目标，只有当它确信车辆属于执法部门时才会尝试读取车牌。他的手机提供 GPS 信息，照片、时间、地点和车牌都会存入数据库，之后可以在地图上查看。

目前的测试规模还很有限。Sistilli 先把摄像头对准电脑上警车与普通车辆的照片，随后带着装有便携电源的背包、打开的笔记本电脑和连接的摄像头，在一个警察建筑附近的路口站了一小时。他说设备识别到了大量普通车辆，却没看到警车，因为他选的是一处总部而不是实际执勤的警局。

Sistilli 对 Straight Arrow 表示，他从未打算建立一个追踪每名警察的庞大网络，现在也不想。他把目标描述为验证可行性，并用这种讽刺来说明这类监控意味着什么。关注度远超他的预期：他 9 月 4 日发布的第一段视频到 10 月在 YouTube 上已有超过 160 万次观看，在 Instagram 上有 52.3 万次观看。文章认为，这一事件说明，在坚称摄像头有助于抓捕罪犯的机构与担心其造就前所未有监控国家的民众之间，中间地带非常狭窄。

## 图片与视频

- [图片: Anthony Sistilli via YouTube](<https://san.com/wp-content/uploads/2026/10/sistilli-intersection.jpg?w=800>)
- [图片: Courtesy Anthony Sistilli](<https://san.com/wp-content/uploads/2026/10/sistilli-cop-visit-2.jpg?w=800>)
- [视频: the flock camera that ONLY tracks police](<https://www.youtube.com/embed/bbJHjcIIY-E?feature=oembed>)
