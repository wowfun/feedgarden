---
publish: true
content_type: "post"
title: "Keyboard differences between Windows and Macs"
description: "The author compiles a reference of the key-handling differences between macOS and Windows that trip up cross-platform software, especially web apps that must serve the same codebase to both. Naming diverges first. What Windows calls Back..."
date: "2026-10-09T03:08:05.000Z"
updated: "2026-10-10T06:19:28.614Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://unsung.aresluna.org/deeper-dive-keyboard-differences-between-windows-and-macs/"
discussion_url: "https://news.ycombinator.com/item?id=50015515"
tags: ["source/hackernews","topics/hardware","topics/communication","topics/culture-society"]
---

## Article

The author compiles a reference of the key-handling differences between macOS and Windows that trip up cross-platform software, especially web apps that must serve the same codebase to both.

Naming diverges first. What Windows calls Backspace, the Mac calls Delete, and what Windows calls Delete, the Mac calls Forward Delete, so saying "Delete" without naming the platform is ambiguous. Windows' Enter is the Mac's Return; Macs also have a distinct Enter only on numeric keypads, where it can be simulated with Fn+Return. In most Mac software Enter and Return behave identically, though exceptions survive in applications such as Photoshop, which inserts a line on Return and commits on Enter, and in classic audio tools like Cubase or Pro Tools; the author sees that distinction fading. Third-party keyboards usually use Windows wording &#40;Backspace, Enter&#41;, and if they support Mac conventions at all it is usually only for modifier keys.

Modifiers are the second source of confusion. Control on Windows corresponds to Command &#40;⌘&#41; on a Mac, so paste is ⌃V versus ⌘V. Apple devices keep a separate Control key, intended originally for terminals and now a much weaker extra modifier. Windows thus offers Ctrl, Alt and Shift, while Macs offer Command, Option, Control and Shift — one more modifier, and more room to work. The Windows and Globe/Fn keys are excluded because the OS reserves them. Swapping key caps is not enough: the keyboard must also change the scan codes it sends, since the code for Alt equals the code for Option, and the code for Command equals the code for the Windows key.

Finally, Apple leans on symbols where Windows uses words. The author lists Apple's glyphs — ⇧ Shift, ⌃ Control, ⌥ Option, ⌘ Command, ⏎ Return, ⌤ Enter, 🌐 Globe/Fn, ⇥ Tab, ⎋ Esc, ⌫ Delete, ⌦ Forward Delete, ⌧ Clear, ≣ Contextual Menu, ⇞ Page Up, ⇟ Page Down, ↖ Home and ↘ End. He notes those last four glyphs have changed on modern Apple keyboards to ↑ Page Up, ↓ Page Down, ⤒ Home and ⤓ End, calling the reuse of the regular arrow keys perplexing; those dual-purpose arrows appear only on the less popular full-size keyboards. From the 2026 models Apple unified when its keyboards show symbols versus symbols with legends across all regions, and Esc is the only key with a text-only legend.

## HN discussion

Based on 10 selected comments and replies.

Commenters largely confirm the article's premise that these differences carry real switching costs. One describes teaching a DOS-era user on Debian with XFCE, documenting basics such as Ctrl-C/X/A/V and the fact that there are two pointers, mouse and keyboard; a reply recalls a 1990s course where a participant physically lifted the mouse when told to "move the mouse up," a reminder that such idioms are not obvious.

Others report direct friction: one commenter abandoned Macs partly over keyboard handling, noting that Polish diacritics via right Alt were not obvious and that Control/Command confusion persists. A reply counters that adapting took about a month and that Command is more logical, since it lets common chords be pressed one-handed via the thumb, unlike Ctrl.

On history, one commenter traces the Delete naming to DOS, where the cursor sat on a character rather than between characters, allowing backspace, delete and forward delete to be distinguished. Summarizing preferences, another says Mac got Command right but Windows got Home and End right, and would want both. A further request asks Asahi and GNOME to implement a Mac input compatibility mode for dual-boot users, who currently hand-tune shortcuts.

Selected comments: [RobGR](https://news.ycombinator.com/item?id=50016411) · [hans&#95;castorp](https://news.ycombinator.com/item?id=50016936) · [szszrk](https://news.ycombinator.com/item?id=50017051) · [moogleii](https://news.ycombinator.com/item?id=50020246) · [bombcar](https://news.ycombinator.com/item?id=50015919) · [IgorPartola](https://news.ycombinator.com/item?id=50015724)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50015515>)

## Media

![Image](<https://unsung.aresluna.org/_media/deeper-dive-keyboard-differences-between-windows-and-macs/3.1088w.avif>)

[Image](<https://unsung.aresluna.org/_media/deeper-dive-keyboard-differences-between-windows-and-macs/3.1088w.avif>)

![Image](<https://unsung.aresluna.org/_media/deeper-dive-keyboard-differences-between-windows-and-macs/4.1088w.avif>)

[Image](<https://unsung.aresluna.org/_media/deeper-dive-keyboard-differences-between-windows-and-macs/4.1088w.avif>)

![Image](<https://unsung.aresluna.org/_media/deeper-dive-keyboard-differences-between-windows-and-macs/7.1088w.avif>)

[Image](<https://unsung.aresluna.org/_media/deeper-dive-keyboard-differences-between-windows-and-macs/7.1088w.avif>)
