import React from 'react';
import { logger } from '../utils/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Unhandled React error boundary triggered.', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-space-dark text-star-white">
          <div className="text-center max-w-md p-8 liquid-glass-panel">
            <div className="text-6xl mb-4">🌌</div>
            <h2 className="text-2xl font-bold mb-4">
              Houston, we have a problem!
            </h2>
            <p className="text-gray-300 mb-6">
              The solar system encountered an error. Don't worry, the real
              planets are still in orbit!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="liquid-glass-button liquid-glass-primary hover:scale-105 transition-transform"
            >
              Restart Mission
            </button>
            {this.state.error && (
              <details className="mt-4 text-left text-xs text-gray-400">
                <summary className="cursor-pointer">Technical Details</summary>
                <pre className="mt-2 p-2 bg-black/50 rounded text-red-400 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
