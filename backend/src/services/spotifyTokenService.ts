import prisma from "../lib/prisma";
import logger from "../lib/logger";
import { refreshSpotifyAccessToken } from "./spotifyService";

/**
 * Retrieves a valid Spotify access token for a given user.
 * If the access token is missing or expired (or expiring in <60s),
 * it uses the stored refreshToken to fetch a new accessToken,
 * updates the database (including tokenExpiry and any rotated refreshToken),
 * and returns the new token.
 */
export async function getValidSpotifyTokenForUser(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      accessToken: true,
      refreshToken: true,
      tokenExpiry: true,
    },
  });

  if (!user) {
    return null;
  }

  const now = Date.now();
  const isExpired = !user.tokenExpiry || user.tokenExpiry.getTime() <= now + 60 * 1000;

  // If token is still valid, return it directly
  if (user.accessToken && !isExpired) {
    return user.accessToken;
  }

  // If we have a refresh token, refresh it
  if (user.refreshToken) {
    try {
      const refreshed = await refreshSpotifyAccessToken(user.refreshToken);
      const newExpiry = new Date(Date.now() + refreshed.expiresIn * 1000);

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          accessToken: refreshed.accessToken,
          ...(refreshed.refreshToken ? { refreshToken: refreshed.refreshToken } : {}),
          tokenExpiry: newExpiry,
        },
        select: { accessToken: true },
      });

      logger.info("Successfully refreshed Spotify access token for user", { userId });
      return updated.accessToken;
    } catch (err: any) {
      logger.error("Failed to refresh Spotify access token for user", {
        userId,
        error: err.message,
      });
      // If refresh token has been revoked or failed, fallback to returning null or whatever token remains
      return null;
    }
  }

  return user.accessToken || null;
}
