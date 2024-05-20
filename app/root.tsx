import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
    Form,
    Links,
    Meta,
    NavLink,
    Outlet,
    Scripts,
    ScrollRestoration,
    useFetcher,
    useLoaderData,
    useNavigation,
    useSubmit
} from '@remix-run/react';
import { ApolloProvider } from '@apollo/client/react/context';
import { createEmptyContact, getContacts } from './data';
// existing imports
import appStylesHref from './app.css?url';
import { useEffect } from 'react';
import { createApolloClient, getClient } from '~/apollo-client';

export const links: LinksFunction = () => [
    { rel: 'stylesheet', href: appStylesHref },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    const contacts = await getContacts(q);
    return json({ contacts, q });
};


export const action = async () => {
    const contact = await createEmptyContact();
    return redirect(`/contacts/${contact.id}/edit`);
};

export default function App() {
    const { contacts, q } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const fetcher = useFetcher();
    const searching =
        navigation.location &&
        new URLSearchParams(navigation.location.search).has(
            'q'
        );

    useEffect(() => {
        const searchField = document.getElementById('q');
        if (searchField instanceof HTMLInputElement) {
            searchField.value = q || '';
        }
    }, [q]);
    const apolloClient = createApolloClient({ ssrMode: true });

    useEffect(() => {
        window.__APOLLO_CLIENT__ = apolloClient;
    }, []);

    return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
      <div id="sidebar">
          <h1>Remix Contacts</h1>
          <div>
              <fetcher.Form
                  id="search-form"
                  role="search"
                  onChange={(event) => {
                      event.preventDefault();
                      const isFirstSearch = q === null;
                      submit(event.currentTarget, {
                          replace: !isFirstSearch,
                      });
                      event.stopPropagation()
                  }}
              >
                  <input
                      id="q"
                      defaultValue={q || ''}
                      aria-label="Search contacts"
                      placeholder="Search"
                      type="search"
                      className={searching ? 'loading' : ''}
                      name="q"
                  />
                  <div id="search-spinner" aria-hidden hidden={!searching}/>
              </fetcher.Form>
              <Form method="post">
                  <button type="submit">New</button>
              </Form>
          </div>
          <nav>
              {contacts.length ? (
                  <ul>
                      {contacts.map((contact) => (
                          <li key={contact.id}>
                              <NavLink
                                  prefetch="intent"
                                  className={({ isActive, isPending }) =>
                                      isActive
                                          ? 'active'
                                          : isPending
                                              ? 'pending'
                                              : ''
                                  }
                                  to={`contacts/${contact.id}`}
                              >
                                  {contact.first || contact.last ? (
                                      <>
                                          {contact.first} {contact.last}
                                      </>
                                  ) : (
                                      <i>No Name</i>
                                  )}{' '}
                                  {contact.favorite ? (
                                      <span>★</span>
                                  ) : null}
                              </NavLink>
                          </li>
                      ))}
                  </ul>
              ) : (
                  <p>
                      <i>No contacts</i>
                  </p>
              )}
          </nav>
      </div>
      <div
          className={
              navigation.state === 'loading' && !searching ? 'loading' : ''
          }
          id="detail"
      >

          <ApolloProvider client={getClient() ?? apolloClient}>

              <Outlet/>
          </ApolloProvider>
      </div>
      <ScrollRestoration/>
      <Scripts/>
      </body>
    </html>
  );
}
