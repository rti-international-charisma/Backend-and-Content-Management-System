import { ItemsService } from './items';
import { Accountability, PrimaryKey, Item, AbstractServiceOptions, SchemaOverview } from '../types';
import { Knex } from 'knex';
export declare class UsersService extends ItemsService {
    knex: Knex;
    accountability: Accountability | null;
    schema: SchemaOverview;
    service: ItemsService;
    constructor(options: AbstractServiceOptions);
    update(data: Partial<Item>, keys: PrimaryKey[]): Promise<PrimaryKey[]>;
    update(data: Partial<Item>, key: PrimaryKey): Promise<PrimaryKey>;
    update(data: Partial<Item>[]): Promise<PrimaryKey[]>;
    delete(key: PrimaryKey): Promise<PrimaryKey>;
    delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
    inviteUser(email: string | string[], role: string, url: string | null): Promise<void>;
    acceptInvite(token: string, password: string): Promise<void>;
    requestPasswordReset(email: string, url: string | null): Promise<void>;
    resetPassword(token: string, password: string): Promise<void>;
    enableTFA(pk: string): Promise<{
        secret: string;
        url: string;
    }>;
    disableTFA(pk: string): Promise<void>;
}
