import { OAuth2Client } from "google-auth-library";
import { env } from "../env";

const isGoogleConfigured = !!(
  env.GOOGLE_OAUTH_CLIENT_ID &&
  env.GOOGLE_OAUTH_CLIENT_SECRET &&
  env.GOOGLE_OAUTH_REDIRECT_URI
);

export const googleOAuth2Client = isGoogleConfigured
  ? new OAuth2Client({
      client_id: env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI,
    })
  : null;
