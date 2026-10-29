# Overlay v1 Architecture

Standardized floating UI components for the application surface.

## Components

- **`Modal`**: The standard application modal wrapper providing focus trapping and backdrops.
- **`OverlayNav`**: For side-navigations and sliding drawers.
- **`useModal`**: A strict standard hook to manage overlay visibility state.

## Key Features

- **Z-Index Management**: Correctly maps to the application's CSS variables (`--z-dropdown`, `--z-modal`) for reliable layering.
- **Accessibility**: Enforces focus management and trap capabilities.
- **Animation**: Native integration with standard enter/exit animations.
