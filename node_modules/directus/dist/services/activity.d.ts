import { ItemsService } from './items';
import { AbstractServiceOptions } from '../types';
/**
 * @TODO only return activity of the collections you have access to
 */
export declare class ActivityService extends ItemsService {
    constructor(options: AbstractServiceOptions);
}
