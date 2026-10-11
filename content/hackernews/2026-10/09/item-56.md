---
publish: true
content_type: "post"
title: "Coping with the Onslaught of Kernel Security Bugs"
description: "At the 2026 edition of Kernel Recipes, Greg Kroah-Hartman spoke about how the kernel's security team is handling a flood of bug reports made easy to produce by large language models. His core message was \"don't panic.\" A plot of kernel CVE "
date: "2026-10-08T19:45:57.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://lwn.net/SubscriberLink/1096908/c6356cdf7f44d632/"
discussion_url: "https://news.ycombinator.com/item?id=50011053"
tags: ["source/hackernews","topics/security-privacy","topics/models","topics/industry"]
---

## Article

At the 2026 edition of Kernel Recipes, Greg Kroah-Hartman spoke about how the kernel's security team is handling a flood of bug reports made easy to produce by large language models. His core message was "don't panic." A plot of kernel CVE numbers fixed per release shows the rate had been steady at about 500 fixes per release before abruptly quadrupling; the project now fixes 33 CVEs per day, up from roughly 50 fixes per week not long ago.

He said the preparatory work already done in the kernel community has paid off and the tooling scales to this activity. Other projects are in a panic, but "we're doing fine, and could go faster." He dismissed much press coverage as doom marketing. As an example, he described a phone call claiming the Mythos LLM had found 79 Linux kernel vulnerabilities. After obtaining the raw data, he found the breakdown instructive:

- 24 bugs had no detail beyond "something crashed"
- 14 were not bugs at all, and 3 were based on made-up data and fake from the start
- 15 were real bugs already fixed in the current kernel release — typical, he said, of sycophantic tools that work hard to find bugs when asked and even read mailing lists to re-report bugs fixed by others
- Of the 26 remaining.6 were duplicates, and the total did not even add up to 79, since LLMs are not always good at basic math
- Of the 20 needing fixes: 7 were exploitable only via a malicious filesystem image, long documented as not a security issue; 2 required injecting a malicious packet mid-stack, only possible as root; 2 affected NOMMU systems &#40;one in io&#95;uring, which he doubts anyone uses on NOMMU&#41; and were fixed but not upstream; plus 2 minor IPv6 issues and 1 local privilege escalation via the GPU by a user already able to do far worse

The exercise ended in ten real bug fixes, representing about one hour of work for a project merging a little over ten patches per hour. The real problem, he argued, is mean time to exploit: the gap between bug discovery and working exploits, which was 63 days in 2018 and is 7 days in 2026. People simply not updating their systems is the bigger issue, and running old software is a luxury many no longer have.

## Images and video

- [Image: &#91;CVE fix plot&#93;](<https://static.lwn.net/images/conf/2026/kr/gregkh-cves.png>)
- [Video: video of this talk](<https://www.youtube.com/watch?v=NnV_cWeoo5Q&list=PLEVVgAZOU9P8&index=9>)
