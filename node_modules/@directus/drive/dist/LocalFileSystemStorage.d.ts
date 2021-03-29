/// <reference types="node" />
import * as fse from 'fs-extra';
import Storage from './Storage';
import { Response, ExistsResponse, ContentResponse, StatResponse, FileListResponse, DeleteResponse, Range } from './types';
export declare class LocalFileSystemStorage extends Storage {
    private $root;
    constructor(config: LocalFileSystemStorageConfig);
    /**
     * Returns full path relative to the storage's root directory.
     */
    private _fullPath;
    /**
     * Appends content to a file.
     */
    append(location: string, content: Buffer | string): Promise<Response>;
    /**
     * Copy a file to a location.
     */
    copy(src: string, dest: string): Promise<Response>;
    /**
     * Delete existing file.
     */
    delete(location: string): Promise<DeleteResponse>;
    /**
     * Returns the driver.
     */
    driver(): typeof fse;
    /**
     * Determines if a file or folder already exists.
     */
    exists(location: string): Promise<ExistsResponse>;
    /**
     * Returns the file contents as string.
     */
    get(location: string, encoding?: string): Promise<ContentResponse<string>>;
    /**
     * Returns the file contents as Buffer.
     */
    getBuffer(location: string): Promise<ContentResponse<Buffer>>;
    /**
     * Returns file size in bytes.
     */
    getStat(location: string): Promise<StatResponse>;
    /**
     * Returns a read stream for a file location.
     */
    getStream(location: string, range?: Range): NodeJS.ReadableStream;
    /**
     * Move file to a new location.
     */
    move(src: string, dest: string): Promise<Response>;
    /**
     * Prepends content to a file.
     */
    prepend(location: string, content: Buffer | string): Promise<Response>;
    /**
     * Creates a new file.
     * This method will create missing directories on the fly.
     */
    put(location: string, content: Buffer | NodeJS.ReadableStream | string): Promise<Response>;
    /**
     * List files with a given prefix.
     */
    flatList(prefix?: string): AsyncIterable<FileListResponse>;
    private _flatDirIterator;
}
export declare type LocalFileSystemStorageConfig = {
    root: string;
};
