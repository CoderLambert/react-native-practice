import { useEffect } from 'react';
import type { ErrorBoundaryProps } from 'expo-router';
import { View } from 'react-native';
import { Failure } from './components';
import { reportError } from '../observability';
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => { reportError(error); }, [error]);
  return <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}><Failure error={error} retry={() => void retry()} /></View>;
}
