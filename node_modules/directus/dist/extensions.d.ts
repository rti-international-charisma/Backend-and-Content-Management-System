import { Router } from 'express';
export declare function ensureFoldersExist(): Promise<void>;
export declare function initializeExtensions(): Promise<void>;
export declare function listExtensions(type: string): Promise<string[]>;
export declare function registerExtensions(router: Router): Promise<void>;
export declare function registerExtensionEndpoints(router: Router): Promise<void>;
export declare function registerExtensionHooks(): Promise<void>;
