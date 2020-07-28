import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client/core";
import fetch from "cross-fetch";

export const createClient = (project: string, token: string) =>
  new ApolloClient({
    link: new HttpLink({
      uri: `https://hon.takeoffgo.com/${project}/graphql`,
      headers: {
        "X-Token": token,
      },
      fetch,
    }),
    cache: new InMemoryCache(),
  });
