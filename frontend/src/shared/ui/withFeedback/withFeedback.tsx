import React from "react";

import { type UseFeedbackReturn, useFeedback } from "./useFeedback";

export type FeedbackProps = UseFeedbackReturn;

export function withFeedback<P extends object>(
  Component: React.ComponentType<P & FeedbackProps>
): React.FC<P> {
  function WithFeedback(props: P) {
    const feedback = useFeedback();
    return <Component {...props} {...feedback} />;
  }

  WithFeedback.displayName = `withFeedback(${Component.displayName || Component.name || "Component"})`;

  return WithFeedback;
}
