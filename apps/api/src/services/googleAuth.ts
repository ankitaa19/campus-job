import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Verify Google ID token
export const verifyGoogleToken = async (idToken: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    return {
      success: true,
      user: {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified
      }
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    return {
      success: false,
      message: 'Invalid Google token'
    };
  }
};

// Generate Google Auth URL
export const getGoogleAuthUrl = () => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    include_granted_scopes: true,
  });

  return authUrl;
};

// Exchange authorization code for tokens
export const getGoogleTokens = async (code: string) => {
  try {
    const { tokens } = await client.getToken(code);
    return {
      success: true,
      tokens
    };
  } catch (error) {
    console.error('Error getting Google tokens:', error);
    return {
      success: false,
      message: 'Failed to get Google tokens'
    };
  }
};
