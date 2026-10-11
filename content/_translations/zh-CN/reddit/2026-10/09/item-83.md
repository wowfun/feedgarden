---
publish: true
content_type: "post"
title: "用于在新装的 macOS 27 Mac 上搭建开发环境的脚本"
description: "一位开发者分享了一组脚本，可把全新安装的 macOS 27 Golden Gate 系统变成一台随时可开发的机器，内容包括 Homebrew、带 Powerlevel10k 的 Oh My Zsh 和 Fira Code Nerd Font、一系列命令行工具（git、gh、nvm 加 Node、Neovim/LazyVim、tmux、ripgrep、fzf 等）、通过 Homebrew Cask 安装的图形应用、用于 GitHub 的 SSH 密钥，以及一个每夜清理脚本。 作"
date: "2026-10-09T00:18:36.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x175hx/scripts_to_set_up_a_fresh_macos_27_mac_for/"
tags: ["source/reddit","topics/coding"]
---

一位开发者分享了一组脚本，可把全新安装的 macOS 27 Golden Gate 系统变成一台随时可开发的机器，内容包括 Homebrew、带 Powerlevel10k 的 Oh My Zsh 和 Fira Code Nerd Font、一系列命令行工具（git、gh、nvm 加 Node、Neovim/LazyVim、tmux、ripgrep、fzf 等）、通过 Homebrew Cask 安装的图形应用、用于 GitHub 的 SSH 密钥，以及一个每夜清理脚本。

作者在干净的 macOS 27 虚拟机上做了端到端测试，并报告了两个只在那种环境下出现的问题。第一个是 Xcode 许可证检查：全新安装通常只有 Command Line Tools，因此 xcodebuild -license check 总是失败，并可能在安装刚开始时就中断整个流程。他的修复办法是仅当存在完整的 Xcode.app 时才执行该检查——先判断 xcode-select -p 是否指向 .app 包内部，若是，再运行检查或用 sudo 接受许可证。

第二个问题是 macOS 看不到已安装的字体：字体文件有时会落到 &#126;/Library/Fonts，但系统要等到重新登录才会列出它们。他的解决办法是用一段简短的 JavaScript for Automation 代码，通过 CTFontManagerRegisterFontsForURL 把每个字体文件注册到 CoreText，据称约两秒即可解决，并用通配符应用到 FiraCodeNerdFont 系列文件。他表示脚本已在 27.0 上测试过，欢迎在其他人的全新安装上试用后反馈结果。作者是 /u/Zestyclose-Log-7485。
