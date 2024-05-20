import { Suspense } from 'react';
import { useLazyQuery } from '@apollo/client/react/hooks';
import { Await, ClientLoaderFunctionArgs, defer, NavLink, useLoaderData } from '@remix-run/react';
import type { V2_MetaFunction } from '@remix-run/node';
import { createApolloClient, getClient, readyQueryFromState } from '~/apollo-client';
import type { Country } from '~/graphql/__generated__/graphql';
import { GET_ALL_COUNTRIES } from '~/graphql/queries';
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
            query: GET_ALL_COUNTRIES,
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
    const data = client.readQuery({ query: GET_ALL_COUNTRIES });
    if (data?.countries) {
        return { data: { countries: data?.countries } };
    }
    return serverLoader().then(({ data }) => data).then((data) => {
        const { countries } = readyQueryFromState({
            state: data?.state,
            query: GET_ALL_COUNTRIES,
        })
        return { data:{countries} };
    });
}


clientLoader.hydrate = true;


const CountiesList = ({ countries }: { countries: Country[] }) => {
    return (
        <>
            {
                countries?.map((country: Country) => (
                    <div key={country.code}>
                        <h2>
                            {country.emoji} {country.name}
                        </h2>
                    </div>
                ))
            }
        </>
    )
}


export default function Index() {
    const { data } = useLoaderData();
    const [fetchCountries, { client }] = useLazyQuery(GET_ALL_COUNTRIES,{
    });

    const testCache = () => {
        console.log('From Cache', client.readQuery({ query: GET_ALL_COUNTRIES }));
        fetchCountries().then((response) => console.log('From Apollo', response, client))
    }

    return (
        <Suspense fallback="Loading...">
            <NavLink to="/continents">Continents</NavLink>
            <button style={{ marginLeft: '5px' }} onClick={testCache}>Re Fetch from Cache</button>
            <Await resolve={data} errorElement="Something went wrong">
                {({countries}) => {
                    return (<CountiesList countries={countries}/>)
                }}
            </Await>
        </Suspense>
    );
}
