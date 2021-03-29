import { ItemsService } from './items';
import { Item, PrimaryKey, AbstractServiceOptions } from '../types';
export declare class WebhooksService extends ItemsService {
    constructor(options: AbstractServiceOptions);
    create(data: Partial<Item>[]): Promise<PrimaryKey[]>;
    create(data: Partial<Item>): Promise<PrimaryKey>;
    update(data: Partial<Item>, keys: PrimaryKey[]): Promise<PrimaryKey[]>;
    update(data: Partial<Item>, key: PrimaryKey): Promise<PrimaryKey>;
    update(data: Partial<Item>[]): Promise<PrimaryKey[]>;
    delete(key: PrimaryKey): Promise<PrimaryKey>;
    delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
}
