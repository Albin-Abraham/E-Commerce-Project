# Loading UI v1 Architecture

A centralized loading orchestration system to manage blocking and non-blocking asynchronous operations.

## Components

- **`LoaderOverlay`**: A singleton overlay component that renders a global loading spinner.

## How it works

The `LoadingService` provides an event-driven mechanism (`subscribe`) to broadcast `"LOADING"` and `"SUBMITTING"` states across the app. The `LoaderOverlay` automatically increments and decrements an internal counter based on these events to show or hide the global spinner reliably, without unmounting unnecessarily between rapid requests.
