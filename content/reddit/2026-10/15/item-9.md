---
publish: true
content_type: "post"
title: "Opus 5.5 Reasoning is Unbelievable."
description: "A user describes a puzzling OneDrive-related problem after a suspected intrusion and says a single prompt to Opus 5.5 produced a plausible explanation, even though the model was given no environment context. The situation: the user belie..."
date: "2026-10-14T18:58:12.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:05:18.966Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x5zu8m/opus_55_reasoning_is_unbelievable/"
tags: ["source/reddit","topics/agents","topics/models","topics/security-privacy"]
---

A user describes a puzzling OneDrive-related problem after a suspected intrusion and says a single prompt to Opus 5.5 produced a plausible explanation, even though the model was given no environment context.

The situation: the user believed someone had exfiltrated their OneDrive, cleaned the PC, but saw OneDrive still behaving strangely. Their question to the model was why the desktop background visually changed to OneDrive while they had OneDrive disabled.

The model's answer was that three separate Microsoft automations fired within the same few days and together mimic a OneDrive takeover. It presented a timeline drawn from the registry: on Jun 21 the user disabled OneDrive autostart and OneDrive logged it; on Oct 11 at 18:53 Windows silently switched the background to Windows Spotlight; on Oct 12 at 19:40 OneDrive's daily updater downloaded a new build; on Oct 13 at 08:34 OneDrive's logon scheduled task launched it anyway; and on Oct 14 at 12:49, at that day's logon, OneDrive re-enabled its own autostart entry.

On why it runs despite being disabled, the explanation is that the Startup Apps toggle only controls the Run registry entry. OneDrive has two more launch paths the toggle does not touch: a scheduled task that runs its launcher at every logon, and a daily updater task. The October 12 update restored the Run entry, and the logon task started it regardless. The model characterized this as stock OneDrive behavior, not leftover compromise.

On the background change, the wallpaper is no longer a file the user picked. Windows flipped to Spotlight on October 11, which pulls rotating images from Microsoft and adds a "Learn about this picture" icon to the desktop. The model attributed that to Windows rather than OneDrive, noting it happened the same week and therefore reads as one event.

On why OneDrive appears over the desktop, once it launched it scanned the folders, found about 11.7 GB on Desktop, Documents and Pictures, and queued its "back up your folders" campaign. That full-window prompt at sign-in is the takeover the user was seeing. The post adds that the actual Desktop folder is still the local one and the OneDrive Desktop folder is empty, so nothing has moved.

The proposed fix is four changes, which the poster notes had not been applied: disable the two OneDrive scheduled tasks &#40;Startup and Standalone Update&#41; so the toggle sticks; remove the Run entry again; set the Microsoft policy that blocks the folder backup prompt; and switch the background back from Spotlight to a picture of the user's choosing under Settings, Personalization, Background. If the user wants OneDrive fully gone instead, unlinking the account and uninstalling covers all four.

The poster frames the episode as striking because the model reportedly reasoned about the environment with zero context. Note that the diagnosis is the model's own claim as relayed by the user, and the specific fixes are the model's suggestions that the poster had not personally verified by applying them.
