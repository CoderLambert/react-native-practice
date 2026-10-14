import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
Sentry.init({
  dsn, enabled: Boolean(dsn) && !__DEV__, sendDefaultPii: false, tracesSampleRate: 0,
  beforeSend(event) {
    delete event.user;
    delete event.request;
    event.breadcrumbs = event.breadcrumbs?.filter(item => !['http', 'fetch', 'console'].includes(item.category ?? ''));
    return event;
  },
});
export function reportError(error: unknown): void {
  if (dsn && !__DEV__) Sentry.captureException(error);
}
