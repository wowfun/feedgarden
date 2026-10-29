import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

export const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function fileDigest(path: string): Promise<string> {
  const digest = createHash('sha256'); for await (const chunk of createReadStream(path)) digest.update(chunk); return digest.digest('hex');
}
