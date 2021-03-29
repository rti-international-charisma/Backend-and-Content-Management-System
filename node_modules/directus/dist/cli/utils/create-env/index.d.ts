import { drivers } from '../drivers';
import { Credentials } from '../create-db-connection';
export default function createEnv(client: keyof typeof drivers, credentials: Credentials, directory: string): Promise<void>;
