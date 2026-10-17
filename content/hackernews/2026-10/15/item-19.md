---
publish: true
content_type: "post"
title: "Fancy Curl Sites"
description: "Commenters traded techniques for serving terminal-friendly content at the same URL. One describes a fully static approach that needs no user-agent sniffing: the server hides ANSI output inside an HTML comment using alternate terminal buf..."
date: "2026-10-14T19:29:12.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://nytpu.com/gemlog/2026-03-18"
discussion_url: "https://news.ycombinator.com/item?id=50093612"
tags: ["source/hackernews","topics/coding","topics/products","topics/open-source"]
---

## HN discussion

Based on 9 selected comments and replies.

Commenters traded techniques for serving terminal-friendly content at the same URL. One describes a fully static approach that needs no user-agent sniffing: the server hides ANSI output inside an HTML comment using alternate terminal buffers, so curling writes the HTML first, then clears that buffer and paints the ANSI version on the real screen, while browsers simply ignore the commented region. Another compares this to multi-part email, where the client's rendering capability decides whether text or HTML is shown.

A dissenting thread argues a less playful approach is preferable: keep HTML as the default, add a link rel alternate hint pointing at a Markdown version, and let clients request text/markdown. That author says it works site-wide, including posts, and mainly helps screen readers, other devices and agents that can skip the layout. Others push further, suggesting Accept: text/html as the standard way to get the canonical page and a dedicated type such as text/x-ansi for the terminal variant, so tools like wget can request it; one replies that they want curl and wget to receive the canonical representation by default.

A practical example shows a weather service reachable as curl https&#58;//wthr.dev/City, modeled on wttr.in but simpler, with the author noting wonky geocoding, strict rate limits and basement hosting. Another shares personal sites returning recent listening and reading lists. A final note warns the ANSI tricks only work properly on Windows when run from Terminal rather than PowerShell mode.

Selected comments: [colewilson](https://news.ycombinator.com/item?id=50095529) · [G&#95;o&#95;D](https://news.ycombinator.com/item?id=50098263) · [tinthedev](https://news.ycombinator.com/item?id=50101448) · [jayknight](https://news.ycombinator.com/item?id=50094314) · [lightandlight](https://news.ycombinator.com/item?id=50095124) · [abound](https://news.ycombinator.com/item?id=50099058)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50093612>)
