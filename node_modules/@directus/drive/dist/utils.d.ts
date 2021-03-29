/// <reference types="node" />
import { pipeline as nodePipeline } from 'stream';
/**
 * Returns a boolean indication if stream param
 * is a readable stream or not.
 */
export declare function isReadableStream(stream: any): stream is NodeJS.ReadableStream;
export declare const pipeline: typeof nodePipeline.__promisify__;
