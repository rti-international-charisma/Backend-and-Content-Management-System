import { Accountability, AbstractServiceOptions, AST, PermissionsAction, Item, PrimaryKey, SchemaOverview, Filter } from '../types';
import { Knex } from 'knex';
import { FailedValidationException } from '../exceptions';
import { PayloadService } from './payload';
export declare class AuthorizationService {
    knex: Knex;
    accountability: Accountability | null;
    payloadService: PayloadService;
    schema: SchemaOverview;
    constructor(options: AbstractServiceOptions);
    processAST(ast: AST, action?: PermissionsAction): Promise<AST>;
    /**
     * Checks if the provided payload matches the configured permissions, and adds the presets to the payload.
     */
    validatePayload(action: PermissionsAction, collection: string, payloads: Partial<Item>[]): Promise<Partial<Item>[]>;
    validatePayload(action: PermissionsAction, collection: string, payload: Partial<Item>): Promise<Partial<Item>>;
    validateJoi(validation: Filter, payloads: Partial<Record<string, any>>[]): FailedValidationException[];
    checkAccess(action: PermissionsAction, collection: string, pk: PrimaryKey | PrimaryKey[]): Promise<void>;
}
