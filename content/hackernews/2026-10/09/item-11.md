---
publish: true
content_type: "post"
title: "What the iPhone Duo means for web development (and Video.js)"
description: "The Video.js team used a weekend side project to investigate which web platform APIs Apple exposes for the foldable iPhone Duo, after releasing Video.js v10.0.0. Apple published six videos on building apps for the device, and the author, an"
date: "2026-10-08T17:16:38.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://videojs.org/blog/iphone-duo-web-development"
discussion_url: "https://news.ycombinator.com/item?id=50008709"
tags: ["source/hackernews","topics/coding","topics/hardware","topics/products"]
---

## Article

The Video.js team used a weekend side project to investigate which web platform APIs Apple exposes for the foldable iPhone Duo, after releasing Video.js v10.0.0. Apple published six videos on building apps for the device, and the author, an iOS user, downloaded Xcode 27.1 beta1, booted an iPhone Duo in the simulator Device Hub, and inspected the WebKit feature flags listed in Settings to see what was actually available to web developers.

Two APIs were the focus. The Device Posture API reports whether the display is continuous or folded, exposed in JavaScript as navigator.devicePosture and in CSS as @media &#40;device-posture: folded&#41;. The Viewport Segments API describes the individual regions of the display: window.viewport.segments returns an array of DOMRects with each segment's size, shape and location, while CSS can query @media &#40;horizontal-viewport-segments: n&#41; and @media &#40;vertical-viewport-segments: n&#41;, or read positions and sizes through environment variables such as env&#40;viewport-segment-width 1 0&#41;, where the first number is the horizontal index and the second the vertical index. The article shows a full-bleed two-column layout snapped to each half of a folded screen so content avoids the crease.

Motivated by the Netflix iPhone Duo app, which puts video in the top half and controls in the bottom with a reflection flourish on the lower screen, the author tested whether Video.js could reproduce that player. The short answer was no: despite an open Duo being roughly an iPad, Apple still does not allow custom elements to enter fullscreen, leaving developers with native controls. The author notes the Fullscreen API was nevertheless present as an experimental feature flag, and enabled it to look further. The footage ends mid-sentence, so the outcome of that experiment is not described.

## Images and video

- [Image: WebKit feature flags in the Settings app on a folded iPhone Duo in the Device Hub](<https://videojs.org/.netlify/images?url=_astro%2Fsafari-feature-flags.CFLihoAx.png&w=2492&h=1724&dpl=6ac947d4ee38ca00087969df>)
- [Image: The same Settings layout on a partially folded iPhone Duo, with each column snapped to one half of the screen](<https://videojs.org/.netlify/images?url=_astro%2Flayout-folded.BY-r73Da.webp&w=1976&h=1742&dpl=6ac947d4ee38ca00087969df>)
- [Image: Video.js controls in fullscreen on a folded iPhone Duo, with the video on the top half and the control bar at the bottom of the screen](<https://videojs.org/.netlify/images?url=_astro%2Fvideojs-fullscreen.BLPrpZym.png&w=2496&h=2090&dpl=6ac947d4ee38ca00087969df>)
