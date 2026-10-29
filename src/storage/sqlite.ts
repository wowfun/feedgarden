import { existsSync } from 'node:fs';
import { DatabaseSync, backup, type SQLInputValue, type StatementSync } from 'node:sqlite';

/** Small synchronous storage boundary; nested transactions use savepoints. */
export default class Database {
  readonly connection: DatabaseSync;
  private sequence = 0;
  constructor(path: string, options: { readonly?: boolean; fileMustExist?: boolean } = {}) {
    if (options.fileMustExist && path !== ':memory:' && !existsSync(path))
      throw new Error('Database file does not exist: ' + path);
    this.connection = new DatabaseSync(path, {
      readOnly: options.readonly ?? false,
      enableForeignKeyConstraints: true,
    });
    this.connection.exec('PRAGMA busy_timeout=5000');
  }
  get inTransaction(): boolean {
    return this.connection.isTransaction;
  }
  exec(sql: string): this {
    this.connection.exec(sql);
    return this;
  }
  close(): void {
    this.connection.close();
  }
  prepare(sql: string): Statement {
    return new Statement(this.connection.prepare(sql));
  }
  pragma(sql: string, options?: { simple?: boolean }): unknown {
    const rows = this.prepare('PRAGMA ' + sql).all();
    return options?.simple ? Object.values(rows[0] ?? {})[0] : rows;
  }
  transaction<T extends (...args: any[]) => any>(fn: T): T & { immediate: T; deferred: T; exclusive: T } {
    const wrap = (mode: string) =>
      ((...args: Parameters<T>): ReturnType<T> => {
        const nested = this.inTransaction,
          point = 'fdg_' + ++this.sequence;
        this.exec(nested ? 'SAVEPOINT ' + point : 'BEGIN ' + mode);
        try {
          const value = fn(...args);
          if (value instanceof Promise) throw new TypeError('SQLite transactions must be synchronous');
          this.exec(nested ? 'RELEASE ' + point : 'COMMIT');
          return value;
        } catch (error) {
          if (this.inTransaction)
            this.exec(nested ? 'ROLLBACK TO ' + point + '; RELEASE ' + point : 'ROLLBACK');
          throw error;
        }
      }) as T;
    return Object.assign(wrap('IMMEDIATE'), {
      immediate: wrap('IMMEDIATE'),
      deferred: wrap('DEFERRED'),
      exclusive: wrap('EXCLUSIVE'),
    });
  }
  async backup(path: string): Promise<void> {
    // Node 24.12 / early 26 resolve backup outside a callback scope
    // (nodejs/node#65666). Keep a bounded event-loop wakeup while it is pending.
    const wakeup = setInterval(() => { }, 10);
    try {
      await backup(this.connection, path);
    } finally {
      clearInterval(wakeup);
    }
  }
}
export class Statement {
  constructor(private readonly native: StatementSync) { }
  run(...args: any[]): { changes: number; lastInsertRowid: number | bigint } {
    const result = this.native.run(...(args as SQLInputValue[]));
    return { changes: Number(result.changes), lastInsertRowid: result.lastInsertRowid };
  }
  private row(row: Record<string, unknown>): any {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        value instanceof Uint8Array ? Buffer.from(value) : value,
      ]),
    );
  }
  get(...args: any[]): any {
    const row = this.native.get(...(args as SQLInputValue[]));
    return row && this.row(row);
  }
  all(...args: any[]): any[] {
    return this.native.all(...(args as SQLInputValue[])).map((row) => this.row(row));
  }
  *iterate(...args: any[]): IterableIterator<any> {
    for (const row of this.native.iterate(...(args as SQLInputValue[]))) yield this.row(row);
  }
}
// The namespace keeps database/statement types at the adapter boundary.
