import { spawn, type ChildProcess } from 'node:child_process';

export function stopAgentProcess(child: ChildProcess): void {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    killer.on('error', () => child.kill('SIGKILL')); killer.unref();
  } else { try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); } }
}
export async function closeAgentProcess(child: ChildProcess, closed: Promise<void>): Promise<void> {
  child.stdin?.end();
  const kill = setTimeout(() => stopAgentProcess(child), 2000);
  let deadline: NodeJS.Timeout | undefined;
  const stopped = new Promise<void>(done => {
    deadline = setTimeout(() => {
      child.stdin?.destroy(); child.stdout?.destroy(); child.stderr?.destroy(); child.unref(); done();
    }, 3000);
  });
  try { await Promise.race([closed, stopped]); }
  finally { clearTimeout(kill); if (deadline) clearTimeout(deadline); }
}
