import { ItemsService } from './items';
import { AbstractServiceOptions, Query, PrimaryKey, PermissionsAction, Relation } from '../types';
import { PermissionsService } from './permissions';
export declare class RelationsService extends ItemsService {
    permissionsService: PermissionsService;
    constructor(options: AbstractServiceOptions);
    readByQuery(query: Query): Promise<null | Relation | Relation[]>;
    readByKey(keys: PrimaryKey[], query?: Query, action?: PermissionsAction): Promise<null | Relation[]>;
    readByKey(key: PrimaryKey, query?: Query, action?: PermissionsAction): Promise<null | Relation>;
    private filterForbidden;
}
