---
publish: true
content_type: "post"
title: "Show HN: I wrote an email app that accepts only one sender per inbox"
description: "A Show HN post introduces an email service built around \"infinite inboxes,\" where addresses are created on demand and each one is intended to receive mail from a single sender. The author describes three inbox types. A one-sender inbox l..."
date: "2026-10-14T17:00:59.000Z"
updated: "2026-10-15T15:41:45.488Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://clova.email/"
discussion_url: "https://news.ycombinator.com/item?id=50090932"
tags: ["source/hackernews","topics/security-privacy","topics/products"]
---

## Article

A Show HN post introduces an email service built around "infinite inboxes," where addresses are created on demand and each one is intended to receive mail from a single sender.

The author describes three inbox types. A one-sender inbox locks to the first domain that emails it, with exceptions for large providers such as Gmail and Outlook, where it locks to a specific account instead; all other senders are bounced. A temporary inbox expires after a chosen interval &#40;24 hours, 7 days and similar&#41;, then bounces mail, with received messages kept or discarded according to the user's preference. The prefix type is described as the most powerful: declaring a prefix such as "service" lets users invent any suffix, like service-netflix or service&#36;bank, and each new suffix self-creates a one-sender inbox locked to whoever writes first.

The service supports bring-your-own domain, forwarding, and a bring-your-own-AI setup with an MCP server ready. The author asks readers to help test it.

The post does not document pricing, spam-detection details or handling of rebrands beyond what the author later explains in the thread.

## HN discussion

Based on 10 selected comments and replies.

A central objection is that companies routinely send legitimate mail from multiple addresses and subdomains — commenters cite Citibank and Bank of America examples — so locking an inbox to the first sender would silently discard important messages. The author replies that the lock is on the domain, not the sender or subdomain, so both examples would still be accepted, and that permanent inboxes allow anyone and can be deleted once they attract spam.

Asked about rebrands, such as a company moving from facebook.com to meta.com, the author says the app does not handle that yet. Options considered include a button to release the lock so the next sender can claim it, manually adding related domains &#40;which the author calls too much work, noting an example of one company mailing from two domains&#41;, or allowing several domains with manual blocking.

On authentication, a commenter asks whether DMARC alignment is checked, warning that a spoofed From address would otherwise pass and noting that gmail.com and outlook.com use p=none. The author confirms DMARC, SPF, DKIM and spam checking are implemented.

Selected comments: [CrendKing](https://news.ycombinator.com/item?id=50097977) · [edpin2000](https://news.ycombinator.com/item?id=50098770) · [zatkin](https://news.ycombinator.com/item?id=50093861) · [edpin2000](https://news.ycombinator.com/item?id=50094551) · [CreepyHunterX](https://news.ycombinator.com/item?id=50103275) · [edpin2000](https://news.ycombinator.com/item?id=50103777)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50090932>)
