---
publish: true
content_type: "post"
title: "Show HN: K10s – A Clickable Kubernetes TUI (Go, Bubble Tea)"
description: "K10s is a Kubernetes terminal UI written in Go with Bubble Tea, built around the argument that a cluster dashboard is opened many times a day, usually while something is on fire, so what matters is how fast it opens and how little you ha..."
date: "2026-10-08T18:29:06.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/p10node/k10s"
discussion_url: "https://news.ycombinator.com/item?id=50009904"
tags: ["source/hackernews","topics/coding","topics/agents","topics/products"]
---

## Article

K10s is a Kubernetes terminal UI written in Go with Bubble Tea, built around the argument that a cluster dashboard is opened many times a day, usually while something is on fire, so what matters is how fast it opens and how little you have to remember. Its distinguishing choice is that clicking is a first-class interaction: nothing is hidden behind memorised keys. Actions that apply to the selected object are listed in their own pane, and you can click one or press the letter next to it. Rows, panes, zoom and the namespace selector are all clickable, and every border button is real. A single search box covers the whole cluster -- ctrl+p searches resource kinds and objects together, with no prefix language to learn.

The project emphasises startup performance and lazy loading. Startup registers zero watches and waits for nothing; informers start lazily, per kind, the first time you look at one, so opening Pods watches pods rather than every Secret and Event in the cluster. The source says there are accompanying regression guards.

Other features include an AI assistant: ctrl+a lets you ask questions in plain English, with the current context, namespace, kind and selected object injected into the prompt so that "why is this pod unhealthy?" refers to the selected pod. The tool updates itself via /update, which installs the newest release over the running binary with checksum verification, atomically, and offers to restart into it. Existing k9s-style command plugins are supported: scoped shortcuts go in &#126;/.k10s/plugins.yaml and appear beside built-in actions, receiving the selected object, namespace, context and column values. K10s ships an opt-in offline demo backend with a realistic sample cluster including a CrashLoopBackOff to poke at, deliberately labelled so sample data is never mistaken for a real machine; the demo is a context rather than a mode, is marked DEMO in the header, and is exited by selecting another context. Otherwise k10s reads the same kubeconfig as kubectl &#40;&#36;KUBECONFIG, else &#126;/.kube/config&#41; and shows what that context can reach and nothing else; with no kubeconfig or an unresponsive API server it displays "No cluster" and points to r to retry, :ctx, and /setup.

Installation is via a curl install script for macOS and Linux on amd64 and arm64, which picks the prebuilt binary, verifies its sha256 against the release manifest and installs to /usr/local/bin or &#126;/.local/bin, with --dir, --version and --no-sudo options documented; go install github.com/p10node/k10s@latest or a clone with just install also works. Prebuilt static binaries are published for darwin/amd64, darwin/arm64, linux/amd64, linux/arm64 and windows/amd64, with Windows directed to the release page rather than the installer. The interface lists 30 kinds across Workloads, Network, Config, Storage, RBAC, Cluster and Custom Resources, each with a live row count for the current namespace, and CRDs are discovered automatically. There is a --readonly flag for looking without touching the cluster, and upgrades are run as k10s update. The docs' screenshots and frames are stated to come from the running binary and its offline demo backend rather than being hand-drawn.

## HN discussion

Based on 9 selected comments and replies.

The comment thread was dominated by resistance to mouse interaction in terminals. One commenter said they "really don't care to click anything in a terminal" and disliked the trend since Claude added it, because clicking to focus a window can accidentally trigger an action; a reply agreed, suggesting a modifier such as Shift+click to follow a URL, and noted that unwanted clicks often select an option or open a pane. Another commenter called a clickable TUI "contrarian" to why they use CLI tools, though they allowed it may lower the barrier for newcomers without requiring another Electron app, and a reply noted React is used for some terminal UIs.

Trust in AI-assisted open source was another theme: one commenter said seeing a Claude icon next to a committer makes them avoid the project. The author responded that Claude-generated code is fully under his control and that he chose to acknowledge the help rather than hide it. Others found the project neat or praised its speed and layout, with one noting that Vim keybindings are missing and that they stay with k9s out of habit. A commenter pointed to Kubernetes headlamp as an established clickable k8s UI, and another hoped AI-assisted coding would not erode the habit of contributing upstream, arguing that features like mouse clicking would have made a good upstream contribution rather than a rewrite.

Selected comments: [bearjaws](https://news.ycombinator.com/item?id=50010426) · [keybrd-intrrpt](https://news.ycombinator.com/item?id=50010524) · [taude](https://news.ycombinator.com/item?id=50010683) · [frevib](https://news.ycombinator.com/item?id=50010392) · [pierreneter](https://news.ycombinator.com/item?id=50010444) · [magnusokik](https://news.ycombinator.com/item?id=50018192)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50009904>)

## Media

![Image: k10s running in a terminal: resource sidebar, pod table with live status, and an action pane for the selected pod](<https://github.com/p10node/k10s/raw/main/assets/screenshot.png>)

[Image: k10s running in a terminal: resource sidebar, pod table with live status, and an action pane for the selected pod](<https://github.com/p10node/k10s/raw/main/assets/screenshot.png>)
