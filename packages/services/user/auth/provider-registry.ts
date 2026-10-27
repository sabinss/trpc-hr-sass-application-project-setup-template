import type { AuthProviderId, AuthenticationMethod } from "../model";
import type { AuthProvider } from "./provider.interface";

/**
 * Registry: holds the set of ENABLED providers and looks them up by id.
 * Selecting a strategy at runtime goes through here, so no other code needs
 * to know which providers exist.
 */
export class AuthProviderRegistry {
  private readonly providers = new Map<AuthProviderId, AuthProvider>();

  /** Register a provider; silently skips it if it is not configured. */
  register(provider: AuthProvider): this {
    if (provider.isConfigured()) {
      this.providers.set(provider.id, provider);
    }
    return this;
  }

  get(id: AuthProviderId): AuthProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Auth provider "${id}" is not enabled`);
    }
    return provider;
  }

  list(): AuthProvider[] {
    return [...this.providers.values()];
  }

  /** The public "supported authentication methods" list. */
  describeAll(): AuthenticationMethod[] {
    return this.list().map((provider) => provider.describe());
  }
}
