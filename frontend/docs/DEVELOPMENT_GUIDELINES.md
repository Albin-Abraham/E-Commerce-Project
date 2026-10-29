# Development Guidelines

## Code Standards

### TypeScript

#### Strict Mode

Always use TypeScript strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

#### Type Definitions

- Prefer `interface` for object shapes
- Use `type` for unions, intersections, and primitives
- Always define return types for functions
- Avoid `any` - use `unknown` if type is truly unknown

**Good**:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  return fetchUser(id);
}
```

**Bad**:

```typescript
function getUser(id: any): any {
  return fetchUser(id);
}
```

---

### React Components

#### Component Structure

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { ComponentProps } from './types';

// 2. Types/Interfaces
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

// 3. Component
export const MyComponent: React.FC<Props> = ({ title, onSubmit }) => {
  // 4. Hooks
  const [state, setState] = useState<string>('');

  // 5. Effects
  useEffect(() => {
    // ...
  }, []);

  // 6. Handlers
  const handleClick = () => {
    // ...
  };

  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

#### Naming Conventions

- **Components**: PascalCase (`UserProfile`, `DataTable`)
- **Hooks**: camelCase with `use` prefix (`useAuth`, `useFormValidation`)
- **Utilities**: camelCase (`formatDate`, `calculateTotal`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`UserData`, `ApiResponse`)

#### Component Best Practices

1. **Keep components small** - Max 200 lines
2. **Single responsibility** - One component, one purpose
3. **Extract custom hooks** - Reuse logic across components
4. **Use composition** - Prefer composition over inheritance
5. **Memoize expensive calculations** - Use `useMemo` and `useCallback`

---

### File Organization

#### Directory Structure

```
src/
├── app/                    # Application setup
│   ├── boot/              # Boot components
│   ├── layouts/           # Layout components
│   └── providers/         # Context providers
│
├── components/            # Reusable components
│   ├── ui/               # UI primitives (Button, Input)
│   ├── form/             # Form components
│   └── shared/           # Shared business components
│
├── modules/              # Feature modules
│   ├── hrms/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   └── admin/
│
├── services/             # API services
├── hooks/                # Global custom hooks
├── utils/                # Utility functions
├── types/                # Global type definitions
└── constants/            # Global constants
```

#### File Naming

- **Components**: `UserProfile.tsx`
- **Hooks**: `useAuth.ts`
- **Utils**: `formatDate.ts`
- **Types**: `user.types.ts`
- **Tests**: `UserProfile.test.tsx`
- **Styles**: `UserProfile.module.css` (if using CSS modules)

---

### State Management

#### When to Use What

**Local State** (`useState`)

- Form inputs
- UI toggles (modals, dropdowns)
- Component-specific data

**Context** (`useContext`)

- Theme
- Authentication
- Language/i18n
- Global UI state

**Server State** (React Query)

- API data
- Cached responses
- Background refetching

**URL State** (React Router)

- Filters
- Pagination
- Search queries
- Active tabs

#### Example: Form State

```typescript
// Good: Local state for form
const [formData, setFormData] = useState({
  name: "",
  email: "",
});

// Good: React Query for submission
const mutation = useMutation({
  mutationFn: (data) => api.createUser(data),
  onSuccess: () => {
    toast.success("User created!");
  },
});
```

---

### Testing

#### Test Structure

```typescript
describe('UserProfile', () => {
  // Setup
  beforeEach(() => {
    // ...
  });

  // Teardown
  afterEach(() => {
    // ...
  });

  it('should render user name', () => {
    // Arrange
    const user = { name: 'John Doe' };

    // Act
    render(<UserProfile user={user} />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

#### Testing Priorities

1. **Critical user flows** - Login, checkout, data submission
2. **Business logic** - Calculations, validations
3. **Edge cases** - Empty states, errors, loading
4. **Accessibility** - Screen reader support, keyboard navigation

#### Coverage Targets

- **Overall**: 80%+
- **Business logic**: 90%+
- **UI components**: 70%+
- **Utilities**: 95%+

---

### Error Handling

#### API Errors

```typescript
try {
  const data = await api.fetchUser(id);
  return data;
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API-specific errors
    toast.error(error.message);
  } else {
    // Handle unexpected errors
    console.error("Unexpected error:", error);
    toast.error("Something went wrong");
  }
  throw error; // Re-throw if needed
}
```

#### React Error Boundaries

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to error reporting service
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

### Performance

#### Optimization Checklist

- [ ] Use `React.memo` for expensive components
- [ ] Implement code splitting with `lazy()` and `Suspense`
- [ ] Optimize images (WebP, lazy loading)
- [ ] Debounce/throttle expensive operations
- [ ] Use virtual scrolling for long lists
- [ ] Minimize bundle size (analyze with `npm run analyze`)

#### Code Splitting Example

```typescript
// Good: Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

---

### Accessibility

#### Requirements

- All interactive elements must be keyboard accessible
- Proper ARIA labels for screen readers
- Sufficient color contrast (WCAG AA minimum)
- Focus indicators visible
- Semantic HTML elements

#### Example

```typescript
// Good: Accessible button
<button
  onClick={handleClick}
  aria-label="Close dialog"
  aria-pressed={isActive}
>
  <CloseIcon aria-hidden="true" />
</button>

// Bad: Non-semantic div
<div onClick={handleClick}>
  Close
</div>
```

---

### Security

#### Best Practices

1. **Never store secrets in code** - Use environment variables
2. **Sanitize user input** - Prevent XSS attacks
3. **Use HTTPS** - Always in production
4. **Implement CSP** - Content Security Policy headers
5. **Validate on server** - Never trust client-side validation alone

#### Example: Safe User Input

```typescript
// Good: Sanitized input
import DOMPurify from "dompurify";

const sanitized = DOMPurify.sanitize(userInput);
```

---

## Code Review Checklist

### For Authors

- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.logs or debugger statements
- [ ] No commented-out code
- [ ] Meaningful commit messages
- [ ] PR description explains changes

### For Reviewers

- [ ] Code is readable and maintainable
- [ ] Logic is correct
- [ ] Edge cases handled
- [ ] Performance considerations addressed
- [ ] Security implications reviewed
- [ ] Tests are comprehensive
- [ ] No breaking changes (or properly documented)

---

## Git Workflow

See [BRANCHING_STRATEGY.md](./BRANCHING_STRATEGY.md) for detailed Git workflow.

**Quick Reference**:

```bash
# Start new feature
git checkout develop
git pull
git checkout -b feature/TICKET-123-description

# Commit changes
git add .
git commit -m "feat(module): add feature description"

# Push and create PR
git push origin feature/TICKET-123-description
```

---

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Library](https://testing-library.com/)
- [Web Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)
