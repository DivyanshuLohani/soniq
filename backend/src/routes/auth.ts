import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import {
  isSpotifyConfigured,
  getSpotifyAuthUrl,
  exchangeCodeForTokens,
  getSpotifyUserProfile,
} from '../services/spotifyService';
import { signUserToken, optionalAuth } from '../middleware/auth';
import { AnalyticsCacheService } from '../services/analyticsCacheService';
import logger from '../lib/logger';

const router = Router();

// Store oauth states in memory for csrf protection
const oauthStates = new Map<string, number>();

// Clean expired states every 10 mins
setInterval(() => {
  const now = Date.now();
  for (const [state, timestamp] of oauthStates.entries()) {
    if (now - timestamp > 10 * 60 * 1000) {
      oauthStates.delete(state);
    }
  }
}, 10 * 60 * 1000);

// Status check
router.get('/status', (_req, res) => {
  const configured = isSpotifyConfigured();
  res.json({
    spotifyConfigured: configured,
    message: configured
      ? 'Spotify integration configured'
      : 'Spotify Client ID and Secret not yet configured in .env. Running in open/demo mode with full preview audio support!',
  });
});

// Proper Registration with Email & Password
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName: string = (displayName && typeof displayName === 'string' && displayName.trim())
      ? displayName.trim().slice(0, 30)
      : (cleanEmail.split('@')[0] || 'user');

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Check user count: first user created is automatically granted ADMIN role
    const totalUsers = await prisma.user.count();
    const role = totalUsers === 0 ? 'ADMIN' : 'USER';

    const passwordHash = await bcrypt.hash(password, 10);
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=12131a&textColor=d4ff32`;

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        displayName: cleanName,
        role: role as any,
        avatarUrl,
      },
    });

    const token = signUserToken({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role as 'USER' | 'ADMIN',
      isGuest: false,
    });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Track analytics event
    AnalyticsCacheService.trackEvent('user_signup', {
      userId: user.id,
      metadata: { role: user.role, email: user.email },
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isGuest: false,
      },
    });
  } catch (err: any) {
    logger.error('Registration error', { error: err.message });
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// Proper Login with Email & Password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signUserToken({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role as 'USER' | 'ADMIN',
      isGuest: false,
    });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    AnalyticsCacheService.trackEvent('user_login', {
      userId: user.id,
      metadata: { role: user.role },
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isSpotifyConnected: !!user.spotifyId,
        isGuest: false,
      },
    });
  } catch (err: any) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// Spotify OAuth Initiation
router.get('/spotify', optionalAuth, (req, res) => {
  if (!isSpotifyConfigured()) {
    return res.status(400).json({
      error: 'Spotify credentials not configured on backend',
      needsSetup: true,
    });
  }

  // Preserve existing logged-in user id if available in state for seamless linking
  const nonce = crypto.randomBytes(16).toString('hex');
  const userId = req.user?.id || '';
  const state = userId ? `link_${userId}_${nonce}` : nonce;
  oauthStates.set(state, Date.now());

  const authUrl = getSpotifyAuthUrl(state);
  res.redirect(authUrl);
});

// Spotify OAuth Callback
router.get('/spotify/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
    logger.error('Spotify login error query', { error });
    return res.redirect(`${frontendUrl}/?error=${encodeURIComponent(String(error))}`);
  }

  if (!code || typeof code !== 'string') {
    return res.redirect(`${frontendUrl}/?error=missing_code`);
  }

  // Check if state contains linking user ID (e.g. "link_<userId>_<nonce>")
  let linkingUserId: string | null = null;
  if (typeof state === 'string' && state.startsWith('link_')) {
    const parts = state.split('_');
    if (parts.length >= 3) {
      linkingUserId = parts[1] || null;
    }
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await getSpotifyUserProfile(tokens.accessToken);
    const tokenExpiry = new Date(Date.now() + tokens.expiresIn * 1000);

    let user;

    // 1. If currently signed in, connect Spotify directly to this existing account!
    if (linkingUserId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: linkingUserId },
      });

      if (existingUser) {
        user = await prisma.user.update({
          where: { id: linkingUserId },
          data: {
            spotifyId: profile.id,
            spotifyUri: profile.spotifyUri,
            spotifyProduct: profile.product || 'free',
            avatarUrl: existingUser.avatarUrl || profile.avatarUrl,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiry: tokenExpiry,
          },
        });
        logger.info('Connected Spotify to existing user account', { userId: user.id, spotifyId: profile.id });
      }
    }

    // 2. If not linking to existing or user wasn't found, find by spotifyId or email
    if (!user) {
      const existingSpotifyUser = await prisma.user.findUnique({
        where: { spotifyId: profile.id },
      });

      if (existingSpotifyUser) {
        user = await prisma.user.update({
          where: { id: existingSpotifyUser.id },
          data: {
            displayName: profile.displayName || existingSpotifyUser.displayName,
            avatarUrl: profile.avatarUrl || existingSpotifyUser.avatarUrl,
            spotifyUri: profile.spotifyUri,
            spotifyProduct: profile.product || 'free',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiry: tokenExpiry,
          },
        });
      } else if (profile.email) {
        // Link to existing account by matching email if exists
        const existingEmailUser = await prisma.user.findUnique({
          where: { email: profile.email.toLowerCase().trim() },
        });

        if (existingEmailUser) {
          user = await prisma.user.update({
            where: { id: existingEmailUser.id },
            data: {
              spotifyId: profile.id,
              spotifyUri: profile.spotifyUri,
              spotifyProduct: profile.product || 'free',
              avatarUrl: existingEmailUser.avatarUrl || profile.avatarUrl,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              tokenExpiry: tokenExpiry,
            },
          });
        }
      }
    }

    // 3. Fallback: create new account if user didn't exist anywhere
    if (!user) {
      const totalUsers = await prisma.user.count();
      const role = totalUsers === 0 ? 'ADMIN' : 'USER';

      user = await prisma.user.create({
        data: {
          spotifyId: profile.id,
          displayName: profile.displayName,
          email: profile.email ? profile.email.toLowerCase().trim() : null,
          role: role as any,
          avatarUrl: profile.avatarUrl,
          spotifyUri: profile.spotifyUri,
          spotifyProduct: profile.product || 'free',
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiry: tokenExpiry,
        },
      });
    }

    const jwtToken = signUserToken({
      id: user.id,
      spotifyId: user.spotifyId,
      spotifyProduct: user.spotifyProduct,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role as 'USER' | 'ADMIN',
      isGuest: false,
    });

    res.cookie('auth_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${frontendUrl}/?token=${jwtToken}&user=${encodeURIComponent(user.displayName)}`);
  } catch (err: any) {
    logger.error('Spotify callback failed', { error: err.message });

    // Preserve existing session if user was linking an existing account
    let restoreToken = '';
    if (linkingUserId) {
      try {
        const existing = await prisma.user.findUnique({ where: { id: linkingUserId } });
        if (existing) {
          restoreToken = signUserToken({
            id: existing.id,
            spotifyId: existing.spotifyId,
            spotifyProduct: existing.spotifyProduct,
            displayName: existing.displayName,
            email: existing.email,
            avatarUrl: existing.avatarUrl,
            role: existing.role as 'USER' | 'ADMIN',
            isGuest: !existing.spotifyId && !existing.email,
          });
          res.cookie('auth_token', restoreToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });
        }
      } catch (sessionErr: any) {
        logger.error('Failed to restore session after Spotify callback error', { error: sessionErr.message });
      }
    }

    const tokenParam = restoreToken ? `&token=${restoreToken}` : '';
    return res.redirect(`${frontendUrl}/?error=${encodeURIComponent(err.message || 'auth_failed')}${tokenParam}`);
  }
});

// Demo/Guest Quick Play Login
router.post('/demo-login', async (req, res) => {
  try {
    const { name } = req.body;
    const guestName = (name && typeof name === 'string' && name.trim())
      ? name.trim().slice(0, 30)
      : `BeatMaster_${Math.floor(1000 + Math.random() * 9000)}`;

    const demoUser = await prisma.user.create({
      data: {
        displayName: guestName,
        role: 'USER',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(guestName)}&backgroundColor=12131a&textColor=d4ff32`,
      },
    });

    const token = signUserToken({
      id: demoUser.id,
      displayName: demoUser.displayName,
      avatarUrl: demoUser.avatarUrl,
      role: 'USER',
      isGuest: true,
    });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      token,
      user: {
        id: demoUser.id,
        displayName: demoUser.displayName,
        role: demoUser.role,
        avatarUrl: demoUser.avatarUrl,
        isGuest: true,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create demo session', details: err.message });
  }
});

// Get Current User Profile
router.get('/me', optionalAuth, async (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        avatarUrl: true,
        spotifyId: true,
        spotifyProduct: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      return res.json({ user: null });
    }

    res.json({
      user: {
        ...dbUser,
        spotifyProduct: dbUser.spotifyProduct || (dbUser.spotifyId ? 'free' : null),
        isSpotifyConnected: !!dbUser.spotifyId,
        isGuest: req.user.isGuest || false,
      },
    });
  } catch (err) {
    res.json({ user: null });
  }
});

// Logout
router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

export default router;
