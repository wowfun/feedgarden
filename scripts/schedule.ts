import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { userInfo } from 'node:os';

// Generate reviewable files only. Activation is a separate user-controlled step.
const { values } = parseArgs({ options: { distro: { type: 'string' }, output: { type: 'string', default: '.local/scheduler' } } });
const root = process.cwd(), output = resolve(values.output!);
if (/[\r\n]/.test(root + output) || root.trim() !== root) throw new Error('Scheduler paths must be single-line paths without surrounding whitespace');
await mkdir(output, { recursive: true });
const quote = (value: string) => "'" + value.replace(/'/g, "'\\''") + "'";
const script = '#!/bin/bash\nset -euo pipefail\ncd ' + quote(root) + '\nif [[ -f .local/runner.env ]]; then\n  set -a\n  source .local/runner.env\n  set +a\nfi\nexec ' + quote(process.execPath) + ' --import tsx src/cli.ts run --due\n';
await writeFile(join(output, 'run.sh'), script, { mode: 0o700 });
const unitQuote = (value: string) => '"' + value.replace(/[%\\"]/g, char => char === '%' ? '%%' : '\\' + char) + '"';
await writeFile(join(output, 'feedgarden.service'), '[Unit]\nDescription=Collect and publish Feedgarden reports\nAfter=network-online.target\n\n[Service]\nType=oneshot\nWorkingDirectory=' + root.replace(/%/g, '%%') + '\nExecStart=/bin/bash ' + unitQuote(join(output, 'run.sh')) + '\nTimeoutStartSec=2h\n');
await writeFile(join(output, 'feedgarden.timer'), '[Unit]\nDescription=Check Feedgarden tasks every 15 minutes\n\n[Timer]\nOnCalendar=*:0/15\nPersistent=true\nRandomizedDelaySec=30\n\n[Install]\nWantedBy=timers.target\n');
const distro = values.distro ?? process.env.WSL_DISTRO_NAME;
if (distro) {
  const xml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  if (/["\r\n]/.test(distro + root + userInfo().username)) throw new Error('Unsupported WSL argument characters');
  const argumentsText = '-d "' + distro + '" -u "' + userInfo().username + '" --cd "' + root + '" --exec /bin/bash "' + join(output, 'run.sh') + '"';
  await writeFile(join(output, 'Feedgarden.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>Run Feedgarden in WSL every 15 minutes. Requires the owning Windows user to be logged in.</Description></RegistrationInfo>
  <Triggers><CalendarTrigger><Repetition><Interval>PT15M</Interval><Duration>P1D</Duration><StopAtDurationEnd>false</StopAtDurationEnd></Repetition><StartBoundary>2026-09-29T00:00:00</StartBoundary><Enabled>true</Enabled><ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay></CalendarTrigger></Triggers>
  <Principals><Principal id="Author"><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals>
  <Settings><MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy><DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries><StopIfGoingOnBatteries>false</StopIfGoingOnBatteries><StartWhenAvailable>true</StartWhenAvailable><RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable><ExecutionTimeLimit>PT2H</ExecutionTimeLimit><Enabled>true</Enabled></Settings>
  <Actions Context="Author"><Exec><Command>wsl.exe</Command><Arguments>${xml(argumentsText)}</Arguments></Exec></Actions>
</Task>
`);
}
console.log('Generated scheduler files in ' + output + '. Activate either Windows Task Scheduler (WSL) or systemd (native Linux), not both.');
