import type { AuthProviderId, AuthenticationMethod } from "../model";

/**
 * Normalized identity returned by ANY provider once it has verified a user.
 *
 * Intentionally contains NO tokens/sessions — issuing those is a separate
 * concern (Single Responsibility). A provider only answers "who is this?";
 * a SessionService/TokenIssuer later turns this identity into a session.
 */
export interface AuthenticatedIdentity {
  provider: AuthProviderId;
  email: string;
  fullName?: string;
  emailVerified: boolean;
  profileImageUrl?: string;
}

/** Base capability shared by every provider (Strategy contract). */
export interface AuthProvider {
  readonly id: AuthProviderId;
  /** Whether this provider has the config it needs to run. */
  isConfigured(): boolean;
  /** UI-facing description, used to build the "supported methods" list. */
  describe(): AuthenticationMethod;
}

/** Capability A — OAuth redirect providers (Google, Microsoft, …). */
export interface RedirectAuthProvider extends AuthProvider {
  readonly kind: "oauth_redirect";
  getAuthorizationUrl(state?: string): string;
  /** Exchange the `?code=…` from the callback for a verified identity. */
  completeAuthorization(params: { code: string }): Promise<AuthenticatedIdentity>;
}

/** Capability B — credential providers (email + password, …). */
export interface CredentialsAuthProvider extends AuthProvider {
  readonly kind: "credentials";
  authenticate(params: { email: string; password: string }): Promise<AuthenticatedIdentity>;
  register(params: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<AuthenticatedIdentity>;
}

/** Type guards to narrow a provider by capability at the call site. */
export const isRedirectProvider = (p: AuthProvider): p is RedirectAuthProvider =>
  (p as RedirectAuthProvider).kind === "oauth_redirect";

export const isCredentialsProvider = (p: AuthProvider): p is CredentialsAuthProvider =>
  (p as CredentialsAuthProvider).kind === "credentials";
