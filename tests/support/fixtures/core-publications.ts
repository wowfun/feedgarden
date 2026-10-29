import { readdir,readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { InstanceContext as Config } from '../../../src/instance/index.js';

import type { TestDatabase as Store } from '../database.js';
/** Model a prior explicit archive import, preserving fixture bytes as core evidence. */
export async function snapshotPublications(config:Config,store:Store){
  for(const entry of await readdir(config.feed.directory,{withFileTypes:true}).catch(()=>[])){
    if(entry.isFile()&&entry.name.endsWith('.md'))store.statement('INSERT OR REPLACE INTO feed_archive_files VALUES(?,?)').run(entry.name,await readFile(join(config.feed.directory,entry.name)));
  }
}
