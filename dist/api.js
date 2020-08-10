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
exports.runSync = void 0;
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const db_1 = require("./db");
const client_1 = require("./client");
const syncQuery = graphql_tag_1.default `
  query($after: String, $skip: Int!) {
    sync(skip: $skip, take: 500, filter: { after: $after }) {
      nodes {
        id
        createdAt
        modifiedAt
        deletedAt
        type
        action
        payload
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;
const loadPage = (client, after, skip) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield client.query({
        query: syncQuery,
        variables: { after, skip },
    });
    if (res.data.sync.pageInfo.hasNextPage) {
        return res.data.sync.nodes.concat(yield loadPage(client, after, skip + res.data.sync.nodes.length));
    }
    else {
        return res.data.sync.nodes;
    }
});
exports.runSync = (project, environment, token) => __awaiter(void 0, void 0, void 0, function* () {
    const db = db_1.getDb(project, environment);
    yield db_1.initDb(db);
    const client = client_1.createClient(project, environment, token);
    const after = yield db_1.getStamp(db);
    const res = yield loadPage(client, after, 0);
    yield db_1.storeSync(db, res);
});
