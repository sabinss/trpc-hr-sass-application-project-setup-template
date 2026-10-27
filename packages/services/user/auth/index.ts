import { googleOAuth2Client } from "../../clients/google-oauth";

import { AuthProviderRegistry } from "./provider-registry";
import { GoogleOAuthProvider } from "./providers/google-oauth.provider";
import { EmailPasswordProvider } from "./providers/email-password.provider";
import { bcryptPasswordHasher } from "./ports";

/**
 * Factory / composition root: the ONE place that knows the full provider list
 * and decides which are enabled (from config). Adding a new auth method means
 * adding a provider class and one `.register(...)` line here — nothing else
 * changes (Open/Closed Principle).
 *
 * Multi-tenant seam: this will later take a tenant's config, e.g.
 * `buildAuthRegistry(tenantConfig)`, so each organization can enable a
 * different set of providers with its own credentials.
 */
export function buildAuthRegistry(): AuthProviderRegistry {
  const registry = new AuthProviderRegistry();

  // googleOAuth2Client is null when Google isn't configured — this narrows it.
  if (googleOAuth2Client) {
    registry.register(new GoogleOAuthProvider(googleOAuth2Client));
  }

  registry.register(new EmailPasswordProvider(bcryptPasswordHasher));

  return registry;
}

export { AuthProviderRegistry } from "./provider-registry";
export * from "./provider.interface";
