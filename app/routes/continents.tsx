import { Suspense } from 'react';
import { useLazyQuery } from '@apollo/client/react/hooks';
import { Await, ClientLoaderFunctionArgs, defer, NavLink, useLoaderData } from '@remix-run/react';
import type { V2_MetaFunction } from '@remix-run/node';
import { createApolloClient, getClient, readyQueryFromState } from '~/apollo-client';
import type { Continent } from '~/graphql/__generated__/graphql';
import { GET_ALL_CONTINENTS } from '~/graphql/queries';
import { ApolloClient } from '@apollo/client/core';

export const meta: V2_MetaFunction = () => {
    return [
        { title: 'Countries' },
        { name: 'description', content: 'Query countries with remix and graphQL' },
    ];
};

export function loader(params) {
    const client = createApolloClient({ ssrMode: true });
    const data = client
        .query({
            query: GET_ALL_CONTINENTS,
        }).then(({ data }) => ({
            state: client.extract(true)
        }));
    return defer({ data });
}

export async function clientLoader({
                                       request,
                                       params,
                                       serverLoader,
                                   }: ClientLoaderFunctionArgs) {
    // call the server loader
    const client: ApolloClient<any> = getClient();
    const data = client.readQuery({ query: GET_ALL_CONTINENTS });
    if (data?.continents) {
        return { data: { continents: data?.continents } };
    }
    return serverLoader().then(({ data }) => data).then((data) => {
        const { continents } = readyQueryFromState({
            state: data?.state,
            query: GET_ALL_CONTINENTS,
        })
        return { data: { continents } };
    });
}


clientLoader.hydrate = true;


const ContinentList = ({ continent }: { continent: Continent[] }) => {
    return (
        <>
            {
                continent?.map((continent: Continent) => (
                    <div key={continent.code}>
                        <h2>{continent.name}</h2>
                    </div>
                ))
            }
        </>
    )
}


export default function Index() {
    const { data } = useLoaderData();
    const [fetchCountries, { client }] = useLazyQuery(GET_ALL_CONTINENTS, {});

    const testCache = () => {
        console.log('From Cache', client.readQuery({ query: GET_ALL_CONTINENTS }));
        fetchCountries().then((response) => console.log('From Apollo', response, client))
    }

    return (
        <Suspense fallback="Loading...">
            <NavLink to="/countries">Countries</NavLink>
            <button style={{ marginLeft: '5px' }} onClick={testCache}>Re Fetch from Cache</button>
            <Await resolve={data} errorElement="Something went wrong">
                {({ continents }) => {
                    return (<ContinentList continent={continents}/>)
                }}
            </Await>
        </Suspense>
    );
}
