import type { SelectUser } from "@repo/database/schema";
import type { AuthenticatedIdentity } from "./provider.interface";

/**
 * Ports = capabilities the providers depend on, expressed as interfaces so the
 * concrete implementation (bcrypt/argon2, Drizzle, …) can be swapped and mocked
 * in tests. This is the Dependency Inversion seam: providers depend on these
 * abstractions, not on a specific library.
 */

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface UserRepository {
  findByEmail(email: string): Promise<SelectUser | null>;
  upsertFromIdentity(identity: AuthenticatedIdentity): Promise<SelectUser>;
}

/**
 * Stub adapter so the wiring compiles today. Replace the bodies with a real
 * implementation (e.g. bcrypt or argon2) — nothing else needs to change.
 */
export const bcryptPasswordHasher: PasswordHasher = {
  async hash(_plain: string): Promise<string> {
    throw new Error("TODO: implement password hashing (e.g. bcrypt/argon2)");
  },
  async verify(_plain: string, _hash: string): Promise<boolean> {
    throw new Error("TODO: implement password verification");
  },
};
