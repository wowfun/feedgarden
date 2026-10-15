---
publish: true
content_type: "post"
title: "减少 C 语言中的未定义行为"
description: "生物医学工程教授 Martin Uecker 平时为控制磁共振成像（MRI）扫描仪编写自由软件，他在 Kernel Recipes 大会上谈到了 C 语言的未定义行为（UB），以及 C 最终能否成为一种内存安全的语言。他认为到 2026 年 C 依然是一门好语言：可移植、长期稳定、编译快、生成的二进制快，行为容易预判，工具链丰富，必要时也能“让路”。 Uecker 把 UB 追溯到 C 的历史。C89 标准必须兼容各种硬件，包括采用符号-数值表示或反码整数、分段内存、奇..."
date: "2026-10-09T02:02:53.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://lwn.net/Articles/1095811/"
discussion_url: "https://news.ycombinator.com/item?id=50015074"
tags: ["source/hackernews","topics/coding","topics/security-privacy","topics/research"]
---

## 正文提炼

生物医学工程教授 Martin Uecker 平时为控制磁共振成像（MRI）扫描仪编写自由软件，他在 Kernel Recipes 大会上谈到了 C 语言的未定义行为（UB），以及 C 最终能否成为一种内存安全的语言。他认为到 2026 年 C 依然是一门好语言：可移植、长期稳定、编译快、生成的二进制快，行为容易预判，工具链丰富，必要时也能“让路”。

Uecker 把 UB 追溯到 C 的历史。C89 标准必须兼容各种硬件，包括采用符号-数值表示或反码整数、分段内存、奇异指针表示和特殊类型宽度的机器；例如某些 Honeywell 机器的字节有 9 位。因此标准以抽象机器来定义语义，只要求可观察行为与之一致。由于大量行为是未定义或由实现决定的，不属于可观察行为，编译器实现者获得了很大自由度。ABI 要求、POSIX 等规范以及向后兼容需求仍可对编译器形成约束。当程序做了不可移植或标准根本未定义的事，就产生 UB；C89 称此时标准“不施加任何要求”。UB 的存在部分是为了支持扩展、与硬件安全机制交互、进行激进优化，并允许编译器忽略难以检测的错误。

Uecker 说，问题在于标准允许编译器对 UB 做出任何反应，甚至“召唤鼻魔”。如果程序含有任何 UB，编译器作者就可能认为它没有预期语义；C++23 更是明确规定标准对此类程序不施加要求。这引发了广泛争议。2015 年的一项调查显示，对于“把结构体清零后写入某些字段、再读取可能含有安全相关数据的填充字节”会发生什么，业界没有共识。另一个例子是：当除数可能为零而导致除零这一 UB 时，编译器甚至有权完全删掉判零检查，直接假定除数非零。

演讲还谈到内存安全的努力。评论者认为文章低估了 Fil-C 和 CHERI，指出它们能让利用者无法使用空间与时间内存安全漏洞，并赋予语言足够严格的语义，两者取舍不同；它们在 ABI 层面解决问题，因此保护不限于被重写的代码。一条回复反驳说，两者都只把来源信息绑定到分配上，因此缓冲区溢出仍可能覆盖相邻字段，例如 is&#95;admin 标志；而且两者都需要重新编译所有代码——对 CHERI 或许可行，对 Fil-C 则不行，这也是 Fil-C 无法支持 Windows 或 macOS 的原因。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

多位评论者讨论了相关内存安全方案对“可利用性”的解决程度。一位评论者认为文章低估了 Fil-C 和 CHERI：Fil-C 不只是发现时间安全漏洞，而是让利用者无法使用空间与时间内存安全漏洞，并赋予整门语言足够严格的语义；CHERI 取舍不同，但同样全面。两者都在 ABI 层面解决问题，因此保护不限于被重写的代码，在这一点上比 Rust 覆盖更广。

一条回复对此提出异议。它说这两种方案都只把来源信息绑定到分配上，因此常见的“char name&#91;100&#93; 后面跟着 bool is&#95;admin”的结构体仍可能因缓冲区溢出覆盖 is&#95;admin。它还指出两者都需要重新编译所有代码——对 CHERI 或许可行，对 Fil-C 则不行，这正是 Fil-C 无法支持 Windows 或 macOS 的原因。

另一条讨论聚焦工具。一位评论者说，他对 C 中 UB 的主要不满在于它“无声无息”：编译器乱来他可以接受，但他想要响亮的警告，例如提示某个条件表达式因为此前的除零属于 UB 而被折叠成一个分支，以便修改代码。一条回复认为这不可行：C 编译器假设 UB 不会发生的地方太多，即使运行良好的程序也会刷出满屏警告，而且无法关闭；以整数除零为例，要么加运行时检查令 C 大幅变慢，要么要求编译器在编译期证明除数非零，而这类证明往往做不到。

最后一段交锋质疑“用运行时行为来对抗 UB”这一思路本身。一位评论者把 C 形容为系统编程的“高级汇编”，认为运行时检查会严重拖慢执行，静态分析在不大幅增加编译时间的前提下也有极限。一条回复反驳了这一前提：如果 C 真的是高级汇编，就不会有 UB，也不需要 UB；UB 之所以存在，正是因为要实现优化，而优化又是让 C 快到足以胜任操作系统工作的必要条件。

评论来源：[pizlonator](https://news.ycombinator.com/item?id=50016256) · [afdbcreid](https://news.ycombinator.com/item?id=50016365) · [vbezhenar](https://news.ycombinator.com/item?id=50016771) · [jakobnissen](https://news.ycombinator.com/item?id=50016839) · [hn&#95;submit](https://news.ycombinator.com/item?id=50016057) · [SkiFire13](https://news.ycombinator.com/item?id=50016407)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50015074>)

## 媒体

![图片: &#91;Martin Uecker&#93;](<https://static.lwn.net/images/conf/2026/kr/MartinUecker-sm.png>)

[图片: &#91;Martin Uecker&#93;](<https://static.lwn.net/images/conf/2026/kr/MartinUecker-sm.png>)

![视频: video](<https://www.youtube.com/watch?v=dhlYcmX_oBQ&list=PLEVVgAZOU9P8&index=14>)

[视频: video](<https://www.youtube.com/watch?v=dhlYcmX_oBQ&list=PLEVVgAZOU9P8&index=14>)
