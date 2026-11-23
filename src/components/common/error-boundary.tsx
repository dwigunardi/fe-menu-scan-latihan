'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      {
        module: this.props.moduleName || 'Global',
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
      `🚨 [UI Error Boundary] Uncaught error in ${this.props.moduleName || 'Component'}`
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 my-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-stone-900 dark:text-zinc-100 flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-base">Terjadi Kesalahan pada Tampilan</h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 max-w-md">
              {this.state.error?.message || 'Komponen mengalami kendala tak terduga.'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={this.handleReset}
            className="text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Coba Muat Ulang Komponen
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
