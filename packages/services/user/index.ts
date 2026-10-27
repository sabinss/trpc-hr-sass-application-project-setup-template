import type { AuthProviderId } from "./model";
import { buildAuthRegistry } from "./auth";
import { isRedirectProvider, isCredentialsProvider } from "./auth/provider.interface";

/**
 * Facade over the auth strategies. The tRPC router talks only to this class;
 * it never touches the registry or individual providers directly.
 */
class UserService {
  private readonly auth = buildAuthRegistry();

  /** Supported authentication methods (replaces the old hardcoded Google block). */
  public async getAuthenticationMethods() {
    return this.auth.describeAll();
  }

  /** Begin an OAuth redirect flow (Google, …). */
  public getAuthorizationUrl(providerId: AuthProviderId, state?: string): string {
    const provider = this.auth.get(providerId);
    if (!isRedirectProvider(provider)) {
      throw new Error(`Provider "${providerId}" is not redirect-based`);
    }
    return provider.getAuthorizationUrl(state);
  }

  /** Authenticate with email + password. */
  public async loginWithPassword(providerId: AuthProviderId, email: string, password: string) {
    const provider = this.auth.get(providerId);
    if (!isCredentialsProvider(provider)) {
      throw new Error(`Provider "${providerId}" is not credential-based`);
    }
    const identity = await provider.authenticate({ email, password });
    // TODO (separate concern): upsert the user and issue a session/token here.
    return identity;
  }
}

export default UserService;
