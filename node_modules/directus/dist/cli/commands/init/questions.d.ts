export declare const databaseQuestions: {
    sqlite3: (({ filepath }: {
        filepath: string;
    }) => {
        type: string;
        name: string;
        message: string;
        default: string;
    })[];
    mysql: ((({ client }: {
        client: string;
    }) => {
        type: string;
        name: string;
        message: string;
        default(): number;
    }) | (() => {
        type: string;
        name: string;
        message: string;
    }))[];
    pg: ((({ client }: {
        client: string;
    }) => {
        type: string;
        name: string;
        message: string;
        default(): number;
    }) | (() => {
        type: string;
        name: string;
        message: string;
    }))[];
    oracledb: ((({ client }: {
        client: string;
    }) => {
        type: string;
        name: string;
        message: string;
        default(): number;
    }) | (() => {
        type: string;
        name: string;
        message: string;
    }))[];
    mssql: ((({ client }: {
        client: string;
    }) => {
        type: string;
        name: string;
        message: string;
        default(): number;
    }) | (() => {
        type: string;
        name: string;
        message: string;
    }))[];
};
