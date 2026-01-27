declare module "better-sqlite3" {
  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): this;
    pragma(sql: string, options?: unknown): unknown;
    close(): this;
  }

  interface Statement {
    run(...params: unknown[]): Info;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    iterate(...params: unknown[]): IterableIterator<unknown>;
  }

  interface Info {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Options {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (message?: unknown, ...additionalArgs: unknown[]) => void;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: Options): Database;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
