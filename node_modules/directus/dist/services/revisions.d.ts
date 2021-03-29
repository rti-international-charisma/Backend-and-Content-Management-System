import { ItemsService } from './items';
import { AbstractServiceOptions, PrimaryKey } from '../types';
/**
 * @TODO only return data / delta based on permissions you have for the requested collection
 */
export declare class RevisionsService extends ItemsService {
    constructor(options: AbstractServiceOptions);
    revert(pk: PrimaryKey): Promise<void>;
}
