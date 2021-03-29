/// <reference types="node" />
import { Knex } from 'knex';
import { Accountability, AbstractServiceOptions, Transformation } from '../types';
import { AuthorizationService } from './authorization';
import { Range } from '@directus/drive';
export declare class AssetsService {
    knex: Knex;
    accountability: Accountability | null;
    authorizationService: AuthorizationService;
    constructor(options: AbstractServiceOptions);
    getAsset(id: string, transformation: Transformation, range?: Range): Promise<{
        stream: NodeJS.ReadableStream;
        file: any;
        stat: import("@directus/drive").StatResponse;
    }>;
    private parseTransformation;
    private getAssetSuffix;
}
