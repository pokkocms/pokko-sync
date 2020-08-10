import sqlite3 from "sqlite3";
export declare const getDb: (project: string, environment: string) => sqlite3.Database;
export declare const allAsync: (db: sqlite3.Database, sql: string) => Promise<any[]>;
export declare const getAsync: (db: sqlite3.Database, sql: string, params?: any[] | undefined) => Promise<any>;
export declare const getStamp: (db: sqlite3.Database) => Promise<string | null>;
export declare const initDb: (db: sqlite3.Database) => Promise<void>;
export declare const storeSync: (db: sqlite3.Database, data: any[]) => Promise<void>;
