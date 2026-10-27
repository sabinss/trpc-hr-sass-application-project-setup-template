import { z } from "zod";

// All auth methods the platform can support. Add a new id here when you add a
// new provider (e.g. "MICROSOFT_OAUTH", "SAML_SSO", "MAGIC_LINK").
export const authProviderIdSchema = z.enum(["GOOGLE_OAUTH", "EMAIL_PASSWORD"]);
export type AuthProviderId = z.infer<typeof authProviderIdSchema>;

// The two behavioural shapes a provider can have (Interface Segregation):
// redirect-based (OAuth) vs credential-based (email + password).
export const authProviderKindSchema = z.enum(["oauth_redirect", "credentials"]);
export type AuthProviderKind = z.infer<typeof authProviderKindSchema>;

// Public, UI-facing description of one enabled auth method.
// NOTE: kept under the original export name so packages/trpc's auth route
// (which imports this symbol as its tRPC output schema) keeps compiling.
export const getAuthenticationMethodOutputSchema = z.object({
  provider: authProviderIdSchema,
  kind: authProviderKindSchema,
  displayName: z.string(),
  displayText: z.string(),
  authUrl: z.string().optional(), // present only for redirect (OAuth) providers
});
export type GetAuthenticationMethodOutputSchema = z.infer<
  typeof getAuthenticationMethodOutputSchema
>;

// Friendlier aliases used throughout the new auth blueprint.
export const authenticationMethodSchema = getAuthenticationMethodOutputSchema;
export type AuthenticationMethod = GetAuthenticationMethodOutputSchema;
