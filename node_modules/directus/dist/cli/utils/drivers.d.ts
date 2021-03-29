export declare const drivers: {
    pg: string;
    mysql: string;
    sqlite3: string;
    oracledb: string;
    mssql: string;
};
export declare function getDriverForClient(client: string): keyof typeof drivers | null;
