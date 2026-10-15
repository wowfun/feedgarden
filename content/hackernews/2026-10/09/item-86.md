---
publish: true
content_type: "post"
title: "Show HN: Edi Life OS – self-hosted life dashboard with an MCP server for AI"
description: "Edi Life OS is a self-hosted dashboard that bundles ten workspaces behind one design, one sign-in and one database, aiming to replace a scattered set of to-do, habit, budgeting, Pomodoro and notes apps that do not talk to each other. The..."
date: "2026-10-09T00:02:19.000Z"
updated: "2026-10-10T05:10:37.706Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/edrisranjbar/lifeos"
discussion_url: "https://news.ycombinator.com/item?id=50014150"
tags: ["source/hackernews","topics/agents","topics/products","topics/open-source"]
---

## Article

Edi Life OS is a self-hosted dashboard that bundles ten workspaces behind one design, one sign-in and one database, aiming to replace a scattered set of to-do, habit, budgeting, Pomodoro and notes apps that do not talk to each other. The stated design goal is connection rather than collection: habits drive goal progress, Kanban cards appear in the calendar, and an Overview page combines activity into a single daily productivity score.

The workspaces cover Overview &#40;a productivity score, focus and habit trends, finances and a seven-day weather forecast&#41;, Growth &#40;six life dimensions linked to long-term and SMART goals, habits and tasks, plus weekly, monthly and quarterly reviews&#41;, Focus &#40;timed sessions with short and long breaks, session history and a soundtrack&#41;, Finance &#40;expenses, income, budgets, and debts or credits in a user-chosen currency, Toman by default&#41;, Habittify &#40;daily habits, streaks and monthly progress&#41;, Kanban &#40;draggable cards with priorities, labels, dates, checklists, comments and attachments&#41;, Calendar, Goals, Notepad and Notes. Dates follow Asia/Tehran, and the weather card shows Qeshm Island via Open-Meteo; the author notes its tide figure is a modelled estimate and not for navigation.

An optional MCP server exposes 15 tools spanning the dashboard, goals, tasks, habits, finances and notes, and can be connected to Claude Desktop, Claude Code or any MCP client for plain-language commands such as creating a SMART goal with a task, marking a habit complete, or logging an expense and checking a balance. The author states the MCP server reaches the app only through its token-protected HTTP API and never touches the database or credentials.

Deployment targets PHP 8.1+ &#40;with pdo&#95;mysql and mbstring&#41; and MySQL 8+ or MariaDB 10.4+. It can run via Docker Compose, where MySQL, the app and attachments each get their own volume so rebuilding after a pull preserves data, or from a release zip on shared hosting with the backend placed above the web root. The author claims no subscription, tracking or vendor lock-in; the project is distributed on GitHub.

## HN discussion

Based on 8 selected comments and replies.

Commenters largely accepted the idea but questioned the implementation. One said they had asked Claude to critique the code and that it was "not super complimentary," citing design anti-patterns they had not seen in two decades; a reply defended the choice of plain LAMP over a large node&#95;modules tree, arguing the older stack still boots faster. A separate thread asked why not just use a Notion template, and the author replied that Notion is a good choice if it works for you but did not for them. Another commenter suggested giving agents read-only access to application databases and letting them make ordinary HTTP calls against the services, saying this works well when the service is local-first with a sync engine. Two others described related efforts: an MCP layer with update rules in front of Notion plus a second MCP over Tailscale, and a similar project for personal health data.

Selected comments: [ceejayoz](https://news.ycombinator.com/item?id=50014531) · [soltanov](https://news.ycombinator.com/item?id=50015857) · [armanckeser](https://news.ycombinator.com/item?id=50019833) · [hmyn](https://news.ycombinator.com/item?id=50016165) · [edris0077](https://news.ycombinator.com/item?id=50016779) · [GaiusCoffee](https://news.ycombinator.com/item?id=50015964)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50014150>)

## Media

![Image: Growth workspace with six life dimensions and SMART progress](<https://github.com/edrisranjbar/lifeos/raw/main/docs/media/growth.webp>)

[Image: Growth workspace with six life dimensions and SMART progress](<https://github.com/edrisranjbar/lifeos/raw/main/docs/media/growth.webp>)

![Image: Habit checklist with a seven-day completion chart](<https://github.com/edrisranjbar/lifeos/raw/main/docs/media/habittify.webp>)

[Image: Habit checklist with a seven-day completion chart](<https://github.com/edrisranjbar/lifeos/raw/main/docs/media/habittify.webp>)

![Image: Kanban board with backlog, in progress, review and done columns](<https://github.com/edrisranjbar/lifeos/raw/main/docs/media/kanban.webp>)

[Image: Kanban board with backlog, in progress, review and done columns](<https://github.com/edrisranjbar/lifeos/raw/main/docs/media/kanban.webp>)
