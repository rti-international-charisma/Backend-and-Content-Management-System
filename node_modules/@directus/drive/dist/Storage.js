"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("./exceptions");
class Storage {
    /**
     * Appends content to a file.
     *
     * Supported drivers: "local"
     */
    append(location, content) {
        throw new exceptions_1.MethodNotSupported('append', this.constructor.name);
    }
    /**
     * Copy a file to a location.
     *
     * Supported drivers: "local", "s3", "gcs", "azure"
     */
    copy(src, dest) {
        throw new exceptions_1.MethodNotSupported('copy', this.constructor.name);
    }
    /**
     * Delete existing file.
     * The value returned by this method will have a `wasDeleted` property that
     * can be either a boolean (`true` if a file was deleted, `false` if there was
     * no file to delete) or `null` (if no information about the file is available).
     *
     * Supported drivers: "local", "s3", "gcs", "azure"
     */
    delete(location) {
        throw new exceptions_1.MethodNotSupported('delete', this.constructor.name);
    }
    /**
     * Returns the driver.
     *
     * Supported drivers: "local", "s3", "gcs", "azure"
     */
    driver() {
        throw new exceptions_1.MethodNotSupported('driver', this.constructor.name);
    }
    /**
     * Determines if a file or folder already exists.
     *
     * Supported drivers: "local", "s3", "gcs", "azure"
     */
    exists(location) {
        throw new exceptions_1.MethodNotSupported('exists', this.constructor.name);
    }
    /**
     * Returns the file contents as a string.
     *
     * Supported drivers: "local", "s3", "gcs", "azure"
     */
    get(location, encoding) {
        throw new exceptions_1.MethodNotSupported('get', this.constructor.name);
    }
    /**
     * Returns the file contents as a Buffer.
     *
     * Supported drivers: "local", "s3", "gcs", "azure"
     */
    getBuffer(location) {
        throw new exceptions_1.MethodNotSupported('getBuffer', this.constructor.name);
    }
    /**
     * Returns signed url for an existing file.
     *
     * Supported drivers: "s3", "gcs", "azure"
     */
    getSignedUrl(location, options) {
        throw new exceptions_1.MethodNotSupported('getSignedUrl', this.constructor.name);
    }
    /**
     * Returns file's size and modification date.
     *
     * Supported drivers: "local", "s3", "gcs", "azure"
     */
    getStat(location) {
        throw new exceptions_1.MethodNotSupported('getStat', this.constructor.name);
    }
    /**
     * Returns the stream for the given file.
     *
     * Supported drivers: "local", "s3", "gcs", "azure"
     */
    getStream(location, range) {
        throw new exceptions_1.MethodNotSupported('getStream', this.constructor.name);
    }
    /**
     * Returns url for a given key. Note this method doesn't
     * validates the existence of file or it's visibility
     * status.
     *
     * Supported drivers: "s3", "gcs", "azure"
     */
    getUrl(location) {
        throw new exceptions_1.MethodNotSupported('getUrl', this.constructor.name);
    }
    /**
     * Move file to a new location.
     *
     * Supported drivers: "local", "s3", "gcs", "azure"
     */
    move(src, dest) {
        throw new exceptions_1.MethodNotSupported('move', this.constructor.name);
    }
    /**
     * Creates a new file.
     * This method will create missing directories on the fly.
     *
     * Supported drivers: "local", "s3", "gcs", "azure"
     */
    put(location, content) {
        throw new exceptions_1.MethodNotSupported('put', this.constructor.name);
    }
    /**
     * Prepends content to a file.
     *
     * Supported drivers: "local"
     */
    prepend(location, content) {
        throw new exceptions_1.MethodNotSupported('prepend', this.constructor.name);
    }
    /**
     * List files with a given prefix.
     *
     * Supported drivers: "local", "s3", "gcs", "azure"
     */
    flatList(prefix) {
        throw new exceptions_1.MethodNotSupported('flatList', this.constructor.name);
    }
}
exports.default = Storage;
//# sourceMappingURL=Storage.js.map