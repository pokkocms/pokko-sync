import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client/core";
import fetch from "cross-fetch";

export const createClient = (
  project: string,
  environment: string,
  token: string
) =>
  new ApolloClient({
    link: new HttpLink({
      uri: `https://app.pokko.io/${project}/${environment}/graphql`,
      headers: {
        "X-Token": token,
      },
      fetch,
    }),
    cache: new InMemoryCache(),
  });
