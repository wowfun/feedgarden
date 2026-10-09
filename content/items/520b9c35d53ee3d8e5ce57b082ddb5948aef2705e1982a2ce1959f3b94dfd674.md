---
publish: true
content_type: "post"
title: "Fix: Claude Desktop installation fails with 0x80073CF6 and “windows.service: Access is denied”"
description: "A user documents how they diagnosed and fixed a Claude Desktop installation failure on Windows, with help from ChatGPT, and shares it in case others hit the same problem. Every install attempt failed with \"Installation failed: AddPackage fa"
date: "2026-10-09T11:24:09.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1it4r/fix_claude_desktop_installation_fails_with/"
tags: ["source/reddit","topics/coding","topics/hardware"]
---

A user documents how they diagnosed and fixed a Claude Desktop installation failure on Windows, with help from ChatGPT, and shares it in case others hit the same problem. Every install attempt failed with "Installation failed: AddPackage failed," and after removing wedged packages, with HRESULT 0x80073CF6. The old Claude package was stuck in a Servicing state with PackageUserInformation showing S-1-5-18 &#91;S-1-5-18&#93;: Staged.

The installer log contained "failed to remove conflicting service: could not open CoworkVMService: Access is denied," and the Windows AppX deployment log showed the underlying cause: error 0x80070005, the system could not register the windows.service extension because access was denied. In this case an orphaned CoworkVMService left by an older Claude installation prevented the new package from registering its service. The author stresses that the fix applies specifically to installations where the AppX event log reports this 0x80070005 denial, and warns against deleting unrelated service registry entries.

The write-up gives a five-step procedure. First confirm the diagnosis: run an administrator PowerShell command listing Claude AppX packages, query CoworkVMService with sc.exe, and query the Microsoft-Windows-AppXDeploymentServer/Operational log for messages matching Claude, pzs8sxrjxfjjc or 0x80073CF6; only continue if the log explicitly states the service extension failure. Second, try normal removal with Stop-Service and sc.exe delete, which for the author failed with "Access is denied" even as Administrator, and also failed when run as SYSTEM because it is an AppX packaged service. Third, back up the stale service registry key with reg.exe export to a .reg file on the desktop. Fourth, remove the orphaned entry as SYSTEM: create a scheduled task running reg.exe delete on HKLM&#92;SYSTEM&#92;CurrentControlSet&#92;Services&#92;CoworkVMService, run it, read the output file &#40;it should say the operation completed successfully&#41;, then delete the task. Fifth, restart Windows and verify with sc.exe query CoworkVMService, which should return FAILED 1060, meaning the service no longer exists. After that, the author reports the latest Claude installer completed successfully, even though the old AppX package still appeared as Staged and Servicing after the restart.
