---
publish: true
content_type: "post"
title: "GitHub Incident with Actions, Pages, and Webhooks"
description: "GitHub experienced a multi-service degradation affecting Actions, Pages, and Webhooks. The incident began with reports of performance issues and errors, later expanding to include delays in Actions workflows, Pages deployments, webhook e..."
date: "2026-10-30T17:57:35.000Z"
updated: "2026-11-01T15:39:43.305Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://www.githubstatus.com/incidents/pwxsjgnvrk6b"
discussion_url: "https://news.ycombinator.com/item?id=50307723"
tags: ["source/hackernews","topics/cloud-computing"]
---

## Article

GitHub experienced a multi-service degradation affecting Actions, Pages, and Webhooks. The incident began with reports of performance issues and errors, later expanding to include delays in Actions workflows, Pages deployments, webhook events, and problems with code search and live updates. GitHub took mitigation steps that led to recovery signs for Actions and Pages, and later reported all affected services had recovered while continuing to investigate the root cause. A detailed root cause analysis was promised at the time of resolution.

## HN discussion

Based on 10 selected comments and replies.

Commenters focused less on GitHub's root cause than on its reliability model. One observed that HN discussion volume on githubstatus.com acts as a surprisingly effective proxy for outage severity and duration. Frustration centered on the apparent mismatch between reported uptime and user experience, with some noting degraded performance can be downplayed as non-downtime if limited in scope. Several advocated for physically separating free-tier and paid-tier infrastructure to protect paying customers. Others pointed to alternatives: self-hosted GitHub Actions runners or migrating to self-hosted forges like Forgejo/Gitea as ways to avoid recurring outages entirely.

Selected comments: [peri-cl](https://news.ycombinator.com/item?id=50308183) · [montroser](https://news.ycombinator.com/item?id=50308234) · [crote](https://news.ycombinator.com/item?id=50310863) · [senderista](https://news.ycombinator.com/item?id=50308524) · [huijzer](https://news.ycombinator.com/item?id=50309016)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50307723>)
