import { AbstractServiceOptions, PermissionsAction, Query, Item, PrimaryKey } from '../types';
import { ItemsService } from '../services/items';
export declare class PermissionsService extends ItemsService {
    constructor(options: AbstractServiceOptions);
    getAllowedFields(action: PermissionsAction, collection?: string): Record<string, string[]>;
    readByQuery(query: Query, opts?: {
        stripNonRequested?: boolean;
    }): Promise<null | Partial<Item> | Partial<Item>[]>;
    readByKey(keys: PrimaryKey[], query?: Query, action?: PermissionsAction): Promise<null | Partial<Item>[]>;
    readByKey(key: PrimaryKey, query?: Query, action?: PermissionsAction): Promise<null | Partial<Item>>;
}
