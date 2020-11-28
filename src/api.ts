import { NormalizedCacheObject } from "@apollo/client/cache";
import { ApolloClient } from "@apollo/client/core";
import gql from "graphql-tag";
import { initDb, getDb, getStamp, storeSync } from "./db";
import { createClient } from "./client";

export type Region = "au-syd1";

const syncQuery = gql`
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

const loadPage = async (
  client: ApolloClient<NormalizedCacheObject>,
  after: string | null,
  skip: number
): Promise<any[]> => {
  const res = await client.query({
    query: syncQuery,
    variables: { after, skip },
  });

  if (res.data.sync.pageInfo.hasNextPage) {
    return res.data.sync.nodes.concat(
      await loadPage(client, after, skip + res.data.sync.nodes.length)
    );
  } else {
    return res.data.sync.nodes;
  }
};

export const runSync = async (
  region: Region,
  project: string,
  environment: string,
  token: string
) => {
  const db = getDb(project, environment);
  await initDb(db);
  const client = createClient(region, project, environment, token);

  const after = await getStamp(db);

  const res = await loadPage(client, after, 0);

  await storeSync(db, res);
};
