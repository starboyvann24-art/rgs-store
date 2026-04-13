export interface JwtPayload {
    id: string;
    role: 'user' | 'admin';
    email: string;
    name: string;
}
export declare const generateToken: (payload: JwtPayload) => string;
export declare const verifyJwtToken: (token: string) => JwtPayload;
//# sourceMappingURL=jwt.d.ts.map