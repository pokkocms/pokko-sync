"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = void 0;
const core_1 = require("@apollo/client/core");
exports.createClient = (project, token) => new core_1.ApolloClient({
    link: new core_1.HttpLink({
        uri: `https://hon.takeoffgo.com/${project}/graphql`,
        headers: {
            "X-Token": token,
        },
    }),
    cache: new core_1.InMemoryCache(),
});
