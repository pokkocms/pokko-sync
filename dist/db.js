"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeSync = exports.initDb = exports.getStamp = exports.getAsync = exports.allAsync = exports.getDb = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const dbMap = new Map();
const dbPath = (project) => process.env.GSH_DB
    ? path_1.default.join(process.cwd(), process.env.GSH_DB + project)
    : ":memory:";
exports.getDb = (project) => {
    if (dbMap.has(project)) {
        return dbMap.get(project);
    }
    else {
        const db = new sqlite3_1.default.Database(dbPath(project));
        dbMap.set(project, db);
        return db;
    }
};
const execAsync = (db, sql) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            err ? reject(err) : resolve();
        });
    });
});
const runAsync = (db, sql, params) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            err ? reject(err) : resolve();
        });
    });
});
exports.allAsync = (db, sql) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        db.all(sql, (err, res) => {
            err ? reject(err) : resolve(res);
        });
    });
});
exports.getAsync = (db, sql, params) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, res) => {
            err ? reject(err) : resolve(res);
        });
    });
});
exports.getStamp = (db) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield exports.getAsync(db, "select max(modified_at) as stamp from sync");
    return (res === null || res === void 0 ? void 0 : res.stamp) || null;
});
exports.initDb = (db) => __awaiter(void 0, void 0, void 0, function* () {
    yield execAsync(db, `create table if not exists sync (
    id text not null,
    created_at text not null,
    modified_at text not null,
    deleted_at text,
    type text not null,
    action text not null,
    payload text not null,
    primary key ( id )
  ) without rowid`);
    yield execAsync(db, `create table if not exists model (
    id text not null,
    alias text not null,
    value_base text not null,
    inherits text not null,
    usage text not null,
    primary key ( id )
  ) without rowid`);
    yield execAsync(db, `create table if not exists model_field (
    id text not null,
    model_id text not null,
    alias text not null,
    type text not null,
    config text not null,
    primary key ( id ),
    foreign key ( model_id ) references model ( id )
  ) without rowid`);
    yield execAsync(db, `create table if not exists entry (
    id text not null,
    model_id text not null,
    value text not null,
    primary key ( id ),
    foreign key ( model_id ) references model ( id )
  ) without rowid`);
    yield execAsync(db, `create table if not exists media_item (
    id text not null,
    content_type text not null,
    storage text not null,
    size text not null,
    primary key ( id )
  ) without rowid`);
    yield execAsync(db, `create table if not exists taxonomy (
    id text not null,
    alias text not null,
    parent_id text,
    config text,
    path text not null,
    type text not null,
    entry_id text,
    primary key ( id )
  ) without rowid`);
});
exports.storeSync = (db, data) => __awaiter(void 0, void 0, void 0, function* () {
    for (var record of data) {
        const params = [
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
        yield runAsync(db, `replace into sync ( id, created_at, modified_at, deleted_at, type, action, payload ) values ( ?, ?, ?, ?, ?, ?, ?)`, params);
        switch (record.type) {
            case "entry":
                switch (record.action) {
                    case "create":
                    case "change":
                        {
                            const params = [
                                record.id,
                                record.payload.model_id,
                                JSON.stringify(record.payload.value),
                            ];
                            yield runAsync(db, `replace into entry ( id, model_id, value ) values ( ?, ?, ? )`, params);
                        }
                        break;
                    case "delete":
                        {
                            yield runAsync(db, `delete from entry where id = ?`, [record.id]);
                        }
                        break;
                }
                break;
            case "model":
                switch (record.action) {
                    case "create":
                    case "change":
                        {
                            const params = [
                                record.id,
                                record.payload.alias,
                                JSON.stringify(record.payload.value_base) || "{}",
                                JSON.stringify(record.payload.inherits),
                                record.payload.usage,
                            ];
                            yield runAsync(db, `replace into model ( id, alias, value_base, inherits, usage ) values ( ?, ?, ?, ?, ? )`, params);
                        }
                        break;
                    case "delete":
                        {
                            yield runAsync(db, `delete from model where id = ?`, [record.id]);
                        }
                        break;
                }
                break;
            case "model_field":
                switch (record.action) {
                    case "create":
                    case "change":
                        {
                            const params = [
                                record.id,
                                record.payload.model_id,
                                record.payload.alias,
                                record.payload.type,
                                JSON.stringify(record.payload.config),
                            ];
                            yield runAsync(db, `replace into model_field ( id, model_id, alias, type, config ) values ( ?, ?, ?, ?, ? )`, params);
                        }
                        break;
                    case "delete":
                        {
                            yield runAsync(db, `delete from model_field where id = ?`, [
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
                            const params = [
                                record.id,
                                record.payload.content_type,
                                JSON.stringify(record.payload.storage),
                                record.payload.size,
                            ];
                            yield runAsync(db, `replace into media_item ( id, content_type, storage, size ) values ( ?, ?, ?, ? )`, params);
                        }
                        break;
                    case "delete":
                        {
                            yield runAsync(db, `delete from media_item where id = ?`, [
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
                            const params = [
                                record.id,
                                record.payload.alias,
                                record.payload.parent_id,
                                JSON.stringify(record.payload.config),
                                JSON.stringify(record.payload.path),
                                record.payload.type,
                                record.payload.entry_id,
                            ];
                            yield runAsync(db, `replace into taxonomy ( id, alias, parent_id, config, path, type, entry_id ) values ( ?, ?, ?, ?, ?, ?, ? )`, params);
                        }
                        break;
                    case "delete":
                        {
                            yield runAsync(db, `delete from taxonomy where id = ?`, [
                                record.id,
                            ]);
                        }
                        break;
                }
                break;
        }
    }
});
