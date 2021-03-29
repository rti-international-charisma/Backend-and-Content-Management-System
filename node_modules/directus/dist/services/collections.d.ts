import { AbstractServiceOptions, Accountability, Collection, SchemaOverview } from '../types';
import { Knex } from 'knex';
export declare class CollectionsService {
    knex: Knex;
    accountability: Accountability | null;
    schema: SchemaOverview;
    constructor(options: AbstractServiceOptions);
    create(data: Partial<Collection>[]): Promise<string[]>;
    create(data: Partial<Collection>): Promise<string>;
    readByKey(collection: string[]): Promise<Collection[]>;
    readByKey(collection: string): Promise<Collection>;
    /** @todo, read by query without query support is a bit ironic, isn't it */
    readByQuery(): Promise<Collection[]>;
    /**
     * @NOTE
     * We only support updating the content in directus_collections
     */
    update(data: Partial<Collection>, keys: string[]): Promise<string[]>;
    update(data: Partial<Collection>, key: string): Promise<string>;
    update(data: Partial<Collection>[]): Promise<string[]>;
    delete(collections: string[]): Promise<string[]>;
    delete(collection: string): Promise<string>;
}
