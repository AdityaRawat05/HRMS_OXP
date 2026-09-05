import { AuthSessionData } from "./api";

export interface AuthState extends AuthSessionData {}

export const INITIAL_AUTH_STATE: AuthState = {
  authenticated: false,
  user: null,
  roles: [],
  permissions: [],
  isAdmin: false,
};
