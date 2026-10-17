---
publish: true
content_type: "post"
title: "I'm 100% blind. I made a piece of software that lets fully blind people use commercial 3D printers along with their 3D slicers."
description: "Edis, a developer who is fully blind, has released AccessSlice, a free open-source Windows program that lets blind and visually impaired people prepare, slice and send 3D prints independently using the JAWS, NVDA or Narrator screen reade..."
date: "2026-10-16T20:33:19.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:50:02.940Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x7r7ul/im_100_blind_i_made_a_piece_of_software_that_lets/"
tags: ["source/reddit","topics/accessibility","topics/coding","topics/hardware"]
---

Edis, a developer who is fully blind, has released AccessSlice, a free open-source Windows program that lets blind and visually impaired people prepare, slice and send 3D prints independently using the JAWS, NVDA or Narrator screen readers. He built it with Claude despite not being a professional programmer, working through repeated explanation, testing with his own screen readers and printers, and fixes rather than a single prompt.

AccessSlice does not replace a slicer; it replaces the screens. It reads settings in a 3MF project — layer height, walls, infill, supports, filaments and object placement — and presents them through accessible pages with headings, labelled fields and buttons. It uses the slicing engines of PrusaSlicer, Bambu Studio, Creality Print, OrcaSlicer and Anycubic Slicer Next, reports print time, filament use and warnings as text, and describes the sliced model layer by layer.

Prints can be sent over the network to supported Prusa and Creality printers, or through Bambu Studio's send window with keyboard instructions; USB is also supported. On supported Prusa and Creality machines, the software can read progress, preheat, load and unload filament, move and home, pause and stop jobs, and manage files without a touchscreen. Edis says he tested it end to end on a Prusa Core One, Bambu Lab X1 Carbon, Bambu Lab H2C and Creality K2 Plus.

He traces the project to a 2023 3D-printing workshop at the Danish Institute for the Blind and Visually Impaired, which focused on sighted people making things for blind people and had no blind or visually impaired participants, and to his frustration with inaccessible slicers after buying a Bambu Lab X1 Carbon. AccessSlice targets practical objects such as tactile maps, emergency plans and Braille labels. Edis argues that slicer companies should make their interfaces accessible in the first place, but says the tool is free for anyone who needs it until they do.

## Media

![Image: I’m 100% blind. I made a piece of software that lets fully blind people use commercial 3D printers along with their 3D slicers.](<https://preview.redd.it/uj7jew4j3wvh1.jpg?width=140&height=140&crop=1:1,smart&auto=webp&s=8b2adee19d43933f58016e7fe5afe8e7522019ed>)

[Image: I’m 100% blind. I made a piece of software that lets fully blind people use commercial 3D printers along with their 3D slicers.](<https://preview.redd.it/uj7jew4j3wvh1.jpg?width=140&height=140&crop=1:1,smart&auto=webp&s=8b2adee19d43933f58016e7fe5afe8e7522019ed>)
