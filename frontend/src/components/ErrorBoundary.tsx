import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorPage } from "./ErrorPage";

type Props = {
  children: ReactNode;
  // When this changes (the URL), a shown error is cleared, so the next page can try again
  resetKey: string;
};

type State = { hasError: boolean };

// Catches errors thrown while React renders the pages below it, and shows the error page
// instead of a blank screen. React only supports this in a class component
// (there is no hook for it): getDerivedStateFromError and componentDidCatch are class methods.
// It does not catch errors in event handlers or fetches: those are handled where they happen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  // Called when a child throws: switch to the error page on the next render
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  // Logs the error for us in the browser console
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  // Moving to another page clears the error
  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage kind="crash" onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
