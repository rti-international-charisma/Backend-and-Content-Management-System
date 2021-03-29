import { Meta } from './meta';
export declare type Query = {
    fields?: string[];
    sort?: Sort[];
    filter?: Filter;
    limit?: number;
    offset?: number;
    page?: number;
    single?: boolean;
    meta?: Meta[];
    search?: string;
    export?: 'json' | 'csv';
    deep?: Record<string, Query>;
};
export declare type Sort = {
    column: string;
    order: 'asc' | 'desc';
};
export declare type Filter = {
    [keyOrOperator: string]: Filter | any;
};
export declare type FilterOperator = 'eq' | 'neq' | 'contains' | 'ncontains' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'null' | 'nnull' | 'empty' | 'nempty';
