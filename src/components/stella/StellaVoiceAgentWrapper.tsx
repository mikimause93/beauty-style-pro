import { lazy, Suspense, Component, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

const StellaVoiceAgent = lazy(() => import('./StellaVoiceAgent'));

class StellaErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) {
    console.warn('[Stella] Caught error, will retry:', error.message);
    // Auto-recover after 5s
    setTimeout(() => this.setState({ hasError: false }), 5000);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

export default function StellaVoiceAgentWrapper() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <StellaErrorBoundary>
      <Suspense fallback={null}>
        <StellaVoiceAgent />
      </Suspense>
    </StellaErrorBoundary>
  );
}
