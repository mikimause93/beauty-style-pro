import React from 'react';

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
          <h1 className="text-2xl font-bold mb-4">Qualcosa è andato storto</h1>
          <p className="text-gray-400 mb-6">Si è verificato un errore imprevisto. Ricarica la pagina per continuare.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Ricarica l&apos;app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
