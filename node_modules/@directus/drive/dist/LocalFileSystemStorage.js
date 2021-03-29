"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalFileSystemStorage = void 0;
const fse = __importStar(require("fs-extra"));
const fs_1 = require("fs");
const path_1 = require("path");
const Storage_1 = __importDefault(require("./Storage"));
const utils_1 = require("./utils");
const exceptions_1 = require("./exceptions");
function handleError(err, location) {
    switch (err.code) {
        case 'ENOENT':
            return new exceptions_1.FileNotFound(err, location);
        case 'EPERM':
            return new exceptions_1.PermissionMissing(err, location);
        default:
            return new exceptions_1.UnknownException(err, err.code, location);
    }
}
class LocalFileSystemStorage extends Storage_1.default {
    constructor(config) {
        super();
        this.$root = path_1.resolve(config.root);
    }
    /**
     * Returns full path relative to the storage's root directory.
     */
    _fullPath(relativePath) {
        return path_1.join(this.$root, path_1.join(path_1.sep, relativePath));
    }
    /**
     * Appends content to a file.
     */
    async append(location, content) {
        try {
            const result = await fse.appendFile(this._fullPath(location), content);
            return { raw: result };
        }
        catch (e) {
            throw handleError(e, location);
        }
    }
    /**
     * Copy a file to a location.
     */
    async copy(src, dest) {
        try {
            const result = await fse.copy(this._fullPath(src), this._fullPath(dest));
            return { raw: result };
        }
        catch (e) {
            throw handleError(e, `${src} -> ${dest}`);
        }
    }
    /**
     * Delete existing file.
     */
    async delete(location) {
        try {
            const result = await fse.unlink(this._fullPath(location));
            return { raw: result, wasDeleted: true };
        }
        catch (e) {
            e = handleError(e, location);
            if (e instanceof exceptions_1.FileNotFound) {
                return { raw: undefined, wasDeleted: false };
            }
            throw e;
        }
    }
    /**
     * Returns the driver.
     */
    driver() {
        return fse;
    }
    /**
     * Determines if a file or folder already exists.
     */
    async exists(location) {
        try {
            const result = await fse.pathExists(this._fullPath(location));
            return { exists: result, raw: result };
        }
        catch (e) {
            throw handleError(e, location);
        }
    }
    /**
     * Returns the file contents as string.
     */
    async get(location, encoding = 'utf-8') {
        try {
            const result = await fse.readFile(this._fullPath(location), encoding);
            return { content: result, raw: result };
        }
        catch (e) {
            throw handleError(e, location);
        }
    }
    /**
     * Returns the file contents as Buffer.
     */
    async getBuffer(location) {
        try {
            const result = await fse.readFile(this._fullPath(location));
            return { content: result, raw: result };
        }
        catch (e) {
            throw handleError(e, location);
        }
    }
    /**
     * Returns file size in bytes.
     */
    async getStat(location) {
        try {
            const stat = await fse.stat(this._fullPath(location));
            return {
                size: stat.size,
                modified: stat.mtime,
                raw: stat,
            };
        }
        catch (e) {
            throw handleError(e, location);
        }
    }
    /**
     * Returns a read stream for a file location.
     */
    getStream(location, range) {
        return fse.createReadStream(this._fullPath(location), {
            start: range === null || range === void 0 ? void 0 : range.start,
            end: range === null || range === void 0 ? void 0 : range.end,
        });
    }
    /**
     * Move file to a new location.
     */
    async move(src, dest) {
        try {
            const result = await fse.move(this._fullPath(src), this._fullPath(dest));
            return { raw: result };
        }
        catch (e) {
            throw handleError(e, `${src} -> ${dest}`);
        }
    }
    /**
     * Prepends content to a file.
     */
    async prepend(location, content) {
        try {
            const { content: actualContent } = await this.get(location, 'utf-8');
            return this.put(location, `${content}${actualContent}`);
        }
        catch (e) {
            if (e instanceof exceptions_1.FileNotFound) {
                return this.put(location, content);
            }
            throw e;
        }
    }
    /**
     * Creates a new file.
     * This method will create missing directories on the fly.
     */
    async put(location, content) {
        const fullPath = this._fullPath(location);
        try {
            if (utils_1.isReadableStream(content)) {
                const dir = path_1.dirname(fullPath);
                await fse.ensureDir(dir);
                const ws = fse.createWriteStream(fullPath);
                await utils_1.pipeline(content, ws);
                return { raw: undefined };
            }
            const result = await fse.outputFile(fullPath, content);
            return { raw: result };
        }
        catch (e) {
            throw handleError(e, location);
        }
    }
    /**
     * List files with a given prefix.
     */
    flatList(prefix = '') {
        const fullPrefix = this._fullPath(prefix);
        return this._flatDirIterator(fullPrefix, prefix);
    }
    async *_flatDirIterator(prefix, originalPrefix) {
        const prefixDirectory = prefix[prefix.length - 1] === path_1.sep ? prefix : path_1.dirname(prefix);
        try {
            const dir = await fs_1.promises.opendir(prefixDirectory);
            for await (const file of dir) {
                const fileName = path_1.join(prefixDirectory, file.name);
                if (fileName.startsWith(prefix)) {
                    if (file.isDirectory()) {
                        yield* this._flatDirIterator(path_1.join(fileName, path_1.sep), originalPrefix);
                    }
                    else if (file.isFile()) {
                        const path = path_1.relative(this.$root, fileName);
                        yield {
                            raw: null,
                            path,
                        };
                    }
                }
            }
        }
        catch (e) {
            if (e.code !== 'ENOENT') {
                throw handleError(e, originalPrefix);
            }
        }
    }
}
exports.LocalFileSystemStorage = LocalFileSystemStorage;
//# sourceMappingURL=LocalFileSystemStorage.js.map