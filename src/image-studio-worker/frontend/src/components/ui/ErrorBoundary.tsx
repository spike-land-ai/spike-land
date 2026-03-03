import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
              <span className="text-red-400 text-xl">!</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Something went wrong</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-xs">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all"
            >
              Try Again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
