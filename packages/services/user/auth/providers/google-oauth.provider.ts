import type { OAuth2Client } from "google-auth-library";

import type { AuthenticationMethod } from "../../model";
import type { RedirectAuthProvider, AuthenticatedIdentity } from "../provider.interface";

/** Strategy: Google OAuth 2.0 (redirect-based). */
export class GoogleOAuthProvider implements RedirectAuthProvider {
  readonly id = "GOOGLE_OAUTH" as const;
  readonly kind = "oauth_redirect" as const;

  constructor(private readonly client: OAuth2Client) {}

  // The registry only constructs this provider when the env is present,
  // so by the time it exists it is configured.
  isConfigured(): boolean {
    return true;
  }

  describe(): AuthenticationMethod {
    return {
      provider: this.id,
      kind: this.kind,
      displayName: "Google",
      displayText: "Sign in with Google",
      authUrl: this.getAuthorizationUrl(),
    };
  }

  getAuthorizationUrl(state?: string): string {
    return this.client.generateAuthUrl({
      state,
      scope: ["openid", "email", "profile"],
    });
  }

  async completeAuthorization(_params: { code: string }): Promise<AuthenticatedIdentity> {
    // TODO: exchange `code` for tokens, verify the id_token, and map the
    // Google profile into an AuthenticatedIdentity.
    throw new Error("GoogleOAuthProvider.completeAuthorization not implemented");
  }
}
