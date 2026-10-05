// Shared types used across frontend components

export interface User {
  id: string;
  username: string;
  email: string;
}

export type AuthStatus = "idle" | "loading" | "success" | "error";
