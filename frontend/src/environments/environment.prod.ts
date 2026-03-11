export const environment = {
  production: true,
  apiUrl: (import.meta as unknown as { env: Record<string, string> }).env['NG_APP_API_URL'] ?? '/api',
  clerkPublishableKey: (import.meta as unknown as { env: Record<string, string> }).env['NG_APP_CLERK_PUBLISHABLE_KEY'] ?? '',
};
