---
publish: true
content_type: "post"
title: "Stop sending private information to Claude (open source)"
description: "A Reddit user released Redacto, a free and open-source tool that removes personal details from files before they are shared with an AI assistant. A chatbot does not need a real name or an account number in order to help someone understand a"
date: "2026-10-09T11:24:37.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1itfk/stop_sending_private_information_to_claude_open/"
tags: ["source/reddit","topics/security-privacy","topics/products","topics/coding"]
---

A Reddit user released Redacto, a free and open-source tool that removes personal details from files before they are shared with an AI assistant. A chatbot does not need a real name or an account number in order to help someone understand a document, the author argues.

Mechanically, a small AI model runs in the browser alongside pattern matching to flag names, addresses, emails and other identifying information. The user reviews the findings, fixes anything the detector missed and exports a redacted copy. Supported formats are PDF, Word, Excel, CSV, images and text. In text, redactions can use consistent labels such as a numbered PERSON placeholder; in PDFs, black boxes are permanently burned into the exported pages. The project states that there is no account, no uploads and no tracking, and that once the model and app resources have loaded it also works offline. An important limitation is flagged: detection is not perfect, so the output should always be reviewed before sharing. The tool is offered as a web app, its code is published publicly, and the author asks for feedback about anything it misses. The post is framed around Claude specifically, but the described workflow applies to any assistant receiving uploaded documents.
