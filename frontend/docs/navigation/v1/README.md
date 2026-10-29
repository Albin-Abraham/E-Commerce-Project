# Navigation v1 Architecture

The Navigation module provides standardized routing and menu components for the application surface, focusing heavily on accessibility, keyboard orchestration, and perceived performance.

## Core Components

- **`NavDropdown`**: An industrial-grade accessible dropdown menu powered by React Aria and Zenith Glassmorphism.

## Key Features

- **Strict Keyboard Orchestration**: Uses `useMenuKeyboardControl` for boilerplate-free keyboard navigation.
- **Prefetching Strategy**: Integrates with `prefetchManager` to pre-load routes on hover (`onMouseEnter`), providing instant perceived performance.
- **Active State Detection**: Integrates with `usePlatformNavigation` to correctly highlight active routes and show loading states during pending navigations.
