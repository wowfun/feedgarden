---
publish: true
content_type: "post"
title: "Show HN：让电脑拥有电话线的 USB-C LTE 调制解调器"
description: "该项目是一块 4 层、85×65 mm 的开源硬件板，可通过一根 USB-C 线缆为电脑提供独立的蜂窝电话线路。插入带语音套餐的 nano-SIM 并连接线缆后，板载 USB 集线器会向电脑暴露三种普通 USB 设备：LTE 数据网络适配器（Quectel EC25-EUX，欧洲频段支持 3G/2G 回退）、用于 AT 命令的串口（主叫号码显示、短信、接听）以及承载通话音频的 USB 声卡（RP2040，作为麦克风与扬声器）。板上没有电池、屏幕或扬声器；三颗 LED 分..."
date: "2026-10-31T15:56:41.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://github.com/Koppar-AI/koppar-lte-modem"
discussion_url: "https://news.ycombinator.com/item?id=50317331"
tags: ["source/hackernews","topics/hardware"]
---

## 正文提炼

该项目是一块 4 层、85×65 mm 的开源硬件板，可通过一根 USB-C 线缆为电脑提供独立的蜂窝电话线路。插入带语音套餐的 nano-SIM 并连接线缆后，板载 USB 集线器会向电脑暴露三种普通 USB 设备：LTE 数据网络适配器（Quectel EC25-EUX，欧洲频段支持 3G/2G 回退）、用于 AT 命令的串口（主叫号码显示、短信、接听）以及承载通话音频的 USB 声卡（RP2040，作为麦克风与扬声器）。板上没有电池、屏幕或扬声器；三颗 LED 分别指示网络、振铃与通话状态。供电来自 5 V USB-C，其中 3.8 V/3 A 降压为调制解调器 2 A 的发射突发供电，3.3 V 为集线器、RP2040 及其闪存供电。5.1 kΩ 的 CC 电阻使板子成为不协商任何参数的 USB 接收端，因此 USB-A 或 1.5 A 电源在 2G 突发时可能掉电，需要 3 A 的 USB-C 端口以保证可靠运行，尤其是在回退到 2G 频段进行发射突发时；设计说明指出 Quectel 模块的 LGA-144 封装与 49 Ω 的天线馈线阻抗是必须在订购零件或配置叠层时注意的关键装配细节。仓库还包含 KiCad 10 工程、Gerber 与钻孔文件、IPC-2581、原理图 PDF、JLCPCB 贴装 BOM 与坐标文件、RP2040 声卡固件及 REVIEW.md；装配面向 JLCPCB，指定 4 层、1.6 mm 叠层。Quectel 模块、两根 LTE 天线（698–2690 MHz，U.FL）、nano-SIM 与 USB-C 线缆需自行采购，U8 必须在装配时取消选中并手工焊接。值得注意的限制：VoLTE 取决于运营商白名单与正确的 Quectel MBN 配置文件；欧洲的 2G/3G 目前仍可用。板上没有 BOOTSEL 按钮——空白的 RP2040 会启动进入 USB 引导加载器，背面有带标签的焊盘组用于恢复（BOOT+GND、SWD、USB&#95;BOOT+1V8 紧急下载模式）。KiCad 库中两个封装缺少 3D 模型。

## HN 热门讨论

根据 9 条选取的评论与回复整理。

评论者提出了几项实际问题。gruez 质疑该调制解调器是否支持 VoLTE，警告称随着运营商关闭 2G/3G，它可能在几年内变成砖块；提交者 abijahkaj 回复称 Quectel EC25-EUX 原生支持 VoLTE，音频路径相同，但实际 VoLTE 取决于运营商白名单和加载正确的 Quectel MBN 配置文件，且欧洲的 2G/3G 目前仍可用。Vaushite 将该项目斥为“AI vibed”，称其可能从未被真正制作出来、无法工作，提交者在采样回复中未回应这一说法。mycall 询问 LTE 在三年内 6G 推出后是否仍能工作；wolrah 解释称 LTE 基于 OFDM 的空口让基站可在代际间动态分配频谱，因此不太可能出现硬性停用。whalesalad 表示希望该板能成为 Framework 模块。样本反映出技术疑问、怀疑与热情并存，而非共识。

评论来源：[gruez](https://news.ycombinator.com/item?id=50320356) · [abijahkaj](https://news.ycombinator.com/item?id=50320617) · [Vaushite](https://news.ycombinator.com/item?id=50319590) · [mycall](https://news.ycombinator.com/item?id=50318605) · [wolrah](https://news.ycombinator.com/item?id=50319757) · [whalesalad](https://news.ycombinator.com/item?id=50320640)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50317331>)

## 媒体

![图片: The board, 85 x 65 mm, 4 layers](<https://github.com/Koppar-AI/koppar-lte-modem/raw/main/images/hero.png>)

[图片: The board, 85 x 65 mm, 4 layers](<https://github.com/Koppar-AI/koppar-lte-modem/raw/main/images/hero.png>)

![图片: Top](<https://github.com/Koppar-AI/koppar-lte-modem/raw/main/images/top.png>)

[图片: Top](<https://github.com/Koppar-AI/koppar-lte-modem/raw/main/images/top.png>)

![PDF: PDF](<https://github.com/Koppar-AI/koppar-lte-modem/blob/main/board/fab/schematic.pdf>)

[PDF: PDF](<https://github.com/Koppar-AI/koppar-lte-modem/blob/main/board/fab/schematic.pdf>)
