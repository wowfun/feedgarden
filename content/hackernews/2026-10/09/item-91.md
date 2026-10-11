---
publish: true
content_type: "post"
title: "Reducing undefined behavior in the C language"
description: "Martin Uecker, a biomedical engineering professor who writes free software for controlling MRI scanners, spoke at Kernel Recipes about undefined behavior (UB) in C and whether the language can eventually be made memory-safe. He argued C rem"
date: "2026-10-09T02:02:53.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://lwn.net/Articles/1095811/"
discussion_url: "https://news.ycombinator.com/item?id=50015074"
tags: ["source/hackernews","topics/coding","topics/security-privacy","topics/research"]
---

## Article

Martin Uecker, a biomedical engineering professor who writes free software for controlling MRI scanners, spoke at Kernel Recipes about undefined behavior &#40;UB&#41; in C and whether the language can eventually be made memory-safe. He argued C remains a good language in 2026: portable, stable over the long term, fast to compile, and producing fast binaries, with behavior that is easy to reason about, plenty of tooling, and the ability to get out of the way when needed.

Uecker traced UB to C's history. The C89 standard had to accommodate hardware with signed-magnitude or one's-complement integers, segmented memory, exotic pointer representations and unusual type sizes; some Honeywell machines had nine-bit bytes. The standard therefore defined semantics in terms of an abstract machine, requiring only that observable behavior match it. Compiler implementers get broad freedom because much behavior is undefined or implementation-defined and thus not observable. Other specifications such as ABI requirements, POSIX or backward compatibility can still constrain compilers. UB arises when a program does something not portable or not defined at all; C89 says the standard "imposes no requirements" in those cases. It exists partly to allow extensions, hardware safety interactions and aggressive optimization, and to let compilers ignore hard-to-detect errors.

The problem, Uecker said, is that the standard permits a compiler to do anything in response to UB, up to invoking "nasal demons." If a program contains any UB, compiler writers may treat it as having no expected semantics; C++23 states explicitly that the standard imposes no requirements for such programs. This fuels disputes. A 2015 survey found no consensus on what happens if, after zeroing a struct and writing specific fields, a program reads padding bytes that might hold security-relevant data. Another example: in code where a division by a possibly zero divisor is UB, a compiler may be entitled to omit the zero test entirely and assume the divisor is nonzero.

The talk also covered memory-safety efforts. Commenters noted that the article undersells Fil-C and CHERI, arguing these close off spatial and temporal memory-safety bugs for exploit writers and give the language a tight enough semantics, with tradeoffs differing between the two; they attack the problem at the ABI level, so protection is not limited to rewritten code. A reply countered that both attach provenance only to allocations, so a buffer overflow can still overwrite an adjacent field such as an is&#95;admin flag, and that both require recompiling everything — feasible perhaps for CHERI but not for Fil-C, which is why Fil-C support for Windows or macOS does not exist.

## HN discussion

Based on 10 selected comments and replies.

Commenters debated how well the discussed memory-safety approaches address exploitability. One argued the article undersells Fil-C and CHERI: Fil-C does not merely find temporal-safety bugs but closes off spatial and temporal memory-safety bugs for exploit writers and ascribes tight semantics to the whole language, while CHERI makes different tradeoffs but is also comprehensive. Both attack the problem at the ABI level, so protection is not limited to rewritten code, making them broader than Rust in that respect.

A reply pushed back: both schemes attach provenance only to allocations, so a struct with char name&#91;100&#93; followed by bool is&#95;admin can still be corrupted by a buffer overflow overwriting is&#95;admin. It added that both require recompiling everything — possibly feasible for CHERI but not for Fil-C, which is why Fil-C support for Windows or macOS cannot exist.

Another thread focused on tooling. One commenter said their main complaint about UB in C is that it is silent: they could accept compilers doing wild things, but want loud warnings, such as a note that a conditional was collapsed to one branch because an earlier division by zero is UB. A reply called this infeasible: a C compiler makes so many assumptions that UB does not occur that even well-functioning programs would emit walls of warnings, and they could not be silenced; the division case would need either runtime checks that slow C badly or compile-time proofs that are often impossible.

A final exchange questioned whether adding runtime behavior to combat UB is right at all. One commenter called C "high level assembly" for systems programming, arguing runtime checks blow up execution times and static analysis only goes so far. A reply disputed the premise: if C really were high-level assembly there would be no UB; UB exists because optimizations are needed for C to be fast enough for operating-system work.

Selected comments: [pizlonator](https://news.ycombinator.com/item?id=50016256) · [afdbcreid](https://news.ycombinator.com/item?id=50016365) · [vbezhenar](https://news.ycombinator.com/item?id=50016771) · [jakobnissen](https://news.ycombinator.com/item?id=50016839) · [hn&#95;submit](https://news.ycombinator.com/item?id=50016057) · [SkiFire13](https://news.ycombinator.com/item?id=50016407)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50015074>)

## Images and video

- [Image: &#91;Martin Uecker&#93;](<https://static.lwn.net/images/conf/2026/kr/MartinUecker-sm.png>)
- [Video: video](<https://www.youtube.com/watch?v=dhlYcmX_oBQ&list=PLEVVgAZOU9P8&index=14>)
