// typesenseAdapter.js
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import {
    InstantSearch,
    SearchBox,
    Hits,
    Highlight,
    Pagination,
} from 'react-instantsearch-dom';

const typesenseAdapter = new TypesenseInstantSearchAdapter({
    server: {
        apiKey: 'w48GsJQ9cgHRtngNKCXeg4uPuSHv1dVR', // Use the search-only API key
        nodes: [
            {
                host: 'y5apuifswvrl74bhp-1.a1.typesense.net', // Replace with your Typesense host
                port: '443',
                protocol: 'https',
            },
        ],
    },
    additionalSearchParameters: {
        query_by: 'senderName,invoice_id', // Fields to query
    },
});

const searchClient = typesenseAdapter.searchClient;
const HitComponent = ({ hit }) => {
    console.log('hit', hit)
    return (
        <div>
            <h3>
                <Highlight attribute="senderName" hit={hit} />
            </h3>
            <p>
                <Highlight attribute="invoice_id" hit={hit} />
            </p>
        </div>
    )
};

const TypesenseSearchNew = () => {
    return (
        <InstantSearch indexName="orders" searchClient={searchClient}>
            <SearchBox />
            <Hits hitComponent={HitComponent} />
            <Pagination />
        </InstantSearch>
    );
};

export default TypesenseSearchNew;

// import Typesense from "typesense";

// export const typesense = new Typesense.Client({
//     nodes: [
//         {
//             host: "y5apuifswvrl74bhp-1.a1.typesense.net",  // Replace with your Typesense server URL
//             port: '443', // Default Typesense Cloud port
//             protocol: 'https',                  // Use https if applicable
//         }
//     ],
//     apiKey: "OvdKtPQfBDayVPAihYPuHIuTZr2kX40Y",
//     connectionTimeoutSeconds: 2
// });
