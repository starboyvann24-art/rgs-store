import { Pool } from 'mysql2/promise';
declare const db: Pool;
export declare function testConnection(): Promise<boolean>;
export declare function initializeDatabase(): Promise<void>;
export declare function generateUUID(): string;
export declare function generateOrderNumber(): string;
export declare function generateTicketNumber(): string;
export default db;
//# sourceMappingURL=database.d.ts.map