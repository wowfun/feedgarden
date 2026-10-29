import { appendFile } from 'node:fs/promises';
import { Writable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { StringDecoder } from 'node:string_decoder';
import { redact } from '../contracts/errors.js';

/** CLI-only adapter for legacy diagnostic writers. Redact complete UTF-8 lines
 * and serialize asynchronous appends without blocking the heartbeat. */
export class Diagnostics extends Writable {
  private decoder = new StringDecoder('utf8');
  private pending = '';
  private dropping = false;
  constructor(private readonly output: (text: string) => unknown, private readonly logFile: () => string | undefined) { super(); }
  private async accept(text: string, final = false): Promise<void> {
    this.pending += text;
    const lines = this.pending.split('\n');
    this.pending = lines.pop()!;
    if (final && this.pending) { lines.push(this.pending); this.pending = ''; }
    for (const line of lines) {
      const clean = this.dropping || line.length > 65536 ? '[Oversized diagnostic line omitted]\n' : redact(line) + '\n';
      this.dropping = false;
      this.output(clean);
      const file = this.logFile();
      if (file) await appendFile(file, clean).catch(() => this.output('Could not append diagnostic log\n'));
    }
    if (this.pending.length > 65536) { this.pending = ''; this.dropping = true; }
  }
  override _write(chunk: Buffer, _encoding: BufferEncoding, done: (error?: Error | null) => void) {
    this.accept(this.decoder.write(chunk)).then(() => done(), done);
  }
  override _final(done: (error?: Error | null) => void) {
    this.accept(this.decoder.end(), true).then(() => done(), done);
  }
  async flush(): Promise<void> { this.end(); await finished(this); }
}
