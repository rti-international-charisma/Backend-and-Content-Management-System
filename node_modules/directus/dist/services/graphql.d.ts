import { Knex } from 'knex';
import { AbstractServiceOptions, Accountability, Collection, Field, Relation, SchemaOverview } from '../types';
import { GraphQLSchema, GraphQLList, GraphQLResolveInfo, ObjectFieldNode, SelectionNode, ArgumentNode } from 'graphql';
import { RelationsService } from './relations';
import { CollectionsService } from './collections';
import { FieldsService } from './fields';
export declare class GraphQLService {
    accountability: Accountability | null;
    knex: Knex;
    fieldsService: FieldsService;
    collectionsService: CollectionsService;
    relationsService: RelationsService;
    schema: SchemaOverview;
    constructor(options: AbstractServiceOptions);
    args: {
        sort: {
            type: GraphQLList<import("graphql").GraphQLType>;
        };
        limit: {
            type: import("graphql").GraphQLScalarType;
        };
        offset: {
            type: import("graphql").GraphQLScalarType;
        };
        page: {
            type: import("graphql").GraphQLScalarType;
        };
        search: {
            type: import("graphql").GraphQLScalarType;
        };
    };
    getSchema(): Promise<GraphQLSchema>;
    getGraphQLSchema(collections: Collection[], fields: Field[], relations: Relation[]): GraphQLSchema;
    getFilterArgs(collections: Collection[], fields: Field[], relations: Relation[]): any;
    resolve(info: GraphQLResolveInfo): Promise<Partial<import("../types").Item> | null>;
    getData(collection: string, selections: readonly SelectionNode[], argsArray: readonly ArgumentNode[], variableValues: GraphQLResolveInfo['variableValues']): Promise<Partial<import("../types").Item> | null>;
    parseArgs(args: readonly ArgumentNode[] | readonly ObjectFieldNode[], variableValues: GraphQLResolveInfo['variableValues']): Record<string, any>;
}
