---
publish: true
content_type: "post"
title: "Engineer questions password managers shipped by people with little coding experience"
description: "A software engineer flags an open-source password manager, KAPEVault, released as downloadable Windows and Android apps by someone they describe as having practically no coding experience. The software is distributed publicly and stores ..."
date: "2026-10-15T01:19:08.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:06:23.435Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x68om1/weve_reached_the_point_where_people_with/"
tags: ["source/reddit","topics/security-privacy","topics/coding","topics/open-source"]
---

A software engineer flags an open-source password manager, KAPEVault, released as downloadable Windows and Android apps by someone they describe as having practically no coding experience. The software is distributed publicly and stores passwords, 2FA codes, API keys and government IDs.

The poster, who uses AI coding tools themselves, makes a distinction between building for learning and distributing software real users may trust with banking credentials. They note the project's genuine strengths: it is open source, has a documented threat model, automated tests and a self-conducted security review. They also note the repository acknowledges no third-party security audit has been performed.

Their argument is that AES-256-GCM and scrypt do not by themselves make a password manager secure, and that a polished interface, passing tests or an AI reviewing its own output are not substitutes for understanding the attack surface, handling secrets correctly and anticipating edge cases. They state they have not audited the project and do not claim it is insecure; the concern is the confidence with which security-critical software is released by authors who may not fully grasp it, and that while code can be outsourced to an AI, accountability cannot.
