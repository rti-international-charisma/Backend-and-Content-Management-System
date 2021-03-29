import { schemaInspector } from '../database';
import { Field } from '../types/field';
import { Accountability, AbstractServiceOptions, SchemaOverview } from '../types';
import { ItemsService } from '../services/items';
import { Knex } from 'knex';
import { types } from '../types';
import { PayloadService } from '../services/payload';
import { Column } from 'knex-schema-inspector/dist/types/column';
declare type RawField = Partial<Field> & {
    field: string;
    type: typeof types[number];
};
export declare class FieldsService {
    knex: Knex;
    accountability: Accountability | null;
    itemsService: ItemsService;
    payloadService: PayloadService;
    schemaInspector: typeof schemaInspector;
    schema: SchemaOverview;
    constructor(options: AbstractServiceOptions);
    private get hasReadAccess();
    readAll(collection?: string): Promise<Field[]>;
    readOne(collection: string, field: string): Promise<{
        collection: string;
        field: string;
        type: string;
        meta: any;
        schema: Column | null;
    }>;
    createField(collection: string, field: Partial<Field> & {
        field: string;
        type: typeof types[number];
    }, table?: Knex.CreateTableBuilder): Promise<void>;
    updateField(collection: string, field: RawField): Promise<string>;
    /** @todo save accountability */
    deleteField(collection: string, field: string): Promise<void>;
    addColumnToTable(table: Knex.CreateTableBuilder, field: RawField | Field, alter?: Column | null): void;
}
export {};
