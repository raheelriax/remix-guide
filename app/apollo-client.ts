import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { createHttpLink } from '@apollo/client/link/http';
import merge from 'lodash/merge';

export const createApolloClient = (options = { ssrMode: true }) => {
    return new ApolloClient({
        link: createHttpLink({
            uri: "https://countries.trevorblades.com/graphql",
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        }),
        cache: new InMemoryCache(),
        ...options,
    });
};


export const getClient = ()=>(typeof window !== 'undefined' ? window.__APOLLO_CLIENT__ : null);


export const readyQueryFromState = ({ state, query }) => {
    const client = getClient();
    const newCache = merge(state.ROOT_QUERY, client?.extract(true)?.ROOT_QUERY ?? {});
    client.restore({ ROOT_QUERY: newCache });
    return client.readQuery({ query });
}
