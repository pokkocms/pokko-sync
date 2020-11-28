import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client/core";
import fetch from "cross-fetch";
import { Region } from "./api";

export const createClient = (
  region: Region,
  project: string,
  environment: string,
  token: string
) =>
  new ApolloClient({
    link: new HttpLink({
      uri: `https://${region}.pokko.io/${project}/${environment}/graphql`,
      headers: {
        "X-Token": token,
      },
      fetch,
    }),
    cache: new InMemoryCache(),
  });
