import { RuntimeException } from 'node-exceptions';
export declare class InvalidConfig extends RuntimeException {
    static missingDiskName(): InvalidConfig;
    static missingDiskConfig(name: string): InvalidConfig;
    static missingDiskDriver(name: string): InvalidConfig;
    static duplicateDiskName(name: string): InvalidConfig;
}
