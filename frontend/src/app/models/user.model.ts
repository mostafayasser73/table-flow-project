// The roles are a fixed set of values, so an enum (session 6) describes them
// better than a plain string. These are exactly the values the backend accepts
// in the "role" field of the User model.
export enum UserRole {
  Admin = 'admin',
  Manager = 'manager',
  Chef = 'chef',
  Waiter = 'waiter',
  Customer = 'customer',
}

// What a user looks like when it comes back from the backend.
// The password is never sent to the client, so it is not here.
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// What POST /auth/signup expects in the body.
export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

// What POST /auth/login expects in the body.
export interface LoginData {
  email: string;
  password: string;
}

// Both signup and login answer with a token and the user, inside "data".
export interface AuthData {
  token: string;
  user: User;
}
