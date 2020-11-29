import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client/core";
import fetch from "cross-fetch";
import { Region } from "./api";

export const createClient = (
  region: Region,
  project: string,
  environment: string,
  token: string
) => {
  const uri = `https://${region}.pokko.io/${project}/${environment}/graphql`;
  const headers = {
    "X-Token": token,
  };

  return new ApolloClient({
    link: new HttpLink({
      uri,
      headers,
      fetch,
    }),
    cache: new InMemoryCache(),
  });
};
