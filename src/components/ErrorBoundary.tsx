import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 ErrorBoundary caught an error:', error);
    console.error('🔴 Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-red-950/20 border-2 border-red-500/30 rounded-xl p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-black">!</span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-black text-red-400 mb-4">
                  Oops! Algo deu errado
                </h1>
                <p className="text-red-200 mb-6">
                  A aplicação encontrou um erro inesperado. Por favor, recarregue a página.
                </p>
                
                <div className="bg-black/50 rounded-lg p-4 mb-6 overflow-auto max-h-96">
                  <p className="text-red-300 font-mono text-sm mb-2">
                    <strong>Erro:</strong> {this.state.error?.message}
                  </p>
                  {this.state.error?.stack && (
                    <pre className="text-gray-400 text-xs overflow-auto">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                  >
                    Recarregar Página
                  </button>
                  <button
                    onClick={() => {
                      this.setState({ hasError: false, error: null, errorInfo: null });
                    }}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
