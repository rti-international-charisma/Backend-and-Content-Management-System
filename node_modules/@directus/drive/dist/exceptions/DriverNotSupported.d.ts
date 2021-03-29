import { RuntimeException } from 'node-exceptions';
export declare class DriverNotSupported extends RuntimeException {
    driver: string;
    static driver(name: string): DriverNotSupported;
}
