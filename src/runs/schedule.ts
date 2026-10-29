import { join, resolve } from 'node:path';
import type { InstanceContext } from '../instance/index.js';

import { DateTime } from 'luxon';
import { FdgError } from '../contracts/errors.js';
import { atomicWrite } from '../platform/files.js';
import { openInstance } from '../storage/index.js';
import { runStatus } from './lifecycle.js';
import { invocation, pinRuntime, stableRuntime } from './runtime.js';
const xml = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const winArg = (s: string) => '"' + s.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, '$1$1') + '"';
export function scheduledScope(
  config: InstanceContext,
  sourceId: string,
  expectedInstance: string,
  at: DateTime = DateTime.now(),
) {
  if (config.instanceId !== expectedInstance)
    throw new FdgError('INSTANCE_MISMATCH', 'Scheduler belongs to another instance');
  const source = config.sources.find((s) => s.id === sourceId && s.enabled);
  if (!source) throw new FdgError('CONFIG_CHANGED', 'Scheduled source is no longer enabled');
  const local = at.setZone(config.timezone),
    [hour, minute] = source.processAfter.split(':').map(Number),
    due = local.startOf('day').set({ hour: hour!, minute: minute! });
  const key = source.id + ':' + local.toISODate(),
    store = openInstance(config, true);
  try {
    const previous = store.maintenance.scheduledRun(key);
    if (local < due) return { skip: 'not_ready', dueAt: due.toUTC().toISO(), key };
    if (previous && ['completed', 'queued', 'running'].includes(runStatus(store, previous.id).state))
      return { skip: 'already_scheduled', runId: previous.id, key };
    return { key };
  } finally {
    store.close();
  }
}
export async function prepareSchedule(config: InstanceContext, platform: string, output?: string) {
  if (!['windows', 'systemd', 'launchd'].includes(platform))
    throw new FdgError('BAD_INPUT', '--platform must be windows, systemd or launchd');
  const runtime = await stableRuntime(config),
    directory = resolve(output ?? config.paths.scheduler),
    files: string[] = [];
  await pinRuntime(runtime);
  // A native 15-minute tick evaluates instance-local readiness and a durable daily
  // key. This also handles DST and hosts whose timezone differs from the instance.
  const jobs = [
    { name: 'collect', args: ['collect', '--due'], time: 'every 15 minutes' },
    ...config.sources
      .filter((s) => s.enabled)
      .map((s) => ({
        name: 'process-' + s.id,
        args: ['_scheduled', s.id, config.instanceId],
        time: s.processAfter,
      })),
  ];
  for (const job of jobs) {
    const argv = invocation(config, runtime.entry, job.args),
      name = 'feedgarden-' + config.instanceId + '-' + job.name;
    if (platform === 'windows') {
      const boundary = DateTime.now()
        .startOf('day')
        .toISO({ includeOffset: false, suppressMilliseconds: true });
      const body =
        '<?xml version="1.0" encoding="UTF-8"?><Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"><RegistrationInfo><Description>' +
        xml(config.instanceId + '; ' + config.timezone + ' ' + job.time) +
        '</Description></RegistrationInfo><Triggers><CalendarTrigger><StartBoundary>' +
        boundary +
        '</StartBoundary><Repetition><Interval>PT15M</Interval><Duration>P1D</Duration></Repetition><ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay></CalendarTrigger></Triggers><Settings><MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy><ExecutionTimeLimit>PT0S</ExecutionTimeLimit></Settings><Actions><Exec><Command>' +
        xml(runtime.executable) +
        '</Command><Arguments>' +
        xml(argv.map(winArg).join(' ')) +
        '</Arguments></Exec></Actions></Task>';
      const path = join(directory, name + '.xml');
      await atomicWrite(path, body);
      files.push(path);
    } else if (platform === 'systemd') {
      const service = join(directory, name + '.service'),
        timer = join(directory, name + '.timer');
      const quote = (s: string) =>
        '"' +
        s.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('%', '%%').replaceAll('$', '$$') +
        '"';
      await atomicWrite(
        service,
        '[Unit]\nDescription=Feedgarden ' +
        job.name +
        '\n[Service]\nType=oneshot\nTimeoutStartSec=infinity\nExecStart=' +
        [runtime.executable, ...argv].map(quote).join(' ') +
        '\n',
      );
      await atomicWrite(
        timer,
        '[Unit]\nDescription=Feedgarden ' +
        job.name +
        '\n[Timer]\nOnCalendar=*-*-* *:00/15:00\nPersistent=true\n[Install]\nWantedBy=timers.target\n',
      );
      files.push(service, timer);
    } else {
      const path = join(directory, name + '.plist');
      await atomicWrite(
        path,
        '<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>Label</key><string>' +
        name +
        '</string><key>ProgramArguments</key><array>' +
        [runtime.executable, ...argv].map((s) => '<string>' + xml(s) + '</string>').join('') +
        '</array><key>StartInterval</key><integer>900</integer></dict></plist>',
      );
      files.push(path);
    }
  }
  return {
    platform,
    instanceId: config.instanceId,
    timezone: config.timezone,
    jobs,
    files,
    activated: false,
    calendarNote:
      'Native 15-minute ticks use instance-timezone readiness and a durable daily processing key.',
  };
}
