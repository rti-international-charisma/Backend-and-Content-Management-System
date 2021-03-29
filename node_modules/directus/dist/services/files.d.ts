/// <reference types="node" />
import { ItemsService } from './items';
import { AbstractServiceOptions, File, PrimaryKey } from '../types';
export declare class FilesService extends ItemsService {
    constructor(options: AbstractServiceOptions);
    upload(stream: NodeJS.ReadableStream, data: Partial<File> & {
        filename_download: string;
        storage: string;
    }, primaryKey?: PrimaryKey): Promise<PrimaryKey>;
    delete(key: PrimaryKey): Promise<PrimaryKey>;
    delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
}
