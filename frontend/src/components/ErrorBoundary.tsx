import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-red-200">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nimadir noto'g'ri ketdi
          </h3>
          <p className="text-gray-600 text-center mb-4 max-w-md">
            Sahifani yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.
          </p>
          {this.state.error && (
            <details className="mb-4 text-sm text-gray-500">
              <summary className="cursor-pointer">Texnik ma'lumotlar</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-md">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Qaytadan urinish</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;