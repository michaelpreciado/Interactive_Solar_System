import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * WebGL failures are the realistic case here: a lost context, an unsupported
 * driver, or a shader that will not compile on some particular GPU. Any of
 * those throw during render and would otherwise leave a blank page with the
 * detail buried in the console.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Orrery crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="crash" role="alert">
        <div className="crash__card">
          <h1>The simulation stopped</h1>
          <p>
            Something went wrong while rendering. This is usually a graphics
            driver or WebGL problem rather than anything you did.
          </p>
          <pre>{error.message}</pre>
          <div className="crash__actions">
            <button onClick={() => window.location.reload()}>Reload</button>
            <button
              className="is-secondary"
              onClick={() => {
                try {
                  localStorage.removeItem('orrery.prefs.v1');
                } catch {
                  // Nothing useful to do if storage is unavailable.
                }
                window.location.reload();
              }}
            >
              Reset settings and reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
