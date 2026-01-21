import React from 'react';
import { logger } from '../utils/logger';
import { monitoring } from '../utils/monitoring';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Application Error:', { error, errorInfo });
    
    // Send to monitoring service
    monitoring.captureException(error, {
      componentStack: errorInfo?.componentStack,
      type: 'ErrorBoundary'
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-5">
          <div className="alert alert-danger">
            <h4 className="alert-heading">⚠️ Something went wrong</h4>
            <p>
              An unexpected error occurred. Please try refreshing the page or
              contact support if the problem persists.
            </p>
            {import.meta.env.DEV && (
              <hr />
            )}
            {import.meta.env.DEV && this.state.error && (
              <details className="alert-info p-2 rounded mt-2">
                <summary>Error Details (Dev Only)</summary>
                <pre className="mt-2">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              className="btn btn-primary mt-3"
              onClick={() => {
                this.resetError();
                window.location.href = '/';
              }}
            >
              Go to Home
            </button>
            <button
              className="btn btn-secondary ms-2 mt-3"
              onClick={this.resetError}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
