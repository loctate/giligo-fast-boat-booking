import { env } from "cloudflare:workers";

export function getD1(): D1Database {
  return env.DB;
}
