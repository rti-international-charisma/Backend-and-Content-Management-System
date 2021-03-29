"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Typemap graciously provided by @gpetrov
 */
const localTypeMap = {
    // Shared
    boolean: { type: 'boolean' },
    tinyint: { type: 'boolean' },
    smallint: { type: 'integer' },
    mediumint: { type: 'integer' },
    int: { type: 'integer' },
    integer: { type: 'integer' },
    serial: { type: 'integer' },
    bigint: { type: 'bigInteger' },
    bigserial: { type: 'bigInteger' },
    clob: { type: 'text' },
    tinytext: { type: 'text' },
    mediumtext: { type: 'text' },
    longtext: { type: 'text' },
    text: { type: 'text' },
    varchar: { type: 'string' },
    longvarchar: { type: 'string' },
    varchar2: { type: 'string' },
    nvarchar: { type: 'string' },
    image: { type: 'binary' },
    ntext: { type: 'text' },
    char: { type: 'string' },
    date: { type: 'date' },
    datetime: { type: 'dateTime' },
    dateTime: { type: 'dateTime' },
    timestamp: { type: 'timestamp' },
    time: { type: 'time' },
    float: { type: 'float' },
    double: { type: 'float' },
    'double precision': { type: 'float' },
    real: { type: 'float' },
    decimal: { type: 'decimal' },
    numeric: { type: 'integer' },
    // MySQL
    string: { type: 'text' },
    year: { type: 'integer' },
    blob: { type: 'binary' },
    mediumblob: { type: 'binary' },
    // MS SQL
    bit: { type: 'boolean' },
    smallmoney: { type: 'float' },
    money: { type: 'float' },
    datetimeoffset: { type: 'dateTime', useTimezone: true },
    datetime2: { type: 'dateTime' },
    smalldatetime: { type: 'dateTime' },
    nchar: { type: 'text' },
    binary: { type: 'binary' },
    varbinary: { type: 'binary' },
    // Postgres
    json: { type: 'json' },
    uuid: { type: 'uuid' },
    int2: { type: 'integer' },
    serial4: { type: 'integer' },
    int4: { type: 'integer' },
    serial8: { type: 'integer' },
    int8: { type: 'integer' },
    bool: { type: 'boolean' },
    'character varying': { type: 'string' },
    character: { type: 'string' },
    interval: { type: 'string' },
    _varchar: { type: 'string' },
    bpchar: { type: 'string' },
    timestamptz: { type: 'timestamp' },
    'timestamp with time zone': { type: 'timestamp', useTimezone: true },
    'timestamp without time zone': { type: 'dateTime' },
    timetz: { type: 'time' },
    'time with time zone': { type: 'time', useTimezone: true },
    'time without time zone': { type: 'time' },
    float4: { type: 'float' },
    float8: { type: 'float' },
};
function getLocalType(column, field) {
    var _a, _b, _c, _d;
    const type = localTypeMap[column.data_type.toLowerCase().split('(')[0]];
    /** Handle Postgres numeric decimals */
    if (column.data_type === 'numeric' && column.numeric_precision !== null && column.numeric_scale !== null) {
        return 'decimal';
    }
    if ((_a = field === null || field === void 0 ? void 0 : field.special) === null || _a === void 0 ? void 0 : _a.includes('json'))
        return 'json';
    if ((_b = field === null || field === void 0 ? void 0 : field.special) === null || _b === void 0 ? void 0 : _b.includes('hash'))
        return 'hash';
    if ((_c = field === null || field === void 0 ? void 0 : field.special) === null || _c === void 0 ? void 0 : _c.includes('csv'))
        return 'csv';
    if ((_d = field === null || field === void 0 ? void 0 : field.special) === null || _d === void 0 ? void 0 : _d.includes('uuid'))
        return 'uuid';
    if (type) {
        return type.type;
    }
    return 'unknown';
}
exports.default = getLocalType;
