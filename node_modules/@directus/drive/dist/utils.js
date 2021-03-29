"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipeline = exports.isReadableStream = void 0;
const util_1 = require("util");
const stream_1 = require("stream");
/**
 * Returns a boolean indication if stream param
 * is a readable stream or not.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isReadableStream(stream) {
    return (stream !== null &&
        typeof stream === 'object' &&
        typeof stream.pipe === 'function' &&
        typeof stream._read === 'function' &&
        typeof stream._readableState === 'object' &&
        stream.readable !== false);
}
exports.isReadableStream = isReadableStream;
exports.pipeline = util_1.promisify(stream_1.pipeline);
//# sourceMappingURL=utils.js.map