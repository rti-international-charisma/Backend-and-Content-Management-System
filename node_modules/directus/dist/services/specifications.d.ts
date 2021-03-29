import { AbstractServiceOptions, Accountability, SchemaOverview } from '../types';
import { CollectionsService } from './collections';
import { FieldsService } from './fields';
import { RelationsService } from './relations';
import { OpenAPIObject } from 'openapi3-ts';
import { Knex } from 'knex';
export declare class SpecificationService {
    accountability: Accountability | null;
    knex: Knex;
    schema: SchemaOverview;
    fieldsService: FieldsService;
    collectionsService: CollectionsService;
    relationsService: RelationsService;
    oas: OASService;
    constructor(options: AbstractServiceOptions);
}
interface SpecificationSubService {
    generate: () => Promise<any>;
}
declare class OASService implements SpecificationSubService {
    accountability: Accountability | null;
    knex: Knex;
    schema: SchemaOverview;
    fieldsService: FieldsService;
    collectionsService: CollectionsService;
    relationsService: RelationsService;
    constructor(options: AbstractServiceOptions, { fieldsService, collectionsService, relationsService, }: {
        fieldsService: FieldsService;
        collectionsService: CollectionsService;
        relationsService: RelationsService;
    });
    generate(): Promise<OpenAPIObject>;
    private generateTags;
    private generatePaths;
    private generateComponents;
    private getActionForMethod;
    private generateField;
    private fieldTypes;
}
export {};
