import { ItemsService } from './items';
import { AbstractServiceOptions, PrimaryKey } from '../types';
export declare class RolesService extends ItemsService {
    constructor(options: AbstractServiceOptions);
    delete(key: PrimaryKey): Promise<PrimaryKey>;
    delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
}
