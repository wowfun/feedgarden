---
publish: true
content_type: "post"
title: "GTKX: Build Native Linux Apps with React, TypeScript and Adwaita"
description: "GTKX is a React framework for Linux that renders native Adwaita and GTK widgets instead of web views. Developers write React components and TypeScript, use React state and events to update the widgets, rely on Node.js for filesystem and net"
date: "2026-10-08T18:49:24.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/gtkx-org/gtkx"
discussion_url: "https://news.ycombinator.com/item?id=50010240"
tags: ["source/hackernews","topics/coding","topics/products"]
---

## Article

GTKX is a React framework for Linux that renders native Adwaita and GTK widgets instead of web views. Developers write React components and TypeScript, use React state and events to update the widgets, rely on Node.js for filesystem and network access, and can use npm packages that do not require a browser DOM. The project describes itself as targeting GTKX 2.0, which is currently in beta; the stable 2.0 release is scheduled for 1 December 2026, and the 1.x documentation covers the current stable release.

Getting started requires Linux, Node.js 26.7 or later, GTK 4.20 or later, libadwaita 1.8 or later, and the relevant native development libraries. Scaffolding and running an app use the commands npm create gtkx@beta my-app, cd my-app, then npm run dev. The native addon ships prebuilt for x64 and arm64 glibc Linux; other targets must be built from the repository with Rust.

An entry point imports Adwaita components such as AdwApplication, AdwApplicationWindow, AdwHeaderBar and AdwToolbarView from @gtkx/jsx/adw, GtkLabel from @gtkx/jsx/gtk, and createRoot and quit from @gtkx/react, then renders a component tree with createRoot&#40;&#41;.render&#40;&lt;App /&gt;&#41;. The CLI generates @gtkx/jsx elements and @gtkx/gi bindings from the developer's configured native libraries; these are local to the app rather than installed from npm. Widget props are documented in the generated .gtkx/reference/ directory inside the app.

Documentation includes a tutorial that builds, tests and packages a Tasks app for distribution, plus guides on forms, navigation, animation, styling, testing and deployment, an API reference for GTKX package exports, and examples covering a counter, browser, widget showcase, animations, navigation and component stories. The project is licensed under MPL-2.0 and takes contributions through Open Collective, with a published funding plan describing expenses, fees and an operating reserve.
