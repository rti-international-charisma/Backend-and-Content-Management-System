import { AbstractServiceOptions, Accountability, SchemaOverview } from '../types';
import { Knex } from 'knex';
import { SettingsService } from './settings';
export declare class ServerService {
    knex: Knex;
    accountability: Accountability | null;
    settingsService: SettingsService;
    schema: SchemaOverview;
    constructor(options: AbstractServiceOptions);
    serverInfo(): Promise<Record<string, any>>;
    health(): Promise<{
        status: 'ok' | 'warn' | 'error';
        releaseId: string;
        serviceId: string;
        checks: {
            [service: string]: {
                componentType: 'system' | 'datastore' | 'objectstore' | 'email' | 'cache' | 'ratelimiter';
                observedValue?: string | number | boolean | undefined;
                observedUnit?: string | undefined;
                status: 'ok' | 'warn' | 'error';
                output?: any;
                threshold?: number | undefined;
            }[];
        };
    } | {
        status: "error" | "warn" | "ok";
    }>;
}
