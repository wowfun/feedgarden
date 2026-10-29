export { DatabaseSession as TestDatabase } from '../../src/storage/database.js';
export { itemWindowSql } from '../../src/storage/window-sql.js';

import type { InstanceContext } from '../../src/instance/index.js';
import { DatabaseSession } from '../../src/storage/database.js';
import { openInstance } from '../../src/storage/index.js';
/** Fixture-only escape hatch for seeding, fault injection and read-only-write rejection tests. */
export function openTestInstance(config:InstanceContext,readonly=false):DatabaseSession {return (readonly?openInstance(config,true):openInstance(config)) as DatabaseSession;}
