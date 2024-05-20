import { gql } from "@apollo/client/core";

export const GET_ALL_COUNTRIES = gql`
    query GetAllCountries {
        countries {
            code
            name
            emoji
        }
    }
`;

export const GET_ALL_CONTINENTS = gql`
    query GetAllContinents {
        continents {
            code
            name
        }
    }
`;
