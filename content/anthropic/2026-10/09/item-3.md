---
publish: true
content_type: "post"
title: "Launching an opt-in vulnerability-finding service for open-source software"
description: "Anthropic's Frontier Red Team launched OSS Scanner, an opt-in vulnerability scanner for open-source projects, announced October 8, 2026. Projects that join receive periodic security scans from Anthropic's strongest models at no cost. The..."
date: "2026-10-08T19:00:00.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:15.842Z"
date_basis: "published"
source_url: "https://www.anthropic.com/research/launching-opt-in-vuln-finding-service-for-open-source"
tags: ["source/anthropic","topics/security-privacy","topics/coding","topics/models"]
---

Anthropic's Frontier Red Team launched OSS Scanner, an opt-in vulnerability scanner for open-source projects, announced October 8, 2026. Projects that join receive periodic security scans from Anthropic's strongest models at no cost. The team says the service is informed by experience using Claude to find vulnerabilities during Project Glasswing.

The team reports that language-model vulnerability discovery has advanced quickly: on CyberGym, an academic vulnerability-finding benchmark, LLMs went from finding under 20% of vulnerabilities at the start of last year to over 85% this year. As a result, maintainers now receive higher-quality bug reports rather than mostly noise.

Over the past six months, Anthropic used its latest models to scan some of the world's most important software projects. It discovered over 29,000 candidate vulnerabilities but manually reviewed and triaged only about 6,000, leaving human validation capacity as the bottleneck. In response, several maintainers asked for bulk submission of all unverified reports with proposed patches; to date Anthropic has sent nearly 5,000 reports directly to maintainers on request, even when unvalidated. The team notes exploits can now be developed in minutes, so projects that find and fix vulnerabilities faster are better positioned against attackers racing to exploit the same weaknesses.

OSS Scanner outputs are fully model-generated, with no human review or triage. That enables faster, more frequent scanning but means some reports may be incorrect or invalid. Reports come from Anthropic's strongest models, including Claude Mythos. Each report contains a self-contained reproducer, an explanation of the vulnerability &#40;including a bisection of when the bug was introduced where possible&#41;, and a candidate patch when available. During several weeks of pipeline validation with dozens of open-source projects, initial disclosures contained hundreds of bug reports, including multiple vulnerabilities the team could chain into unauthenticated remote code execution exploits.

Coordinated vulnerability disclosure &#40;CVD&#41; of human-verified reports continues, especially for projects without the resourcing to triage themselves, alongside the optional fast-track for projects that want reports as soon as they are available. The team cites Google's OSS-Fuzz as inspiration and distinguishes OSS Scanner from Claude Security, the general-access code scanning and patching product aimed at enterprise defense. Quoted feedback includes Noah Misch of PostgreSQL, who said an unusually high fraction of findings uncovered PostgreSQL defects, several came with nearly usable fixes, and fast-track access let the project address the newest issues before a GA release.
