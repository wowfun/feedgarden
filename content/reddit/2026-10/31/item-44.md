---
publish: true
content_type: "post"
title: "If you’re letting Claude Code clean up your smart TV, do these things first"
description: "A Reddit user, responding to posts about Claude Code removing bloatware from smart TVs and cases where TVs were bricked, outlines a safer procedure for Android-based TVs. The approach emphasizes manual approval, backups, and reversible a..."
date: "2026-10-31T11:56:02.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T16:37:24.207Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1xk8apo/if_youre_letting_claude_code_clean_up_your_smart/"
tags: ["source/reddit","topics/agents","topics/hardware","topics/security-privacy"]
---

A Reddit user, responding to posts about Claude Code removing bloatware from smart TVs and cases where TVs were bricked, outlines a safer procedure for Android-based TVs. The approach emphasizes manual approval, backups, and reversible actions. Key steps: run Claude Code in manual mode &#40;claude --permission-mode default&#41; so each adb command is reviewed before execution. Before changes, have it save the full package list, enabled packages, and current launcher as an undo backup. Disable rather than uninstall apps using pm disable-user --user 0 &lt;package&gt;, reversible with pm enable; uninstalling system packages is what bricks devices. Protect critical components with a never-touch list: System UI, Settings, HDMI/TV inputs, Bluetooth and remote pairing, package installer and Play Store, and the current launcher until a replacement works. On Google TV, check whether the setup wizard can capture the Home button after the stock launcher is disabled. Prompts should specify model, OS &#40;Google TV/Android TV/Fire TV&#41;, IP, and apps to keep. For in-app ads that disabling cannot remove, use Private DNS via two adb settings commands on Android 9+. Afterward, disable USB and network debugging to close the open network door. The method works on Android-based TVs &#40;Sony, TCL, Hisense, Philips, Xiaomi, onn, Chromecast&#41; and partly on Fire TV; Samsung, LG, Roku and Vizio lack adb access, so Claude can only advise on settings and router-level blocking. Ready-made instruction sets exist: cleanyourtv for Android/Google TV &#40;100+ model lists, backup/restore&#41; and dumbtv for Fire TV. Full steps at aiparabellum.com.

## Media

![Image: If you’re letting Claude Code clean up your smart TV, do these things first](<https://preview.redd.it/in2rj4cyksyh1.jpeg?width=640&crop=smart&auto=webp&s=4d15d4fe5e434936aa634c80796a23e41276f4e0>)

[Image: If you’re letting Claude Code clean up your smart TV, do these things first](<https://preview.redd.it/in2rj4cyksyh1.jpeg?width=640&crop=smart&auto=webp&s=4d15d4fe5e434936aa634c80796a23e41276f4e0>)
