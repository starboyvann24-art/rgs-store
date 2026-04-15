// RGS STORE — Global Type Declarations
// Fixes: passport augmenting Express.User conflicting with JwtPayload

declare module 'passport-google-oauth20' {
  const Strategy: any;
  export { Strategy };
}

// Extend Express namespace so req.user can be our JwtPayload shape
declare namespace Express {
  interface User {
    id: string;
    role: 'user' | 'admin';
    email: string;
    name: string;
    // For Google OAuth profile object (passport strategy callback)
    displayName?: string;
    emails?: Array<{ value: string }>;
    [key: string]: any;
  }
}

