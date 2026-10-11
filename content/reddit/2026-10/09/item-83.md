---
publish: true
content_type: "post"
title: "Scripts to set up a fresh macOS 27 Mac for development"
description: "A developer shares scripts that take a fresh macOS 27 Golden Gate installation to a machine ready for development, covering Homebrew, Oh My Zsh with Powerlevel10k and the Fira Code Nerd Font, CLI tools including git, gh, nvm with Node, Neov"
date: "2026-10-09T00:18:36.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x175hx/scripts_to_set_up_a_fresh_macos_27_mac_for/"
tags: ["source/reddit","topics/coding"]
---

A developer shares scripts that take a fresh macOS 27 Golden Gate installation to a machine ready for development, covering Homebrew, Oh My Zsh with Powerlevel10k and the Fira Code Nerd Font, CLI tools including git, gh, nvm with Node, Neovim/LazyVim, tmux, ripgrep and fzf, GUI applications installed via Homebrew Cask, an SSH key for GitHub, and a nightly cleanup script.

They tested the scripts end to end on clean macOS 27 virtual machines, and report two bugs that only appeared there. The first is the Xcode license check: on a clean install you usually have only the Command Line Tools, so &#96;xcodebuild -license check&#96; always fails and can abort the setup before it starts. Their fix runs the check only when a full Xcode.app is present, testing whether &#96;xcode-select -p&#96; points inside an .app bundle and, if so, running the check or accepting the license with sudo.

The second is fonts that macOS does not see: font files sometimes land in &#126;/Library/Fonts but are not listed by the system until logout. Their workaround registers each file with CoreText through a short JavaScript for Automation snippet using CTFontManagerRegisterFontsForURL, which they say fixes it in about two seconds, applied to the FiraCodeNerdFont files by wildcard. They state the scripts were tested on 27.0 and invite reports from others who try them on a fresh install. The author is /u/Zestyclose-Log-7485.
