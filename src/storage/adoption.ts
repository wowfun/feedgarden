import type { ArchivePost } from '../contracts/archives.js';
import { FdgError } from '../contracts/errors.js';
import { hash } from '../platform/hash.js';
import type { DatabaseSession } from './database.js';
export interface Adoption { reservations: { source: string; id: string; day: string; number: number }[]; posts: Iterable<ArchivePost>; files: Iterable<[string, Buffer]> }
export function adoptArchives(store: DatabaseSession, { reservations, posts, files }: Adoption): void {
  store.db.transaction(() => {
    for (const reservation of reservations)
      store.archives.reserve(reservation.source, reservation.id, reservation.day, reservation.number);
    for (const post of posts) {
      const old = store.archives.post(post.path);
      if (
        old &&
        (old.source !== post.source || old.id !== post.id || old.en !== post.en || old.zh !== post.zh)
      )
        throw new FdgError('PATH_CONFLICT', 'Local archive differs: ' + post.path);
      store.archives.preservePost(
        post.path,
        post.source,
        post.id,
        post.day,
        post.number,
        JSON.stringify(post.item),
        post.en,
        post.zh,
      );
    }
    for (const [path, body] of files) {
      const
        old = store.archives.file(path);
      if (old && hash(old.body) !== hash(body))
        throw new FdgError('PATH_CONFLICT', 'Local retained file differs: ' + path);
      store.archives.preserveFile(path, body);
    }
  })();
}
