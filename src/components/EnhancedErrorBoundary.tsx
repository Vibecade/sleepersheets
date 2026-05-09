
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';
import { logger } from '@/utils/logger';

interface EnhancedErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
}

class EnhancedErrorBoundary extends React.Component<EnhancedErrorBoundaryProps, EnhancedErrorBoundaryState> {
  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      errorId: this.generateErrorId()
    };
  }

  generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    return { 
      hasError: true, 
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { level = 'component' } = this.props;
    
    logger.error(`[${level.toUpperCase()}] Error boundary caught an error:`, {
      error,
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service if available
    if (level === 'critical') {
      this.reportCriticalError(error, errorInfo);
    }
  }

  reportCriticalError(error: Error, errorInfo: React.ErrorInfo) {
    // In a real app, you would send this to your error tracking service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    logger.error('CRITICAL ERROR REPORTED:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: this.generateErrorId()
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        errorId={this.state.errorId}
        level={this.props.level}
        onRetry={this.handleRetry}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
  level?: 'page' | 'component' | 'critical';
  onRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  errorId, 
  level = 'component', 
  onRetry 
}) => {
  const getErrorTitle = () => {
    switch (level) {
      case 'critical': return 'Critical Error Occurred';
      case 'page': return 'Page Error';
      default: return 'Something went wrong';
    }
  };

  const getErrorDescription = () => {
    switch (level) {
      case 'critical': 
        return 'A critical error has occurred that affects the entire application. Our team has been notified.';
      case 'page': 
        return 'An error occurred while loading this page. You can try refreshing or return to the homepage.';
      default: 
        return 'An error occurred while rendering this component. Please try again or contact support if the problem persists.';
    }
  };

  const handleGoHome = () => {
    try {
      window.location.href = '/';
    } catch (e) {
      logger.error('Failed to navigate home:', e);
    }
  };

  return (
    <Card className="border-red-200 bg-red-50 max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <CardTitle className="text-red-700">{getErrorTitle()}</CardTitle>
        </div>
        <CardDescription className="text-red-600">
          {getErrorDescription()}
        </CardDescription>
        <div className="text-xs text-red-500 font-mono bg-red-100 p-2 rounded">
          Error ID: {errorId}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onRetry}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
          
          {level === 'page' && (
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </Button>
          )}
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Page</span>
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-sm text-red-600">
            <summary className="cursor-pointer font-medium flex items-center space-x-2">
              <Bug className="w-4 h-4" />
              <span>Error Details (Development)</span>
            </summary>
            <div className="mt-2 space-y-2">
              <div className="bg-red-100 p-3 rounded">
                <strong>Error Message:</strong>
                <pre className="mt-1 whitespace-pre-wrap break-words text-xs">
                  {error.message}
                </pre>
              </div>
              {error.stack && (
                <div className="bg-red-100 p-3 rounded">
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 whitespace-pre-wrap break-words text-xs">
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo?.componentStack && (
                <div className="bg-red-100 p-3 rounded">
                  <strong>Component Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap break-words text-xs">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedErrorBoundary;
