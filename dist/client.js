"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = void 0;
const core_1 = require("@apollo/client/core");
const cross_fetch_1 = __importDefault(require("cross-fetch"));
exports.createClient = (project, environment, token) => new core_1.ApolloClient({
    link: new core_1.HttpLink({
        uri: `https://hon.takeoffgo.com/${project}/${environment}/graphql`,
        headers: {
            "X-Token": token,
        },
        fetch: cross_fetch_1.default,
    }),
    cache: new core_1.InMemoryCache(),
});
