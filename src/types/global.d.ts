// RGS STORE — Global Type Declarations
// Fixes: passport augmenting Express.User conflicting with JwtPayload


// Extend Express namespace so req.user can be our JwtPayload shape
declare namespace Express {
  interface User {
    id: string;
    role: 'user' | 'admin';
    email: string;
    name: string;
    // For Discord OAuth profile object
    username?: string;
    discriminator?: string;
    [key: string]: any;
  }
}

