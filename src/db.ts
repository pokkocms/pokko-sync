import sqlite3 from "sqlite3";
import path from "path";

const dbMap = new Map<string, sqlite3.Database>();

const dbPath = (project: string): string =>
  process.env.GSH_DB
    ? path.join(process.cwd(), process.env.GSH_DB + project)
    : ":memory:";

export const getDb = (project: string): sqlite3.Database => {
  if (dbMap.has(project)) {
    return dbMap.get(project)!;
  } else {
    const db = new sqlite3.Database(dbPath(project));

    dbMap.set(project, db);

    return db;
  }
};

const execAsync = async (db: sqlite3.Database, sql: string): Promise<void> =>
  new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      err ? reject(err) : resolve();
    });
  });

const runAsync = async (
  db: sqlite3.Database,
  sql: string,
  params: any[]
): Promise<void> =>
  new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      err ? reject(err) : resolve();
    });
  });

export const allAsync = async (
  db: sqlite3.Database,
  sql: string
): Promise<any[]> =>
  new Promise((resolve, reject) => {
    db.all(sql, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });

export const getAsync = async (
  db: sqlite3.Database,
  sql: string,
  params?: any[]
): Promise<any> =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });

export const getStamp = async (
  db: sqlite3.Database
): Promise<string | null> => {
  const res = await getAsync(db, "select max(modified_at) as stamp from sync");

  return res?.stamp || null;
};

export const initDb = async (db: sqlite3.Database): Promise<void> => {
  await execAsync(
    db,
    `create table if not exists sync (
    id text not null,
    created_at text not null,
    modified_at text not null,
    deleted_at text,
    type text not null,
    action text not null,
    payload text not null,
    primary key ( id )
  ) without rowid`
  );

  await execAsync(
    db,
    `create table if not exists model (
    id text not null,
    alias text not null,
    value_base text not null,
    inherits text not null,
    usage text not null,
    primary key ( id )
  ) without rowid`
  );

  await execAsync(
    db,
    `create table if not exists model_field (
    id text not null,
    model_id text not null,
    alias text not null,
    type text not null,
    config text not null,
    primary key ( id ),
    foreign key ( model_id ) references model ( id )
  ) without rowid`
  );

  await execAsync(
    db,
    `create table if not exists entry (
    id text not null,
    model_id text not null,
    value text not null,
    primary key ( id ),
    foreign key ( model_id ) references model ( id )
  ) without rowid`
  );

  await execAsync(
    db,
    `create table if not exists media_item (
    id text not null,
    content_type text not null,
    storage text not null,
    size text not null,
    primary key ( id )
  ) without rowid`
  );

  await execAsync(
    db,
    `create table if not exists taxonomy (
    id text not null,
    alias text not null,
    parent_id text,
    config text,
    path text not null,
    type text not null,
    entry_id text,
    primary key ( id )
  ) without rowid`
  );
};

export const storeSync = async (
  db: sqlite3.Database,
  data: any[]
): Promise<void> => {
  for (var record of data) {
    const params: string[] = [
      record.id,
      new Date(parseInt(record.createdAt, 10)).toISOString(),
      new Date(parseInt(record.modifiedAt, 10)).toISOString(),
      record.deletedAt
        ? new Date(parseInt(record.deletedAt, 10)).toISOString()
        : null,
      record.type,
      record.action,
      JSON.stringify(record.payload),
    ];

    await runAsync(
      db,
      `replace into sync ( id, created_at, modified_at, deleted_at, type, action, payload ) values ( ?, ?, ?, ?, ?, ?, ?)`,
      params
    );

    switch (record.type) {
      case "entry":
        switch (record.action) {
          case "create":
          case "change":
            {
              const params: string[] = [
                record.id,
                record.payload.model_id,
                JSON.stringify(record.payload.value),
              ];
              await runAsync(
                db,
                `replace into entry ( id, model_id, value ) values ( ?, ?, ? )`,
                params
              );
            }
            break;
          case "delete":
            {
              await runAsync(db, `delete from entry where id = ?`, [record.id]);
            }
            break;
        }
        break;
      case "model":
        switch (record.action) {
          case "create":
          case "change":
            {
              const params: string[] = [
                record.id,
                record.payload.alias,
                JSON.stringify(record.payload.value_base) || "{}",
                JSON.stringify(record.payload.inherits),
                record.payload.usage,
              ];
              await runAsync(
                db,
                `replace into model ( id, alias, value_base, inherits, usage ) values ( ?, ?, ?, ?, ? )`,
                params
              );
            }
            break;
          case "delete":
            {
              await runAsync(db, `delete from model where id = ?`, [record.id]);
            }
            break;
        }
        break;
      case "model_field":
        switch (record.action) {
          case "create":
          case "change":
            {
              const params: string[] = [
                record.id,
                record.payload.model_id,
                record.payload.alias,
                record.payload.type,
                JSON.stringify(record.payload.config),
              ];
              await runAsync(
                db,
                `replace into model_field ( id, model_id, alias, type, config ) values ( ?, ?, ?, ?, ? )`,
                params
              );
            }
            break;
          case "delete":
            {
              await runAsync(db, `delete from model_field where id = ?`, [
                record.id,
              ]);
            }
            break;
        }
        break;
      case "media_item":
        switch (record.action) {
          case "create":
          case "change":
            {
              const params: string[] = [
                record.id,
                record.payload.content_type,
                JSON.stringify(record.payload.storage),
                record.payload.size,
              ];
              await runAsync(
                db,
                `replace into media_item ( id, content_type, storage, size ) values ( ?, ?, ?, ? )`,
                params
              );
            }
            break;
          case "delete":
            {
              await runAsync(db, `delete from media_item where id = ?`, [
                record.id,
              ]);
            }
            break;
        }
        break;
      case "taxonomy":
        switch (record.action) {
          case "create":
          case "change":
            {
              const params: string[] = [
                record.id,
                record.payload.alias,
                record.payload.parent_id,
                JSON.stringify(record.payload.config),
                JSON.stringify(record.payload.path),
                record.payload.type,
                record.payload.entry_id,
              ];
              await runAsync(
                db,
                `replace into taxonomy ( id, alias, parent_id, config, path, type, entry_id ) values ( ?, ?, ?, ?, ?, ?, ? )`,
                params
              );
            }
            break;
          case "delete":
            {
              await runAsync(db, `delete from taxonomy where id = ?`, [
                record.id,
              ]);
            }
            break;
        }
        break;
    }
  }
};
