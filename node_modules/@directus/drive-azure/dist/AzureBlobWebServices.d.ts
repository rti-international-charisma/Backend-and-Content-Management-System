/// <reference types="node" />
import { Storage, SignedUrlOptions, Response, ExistsResponse, ContentResponse, SignedUrlResponse, StatResponse, FileListResponse, DeleteResponse, Range } from '@directus/drive';
import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
export declare class AzureBlobWebServicesStorage extends Storage {
    protected $client: BlobServiceClient;
    protected $containerClient: ContainerClient;
    protected $signedCredentials: StorageSharedKeyCredential;
    protected $root: string;
    constructor(config: AzureBlobWebServicesStorageConfig);
    /**
     * Prefixes the given filePath with the storage root location
     */
    protected _fullPath(filePath: string): string;
    copy(src: string, dest: string): Promise<Response>;
    delete(location: string): Promise<DeleteResponse>;
    driver(): BlobServiceClient;
    exists(location: string): Promise<ExistsResponse>;
    get(location: string, encoding?: BufferEncoding): Promise<ContentResponse<string>>;
    getBuffer(location: string): Promise<ContentResponse<Buffer>>;
    getSignedUrl(location: string, options?: SignedUrlOptions): Promise<SignedUrlResponse>;
    getStat(location: string): Promise<StatResponse>;
    getStream(location: string, range?: Range): NodeJS.ReadableStream;
    getUrl(location: string): string;
    move(src: string, dest: string): Promise<Response>;
    put(location: string, content: Buffer | NodeJS.ReadableStream | string): Promise<Response>;
    flatList(prefix?: string): AsyncIterable<FileListResponse>;
}
export interface AzureBlobWebServicesStorageConfig {
    containerName: string;
    accountName: string;
    accountKey: string;
    endpoint?: string;
    root?: string;
}
