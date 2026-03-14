import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches any render-time JavaScript errors in child components and
 * shows a friendly recovery screen instead of a blank page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Qualcosa è andato storto</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">
            Si è verificato un errore imprevisto. Prova a ricaricare la pagina.
          </p>
          {this.state.error && (
            <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 mb-6 max-w-sm overflow-auto text-left">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            Ricarica pagina
          </button>
          <button
            onClick={this.handleReset}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Riprova senza ricaricare
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
