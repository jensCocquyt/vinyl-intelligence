import axios from 'axios';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';

const DISCOGS_BASE = 'https://api.discogs.com';
const DISCOGS_REQUEST_TOKEN_URL = 'https://www.discogs.com/oauth/request_token';
const DISCOGS_AUTHORIZE_URL = 'https://www.discogs.com/oauth/authorize';
const DISCOGS_ACCESS_TOKEN_URL = 'https://www.discogs.com/oauth/access_token';
const USER_AGENT = 'VinylIntelligence/1.0 +https://github.com/vinyl-intelligence';

// Temporary in-process store for OAuth state.
// Replace with Redis for multi-instance deployments.
const oauthStore = new Map<string, { secret: string; userId: string }>();

export class DiscogsService {
  private oauth: OAuth;

  constructor() {
    this.oauth = new OAuth({
      consumer: {
        key: process.env.DISCOGS_CONSUMER_KEY!,
        secret: process.env.DISCOGS_CONSUMER_SECRET!,
      },
      signature_method: 'HMAC-SHA1',
      hash_function: (baseString, key) =>
        crypto.createHmac('sha1', key).update(baseString).digest('base64'),
    });
  }

  private authHeader(
    url: string,
    method: string,
    token?: OAuth.Token,
    extraParams?: Record<string, string>
  ) {
    return this.oauth.toHeader(
      this.oauth.authorize({ url, method, data: extraParams }, token)
    );
  }

  async getRequestToken(userId: string): Promise<{ authorizeUrl: string }> {
    const callbackUrl = `${process.env.BACKEND_URL}/api/discogs/connect/callback`;

    const response = await axios.get(DISCOGS_REQUEST_TOKEN_URL, {
      headers: {
        ...this.authHeader(DISCOGS_REQUEST_TOKEN_URL, 'GET', undefined, {
          oauth_callback: callbackUrl,
        }),
        'User-Agent': USER_AGENT,
      },
    });

    const params = new URLSearchParams(response.data as string);
    const requestToken = params.get('oauth_token')!;
    const requestTokenSecret = params.get('oauth_token_secret')!;

    oauthStore.set(requestToken, { secret: requestTokenSecret, userId });

    return { authorizeUrl: `${DISCOGS_AUTHORIZE_URL}?oauth_token=${requestToken}` };
  }

  async handleCallback(oauthToken: string, oauthVerifier: string): Promise<void> {
    const stored = oauthStore.get(oauthToken);
    if (!stored) throw new Error('Invalid or expired OAuth state');

    const token: OAuth.Token = { key: oauthToken, secret: stored.secret };

    const response = await axios.post(
      DISCOGS_ACCESS_TOKEN_URL,
      new URLSearchParams({ oauth_verifier }).toString(),
      {
        headers: {
          ...this.authHeader(DISCOGS_ACCESS_TOKEN_URL, 'POST', token),
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
        },
      }
    );

    const params = new URLSearchParams(response.data as string);
    const accessToken = params.get('oauth_token')!;
    const accessTokenSecret = params.get('oauth_token_secret')!;

    const identity = await this.getIdentity(accessToken, accessTokenSecret);

    await prisma.discogsConnection.upsert({
      where: { userId: stored.userId },
      create: {
        userId: stored.userId,
        discogsUsername: identity.username,
        accessToken,
        accessTokenSecret,
      },
      update: {
        discogsUsername: identity.username,
        accessToken,
        accessTokenSecret,
        connectedAt: new Date(),
      },
    });

    oauthStore.delete(oauthToken);
  }

  async getIdentity(
    accessToken: string,
    accessTokenSecret: string
  ): Promise<{ username: string; id: number }> {
    const url = `${DISCOGS_BASE}/oauth/identity`;
    const token: OAuth.Token = { key: accessToken, secret: accessTokenSecret };

    const response = await axios.get(url, {
      headers: {
        ...this.authHeader(url, 'GET', token),
        'User-Agent': USER_AGENT,
      },
    });

    return response.data as { username: string; id: number };
  }

  async getCollectionPage(
    username: string,
    accessToken: string,
    accessTokenSecret: string,
    page: number,
    perPage = 100
  ) {
    const url = `${DISCOGS_BASE}/users/${encodeURIComponent(username)}/collection/folders/0/releases`;
    const token: OAuth.Token = { key: accessToken, secret: accessTokenSecret };

    const response = await axios.get(url, {
      headers: {
        ...this.authHeader(url, 'GET', token),
        'User-Agent': USER_AGENT,
      },
      params: { page, per_page: perPage, sort: 'added', sort_order: 'desc' },
    });

    return response.data;
  }

  async getReleaseStats(releaseId: number) {
    const url = `${DISCOGS_BASE}/marketplace/stats/${releaseId}`;

    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    return response.data as {
      lowest_price: { value: number; currency: string } | null;
      num_for_sale: number;
    };
  }
}
