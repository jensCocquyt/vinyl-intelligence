export const environment = {
  production: true,
  apiUrl: (import.meta as any).env['NG_APP_API_URL'] ?? '/api',
  clerkPublishableKey: (import.meta as any).env['NG_APP_CLERK_PUBLISHABLE_KEY'] ?? '',
};
