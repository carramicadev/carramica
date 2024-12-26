import React from 'react';
import {
    InstantSearch,
    SearchBox,
    Hits,
    Highlight,
    Pagination,
} from 'react-instantsearch-dom';
import searchClient from './typesense';
// import searchClient from './typesenseAdapter';

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

const TypesenseSearch = () => {
    return (
        <InstantSearch indexName="orders" searchClient={searchClient}>
            <SearchBox />
            <Hits hitComponent={HitComponent} />
            <Pagination />
        </InstantSearch>
    );
};

export default TypesenseSearch;
