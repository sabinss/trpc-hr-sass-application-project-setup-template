import type { AuthenticationMethod } from "../../model";
import type { CredentialsAuthProvider, AuthenticatedIdentity } from "../provider.interface";
import type { PasswordHasher, UserRepository } from "../ports";

/** Strategy: email + password (credential-based). */
export class EmailPasswordProvider implements CredentialsAuthProvider {
  readonly id = "EMAIL_PASSWORD" as const;
  readonly kind = "credentials" as const;

  constructor(
    private readonly hasher: PasswordHasher,
    private readonly users?: UserRepository, // wired in once persistence exists
  ) {}

  isConfigured(): boolean {
    return true;
  }

  describe(): AuthenticationMethod {
    return {
      provider: this.id,
      kind: this.kind,
      displayName: "Email",
      displayText: "Sign in with email",
    };
  }

  async authenticate(_params: {
    email: string;
    password: string;
  }): Promise<AuthenticatedIdentity> {
    // TODO: load the user by email, then `this.hasher.verify(password, hash)`;
    // on success return the AuthenticatedIdentity.
    throw new Error("EmailPasswordProvider.authenticate not implemented");
  }

  async register(_params: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<AuthenticatedIdentity> {
    // TODO: `this.hasher.hash(password)`, persist via `this.users`,
    // then return the AuthenticatedIdentity.
    throw new Error("EmailPasswordProvider.register not implemented");
  }
}
