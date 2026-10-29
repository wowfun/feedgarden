import { resolve } from 'node:path';
import { loadConfig } from '../src/instance/index.js';
import { packageRoot } from '../src/platform/resources.js';
export function developmentConfig(file?:string){return loadConfig(file??resolve(packageRoot,'feedgarden.development.jsonc'));}
