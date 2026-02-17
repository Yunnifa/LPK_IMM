// Shared types for the backend

// JWT user payload type (from token decoded data)
export interface JwtUser {
  id: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Hono environment type with user variable
export type HonoEnv = {
  Variables: {
    user: JwtUser;
  };
};
