# Modern React Patterns and Best Practices

> **Last Updated**: December 2025 **Audience**: React developers building
> production applications **Framework Context**: Next.js 15, React 19+,
> TypeScript

---

## Table of Contents

1. [Component Patterns](#component-patterns)
2. [State Management](#state-management)
3. [Performance Optimization](#performance-optimization)
4. [Custom Hooks Patterns](#custom-hooks-patterns)
5. [Error Handling](#error-handling)
6. [Accessibility Standards](#accessibility-standards)
7. [Best Practices Checklist](#best-practices-checklist)
8. [Resources and Further Reading](#resources-and-further-reading)

---

## Component Patterns

Modern React development has evolved significantly with the introduction of
React 19 and the maturation of the ecosystem. Understanding different component
patterns helps you choose the right approach for your use case.

### 1. Function Components (Modern Standard)

**Status**: ✅ **Recommended** **Since**: React 16.8+ (Hooks)

Function components have become the de facto standard for React development,
replacing class components for practically all use cases.

```typescript
// ✅ Modern Function Component
export function UserProfile({ userId }: { userId: string; }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### 2. Compound Components Pattern

**Status**: ✅ **Recommended for UI Libraries** **Use Case**: Flexible,
declarative APIs for related components

Compound Components is a design pattern where components work together, sharing
implicit state to provide a more expressive and flexible API. The best example
is the HTML `<select>` and `<option>` elements.

```typescript
// Parent component with Context
export function Menu({ children }: { children: React.ReactNode; }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const value = {
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
  };

  return (
    <MenuContext.Provider value={value}>
      <div className="menu">{children}</div>
    </MenuContext.Provider>
  );
}

// Child components
export function MenuTrigger({ children }: { children: React.ReactNode; }) {
  const { isOpen, setIsOpen } = useContext(MenuContext);

  return (
    <button onClick={() => setIsOpen(!isOpen)}>
      {children}
    </button>
  );
}

export function MenuList({ children }: { children: React.ReactNode; }) {
  const { isOpen } = useContext(MenuContext);

  if (!isOpen) return null;

  return <ul className="menu-list">{children}</ul>;
}

export function MenuItem({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <li>
      <button onClick={onSelect}>{children}</button>
    </li>
  );
}

// Usage
function App() {
  return (
    <Menu>
      <MenuTrigger>Open Menu</MenuTrigger>
      <MenuList>
        <MenuItem onSelect={() => console.log("Item 1")}>
          Item 1
        </MenuItem>
        <MenuItem onSelect={() => console.log("Item 2")}>
          Item 2
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
```

**Advantages:**

- Declarative, readable JSX
- Flexible component relationships
- Encapsulated state management
- Better than passing deeply nested props

### 3. Higher-Order Components (HOC)

**Status**: ⚠️ **Legacy Pattern** (Use Custom Hooks instead) **When to Use**:
Rarely needed in modern React

A Higher-Order Component (HOC) takes in a component as an argument and returns a
supercharged component with additional data or functionality.

```typescript
// ❌ Legacy pattern
function withTheme(Component: React.ComponentType<any>) {
  return function WrappedComponent(props: any) {
    const [theme, setTheme] = useState("light");

    return (
      <Component
        {...props}
        theme={theme}
        toggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")}
      />
    );
  };
}

// ✅ Modern alternative: Custom hook
function useTheme() {
  const [theme, setTheme] = useState("light");

  return {
    theme,
    toggleTheme: () => setTheme(t => t === "light" ? "dark" : "light"),
  };
}
```

**Note**: Custom Hooks are superior because they:

- Don't create new component boundaries
- Allow static analysis by React Compiler
- Avoid the "wrapper hell" problem
- Have better debugging experience

### 4. Render Props Pattern

**Status**: ⚠️ **Legacy Pattern** (Use Custom Hooks instead) **When to Use**:
Legacy codebases only

Render Props is a technique for sharing code between components using a prop
whose value is a function.

```typescript
// ❌ Legacy pattern - avoid
<RenderPropsExample
  render={data => (
    <AnotherComponent>
      {data}
    </AnotherComponent>
  )}
/>;

// ✅ Modern alternative: Custom hook
const data = useRenderPropsExample();
```

**Issues with Render Props:**

- Creates "callback hell" with nested JSX
- Harder to debug and reason about
- Less composable than hooks
- Makes static analysis difficult

---

## State Management

State management in React has matured from "one giant store" to a purpose-built,
two-tool toolkit: **TanStack Query** for server state and **Zustand** for client
state.

### State Management Decision Tree

```
Do you need to manage data from an API?
├─ YES → Use TanStack Query (React Query)
│   └─ Handles caching, invalidation, refetching
│
Do you need global UI state (theme, modals, etc.)?
├─ YES → Start with Context
│   ├─ Simple cases → React Context + useReducer
│   ├─ Multiple stores → Zustand (1KB, minimal boilerplate)
│   └─ Complex state → Redux Toolkit (large apps with team collaboration)
│
Do you need time-travel debugging or strict patterns?
├─ YES → Redux Toolkit (large enterprise apps)
└─ NO → Zustand or Context
```

### 1. Server State with TanStack Query

**Status**: ✅ **Recommended** **Library**: `@tanstack/react-query`

TanStack Query replaces Redux boilerplate for managing remote state. It handles
caching, deduplication, invalidation, retries, pagination, and optimistic
updates.

```typescript
import { useMutation, useQuery } from "@tanstack/react-query";

// Fetching data
function UsersList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}

// Mutating data
function CreateUserForm() {
  const { mutate: createUser, isPending } = useMutation({
    mutationFn: async (newUser: { name: string; email: string; }) => {
      const response = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        createUser({ name: "John", email: "john@example.com" });
      }}
    >
      <button disabled={isPending}>Create User</button>
    </form>
  );
}
```

**Key Features:**

- Automatic caching and invalidation
- Deduplication of requests
- Optimistic updates
- Background refetching
- Pagination and infinite queries
- DevTools for debugging

**Performance Impact:**

- Reduces bundle size compared to Redux
- Automatic garbage collection of stale data
- Efficient refetch strategies

### 2. Client State with Zustand

**Status**: ✅ **Recommended for Global UI State** **Library**: `zustand`
**Bundle Size**: ~1KB

Zustand offers minimalist state management with a simple API and hooks-based
approach.

```typescript
import { create } from "zustand";

// Create a store
interface ThemeStore {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>(set => ({
  theme: "light",
  toggleTheme: () =>
    set(state => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),
}));

// Use in component
function Header() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className={`header ${theme}`}>
      <button onClick={toggleTheme}>
        Switch to {theme === "light" ? "dark" : "light"} mode
      </button>
    </header>
  );
}

// Persist store to localStorage
const usePersistedStore = create<AppStore>(
  persist(
    set => ({
      // state and actions
    }),
    {
      name: "app-store",
      storage: localStorage,
    },
  ),
);
```

**Use Cases:**

- Theme toggling
- Modal visibility
- Sidebar state
- UI preferences
- Form state for complex forms

**Advantages over Redux:**

- No boilerplate
- No actions, reducers, dispatches
- Direct store mutations
- DevTools integration optional
- Small bundle size

### 3. Context + useReducer (Simple Cases)

**Status**: ✅ **For Simple Global State**

For simple global state without external dependencies, React Context with
`useReducer` works well.

```typescript
type ThemeAction =
  | { type: "TOGGLE_THEME"; }
  | { type: "SET_THEME"; payload: "light" | "dark"; };

interface ThemeState {
  theme: "light" | "dark";
}

const initialState: ThemeState = { theme: "light" };

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case "TOGGLE_THEME":
      return {
        ...state,
        theme: state.theme === "light" ? "dark" : "light",
      };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    default:
      return state;
  }
}

const ThemeContext = createContext<
  {
    state: ThemeState;
    dispatch: React.Dispatch<ThemeAction>;
  } | null
>(null);

export function ThemeProvider({ children }: { children: React.ReactNode; }) {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  return (
    <ThemeContext.Provider value={{ state, dispatch }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
```

### 4. Redux Toolkit (Complex Enterprise Apps)

**Status**: ✅ **For Large Applications** **When**: Strict patterns, team
collaboration, complex logic

Redux Toolkit modernizes Redux with:

- Minimal boilerplate (createSlice, RTK Query)
- Built-in immutability (Immer)
- DevTools integration
- Better TypeScript support

```typescript
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// Async thunk
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async () => {
    const response = await fetch("/api/users");
    return response.json();
  },
);

// Slice
const usersSlice = createSlice({
  name: "users",
  initialState: {
    list: [] as User[],
    loading: false,
    error: null as string | null,
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUsers.pending, state => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch";
      });
  },
});

export default usersSlice.reducer;
```

### State Management Comparison Table

| Feature        | Context      | Zustand     | Redux Toolkit   | TanStack Query |
| -------------- | ------------ | ----------- | --------------- | -------------- |
| Bundle Size    | ~0KB         | ~1KB        | ~20KB           | ~30KB          |
| Boilerplate    | Low          | Very Low    | Medium          | Low            |
| DevTools       | ❌           | ✅ Optional | ✅ Excellent    | ✅ Excellent   |
| Learning Curve | Easy         | Very Easy   | Medium          | Easy           |
| Scaling        | Small apps   | Medium      | Large           | Server state   |
| Type Safety    | Good         | Excellent   | Excellent       | Excellent      |
| Performance    | Good         | Excellent   | Excellent       | Excellent      |
| **Best For**   | Simple state | UI state    | Enterprise apps | API data       |

---

## Performance Optimization

React 19 introduces the React Compiler, which eliminates the need for manual
memoization in most cases. However, understanding these patterns is essential
for optimization.

### 1. React.memo - Component Memoization

**Purpose**: Prevent component re-renders when props haven't changed

```typescript
// ❌ Without memoization (re-renders every time parent renders)
function UserCard({ user }: { user: User; }) {
  console.log("UserCard rendered");
  return <div>{user.name}</div>;
}

// ✅ With memoization
const UserCard = memo(function UserCard({ user }: { user: User; }) {
  console.log("UserCard rendered only when user changes");
  return <div>{user.name}</div>;
});

// Usage
function ParentComponent() {
  const [count, setCount] = useState(0);
  const user = { id: 1, name: "John" };

  return (
    <>
      <UserCard user={user} /> {/* Re-renders on every parent render */}
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </>
  );
}
```

**⚠️ Important**: `React.memo` is only effective when:

- Props remain the same (use `useMemo` for objects/arrays)
- Component is expensive to render
- Component renders often with same props

### 2. useMemo - Value Memoization

**Purpose**: Memoize expensive computations

```typescript
// ❌ Without memoization (recalculates every render)
function DataAnalysis({ data }: { data: number[]; }) {
  const expensiveResult = computeComplexAnalysis(data);
  return <div>{expensiveResult}</div>;
}

// ✅ With memoization
function DataAnalysis({ data }: { data: number[]; }) {
  const expensiveResult = useMemo(
    () => computeComplexAnalysis(data),
    [data], // Only recalculate when data changes
  );
  return <div>{expensiveResult}</div>;
}

// Example: Filtering a large list
function FilteredUsersList({ users, searchTerm }: {
  users: User[];
  searchTerm: string;
}) {
  const filteredUsers = useMemo(() => {
    console.log("Filtering users...");
    return users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [users, searchTerm]);

  return (
    <ul>
      {filteredUsers.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

### 3. useCallback - Function Memoization

**Purpose**: Stabilize function references to prevent unnecessary re-renders of
memoized children

```typescript
// ❌ Without memoization (new function on every render)
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log("Button clicked");
  };

  return (
    <>
      {/* Child re-renders because handleClick is new every render */}
      <MemoizedChild onClick={handleClick} />
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </>
  );
}

// ✅ With memoization
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log("Button clicked");
  }, []); // Empty deps = stable reference forever

  return (
    <>
      {/* Child only re-renders if handleClick deps change */}
      <MemoizedChild onClick={handleClick} />
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </>
  );
}

const MemoizedChild = memo(
  function Child({ onClick }: { onClick: () => void; }) {
    console.log("Child rendered");
    return <button onClick={onClick}>Child Button</button>;
  },
);
```

**Common Pattern**: Combining memo + useCallback + useMemo

```typescript
const UserList = memo(function UserList({
  users,
  onUserSelect,
}: {
  users: User[];
  onUserSelect: (user: User) => void;
}) {
  return (
    <ul>
      {users.map(user => (
        <UserItem
          key={user.id}
          user={user}
          onSelect={onUserSelect}
        />
      ))}
    </ul>
  );
});

function Parent() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const users = useMemo(() => {
    return fetchUsers(searchTerm);
  }, [searchTerm]);

  const handleUserSelect = useCallback((user: User) => {
    setSelectedUser(user);
  }, []);

  return <UserList users={users} onUserSelect={handleUserSelect} />;
}
```

### 4. Code Splitting & Lazy Loading

**Purpose**: Load components only when needed

```typescript
import { lazy, Suspense } from "react";

// Lazy load a component
const HeavyComponent = lazy(() => import("./HeavyComponent"));

function App() {
  const [showHeavy, setShowHeavy] = useState(false);

  return (
    <>
      <button onClick={() => setShowHeavy(true)}>
        Load Heavy Component
      </button>

      {showHeavy && (
        <Suspense fallback={<div>Loading component...</div>}>
          <HeavyComponent />
        </Suspense>
      )}
    </>
  );
}
```

### 5. Virtualization for Long Lists

**Purpose**: Render only visible items in very long lists

```typescript
import { FixedSizeList as List } from "react-window";

function VirtualizedUsersList({ users }: { users: User[]; }) {
  const Row = (
    { index, style }: { index: number; style: React.CSSProperties; },
  ) => (
    <div style={style}>
      {users[index].name}
    </div>
  );

  return (
    <List
      height={600}
      itemCount={users.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### Performance Optimization Checklist

- ❌ **Don't use memoization by default** - Profile first
- ✅ **Use React DevTools Profiler** - Identify actual bottlenecks
- ✅ **React 19 Compiler** - Automatically optimizes in many cases
- ✅ **Lazy load heavy components** - Use React.lazy + Suspense
- ✅ **Virtualize long lists** - Use react-window or react-virtual
- ✅ **Monitor bundle size** - Keep dependencies minimal
- ✅ **Use Web Workers** - For heavy computations off main thread

---

## Custom Hooks Patterns

Custom hooks are one of the most powerful patterns in React, enabling code reuse
and separation of concerns.

### 1. Basic Custom Hook

```typescript
// ✅ Extracting stateful logic into a hook
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      try {
        const response = await fetch(url);
        const json = await response.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetch();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

// Usage
function UserProfile({ userId }: { userId: string; }) {
  const { data: user, loading, error } = useFetch<User>(
    `/api/users/${userId}`,
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{user?.name}</div>;
}
```

**⚠️ Note**: For production apps, use TanStack Query instead of `useFetch`

### 2. Hook Composition

```typescript
// Composing multiple hooks
function useUserData(userId: string) {
  const user = useFetchUser(userId);
  const theme = useTheme();
  const notifications = useNotifications(userId);

  return {
    user,
    theme,
    notifications,
  };
}

// Use composed hook
function Dashboard({ userId }: { userId: string; }) {
  const { user, theme, notifications } = useUserData(userId);

  return (
    <div className={theme}>
      <h1>{user.name}</h1>
      <NotificationBell count={notifications.length} />
    </div>
  );
}
```

### 3. Hook with Reducer Pattern

```typescript
// Complex hook with reducer
interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

type FormAction =
  | { type: "SET_FIELD"; field: string; value: string; }
  | { type: "SET_ERROR"; field: string; error: string; }
  | { type: "TOUCH_FIELD"; field: string; }
  | { type: "RESET"; };

function useForm(initialValues: Record<string, string>) {
  const [state, dispatch] = useReducer(formReducer, {
    values: initialValues,
    errors: {},
    touched: {},
  });

  return {
    ...state,
    setFieldValue: (field: string, value: string) => dispatch({ type: "SET_FIELD", field, value }),
    setFieldError: (field: string, error: string) => dispatch({ type: "SET_ERROR", field, error }),
    touchField: (field: string) => dispatch({ type: "TOUCH_FIELD", field }),
    reset: () => dispatch({ type: "RESET" }),
  };
}

// Usage
function LoginForm() {
  const form = useForm({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate and submit
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.values.email}
        onChange={e => form.setFieldValue("email", e.target.value)}
      />
      {form.errors.email && <span>{form.errors.email}</span>}
    </form>
  );
}
```

### 4. Testing Custom Hooks

```typescript
import { act, renderHook } from "@testing-library/react";

describe("useFetch", () => {
  it("should fetch data successfully", async () => {
    const { result } = renderHook(() => useFetch("/api/users"));

    expect(result.current.loading).toBe(true);

    // Wait for async operations
    await act(async () => {
      // Simulate data load
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.loading).toBe(false);
  });

  it("should handle errors", async () => {
    const { result } = renderHook(() => useFetch("/api/invalid"));

    await act(async () => {
      // Simulate error
    });

    expect(result.current.error).toBeDefined();
  });

  it("should update when dependency changes", async () => {
    const { result, rerender } = renderHook(
      ({ url }) => useFetch(url),
      { initialProps: { url: "/api/users/1" } },
    );

    rerender({ url: "/api/users/2" });

    // Verify refetch happened
  });
});
```

### Custom Hook Best Practices

- ✅ **Start with `use` prefix** - Helps identify hooks
- ✅ **Keep hooks focused** - Single responsibility principle
- ✅ **Extract complex logic** - Makes components cleaner
- ✅ **Use TypeScript** - Better type safety
- ✅ **Write tests** - Verify hook behavior
- ❌ **Don't use hooks conditionally** - Call them at top level
- ❌ **Don't call hooks in loops/conditions** - Rules of Hooks

---

## Error Handling

Modern React provides powerful patterns for handling errors and loading states.

### 1. Error Boundaries

Error Boundaries catch errors during render, lifecycle methods, and
constructors. They do NOT catch:

- Event handlers (use try/catch)
- Async operations (use Suspense)
- Server-side rendering

```typescript
import { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  { children: ReactNode; },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Better: Use react-error-boundary library**

```typescript
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role="alert">
      <h1>Something went wrong</h1>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error("Error:", error, errorInfo);
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 2. Suspense for Loading States

Suspense handles loading states for Suspense-enabled data sources (React Query,
Relay, SWR, Server Components).

```typescript
import { Suspense } from "react";

function UserProfile({ userId }: { userId: string; }) {
  return (
    <Suspense fallback={<div>Loading user...</div>}>
      <UserContent userId={userId} />
    </Suspense>
  );
}

// Must use Suspense-enabled data source
function UserContent({ userId }: { userId: string; }) {
  // This throws a promise while loading
  const user = use(fetchUser(userId));

  return <div>{user.name}</div>;
}
```

### 3. Combined Error Boundary + Suspense Pattern

**Recommended**: Wrap Suspense with Error Boundary

```typescript
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

function UserPage({ userId }: { userId: string; }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingSpinner />}>
        <UserProfile userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Handles:
// ✅ Loading states (Suspense)
// ✅ Errors during render (ErrorBoundary)
// ✅ Network errors (ErrorBoundary + Error Fallback)
```

### 4. Event Handler Error Handling

```typescript
function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);
      await loginUser(email, password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* form fields */}
    </form>
  );
}
```

### Error Handling Architecture

```
Component Tree
├── <ErrorBoundary> (Global)
│   ├── <Header>
│   ├── <Navigation>
│   └── <Page>
│       ├── <ErrorBoundary> (Page-level)
│       │   └── <Suspense>
│       │       └── <UserProfile>
│       │           └── <Suspense>
│       │               └── <UserContent>
│       │
│       └── Try/Catch for event handlers
```

---

## Accessibility Standards

Building accessible React applications ensures your app works for everyone,
including people with disabilities.

### 1. Semantic HTML

**Foundation**: Use semantic HTML elements instead of divs

```typescript
// ❌ Not accessible
function Navigation() {
  return (
    <div className="nav">
      <div onClick={() => navigate("/")}>Home</div>
      <div onClick={() => navigate("/about")}>About</div>
    </div>
  );
}

// ✅ Accessible
function Navigation() {
  return (
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  );
}

// Semantic elements
// <header>, <nav>, <main>, <section>, <article>, <aside>, <footer>
// <h1>-<h6>, <p>, <ul>, <ol>, <li>
// <button>, <form>, <input>, <label>
```

### 2. ARIA Attributes

Use ARIA when semantic HTML isn't sufficient for complex widgets.

```typescript
// Custom button with ARIA
function CustomButton({
  isPressed,
  onClick,
}: {
  isPressed: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      aria-pressed={isPressed}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
      className={isPressed ? "pressed" : ""}
    >
      Toggle Feature
    </div>
  );
}

// Modal with ARIA
function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="modal"
    >
      <h2 id="modal-title">Confirm Action</h2>
      <p>Are you sure?</p>
      <button onClick={onClose}>Cancel</button>
      <button onClick={onClose}>Confirm</button>
    </div>
  );
}

// Alert with ARIA Live Region
function Notification({ message }: { message: string; }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}
```

**Common ARIA Attributes:**

- `role` - Defines element's purpose
- `aria-label` - Describes element for screen readers
- `aria-labelledby` - Links element to label
- `aria-describedby` - Adds description
- `aria-live` - Announces dynamic content
- `aria-modal` - Indicates modal dialog
- `aria-pressed` - Indicates button toggle state
- `aria-expanded` - Indicates expand/collapse state

### 3. Keyboard Navigation

Ensure all functionality is accessible via keyboard alone.

```typescript
// Trap focus in modal
function FocusTrappedModal({ onClose }: { onClose: () => void; }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift+Tab from first element -> focus last
        if (document.activeElement === firstFocusableRef.current) {
          lastFocusableRef.current?.focus();
          e.preventDefault();
        }
      } else {
        // Tab from last element -> focus first
        if (document.activeElement === lastFocusableRef.current) {
          firstFocusableRef.current?.focus();
          e.preventDefault();
        }
      }

      // Escape key to close
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    firstFocusableRef.current?.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      <button
        ref={firstFocusableRef}
        onClick={onClose}
      >
        Close
      </button>
      {/* Modal content */}
      <button ref={lastFocusableRef} onClick={onClose}>
        Confirm
      </button>
    </div>
  );
}

// Use aria-hidden for skip links
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only" // Visually hidden but accessible
    >
      Skip to main content
    </a>
  );
}
```

### 4. Screen Reader Optimization

```typescript
// Announce loading states
function LoadingIndicator({ isLoading }: { isLoading: boolean; }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
    >
      {isLoading && <span>Loading...</span>}
    </div>
  );
}

// Form with associated labels
function LoginForm() {
  return (
    <form>
      <label htmlFor="email">Email Address</label>
      <input id="email" type="email" required />

      <label htmlFor="password">Password</label>
      <input id="password" type="password" required />

      <button type="submit">Login</button>
    </form>
  );
}

// List with proper heading structure
function ProductsList({ products }: { products: Product[]; }) {
  return (
    <section>
      <h2>Available Products</h2>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### 5. Using React Aria Library

**Status**: ✅ **Recommended for Complex Components** **Library**:
`@react-aria/button`, `@react-aria/menu`, etc.

React Aria provides accessibility implementations out of the box.

```typescript
import { useButton } from "@react-aria/button";
import { useMenu } from "@react-aria/menu";

// Accessible button with built-in keyboard handling
function AccessibleButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton(props, ref);

  return <button {...buttonProps} ref={ref}>{props.children}</button>;
}

// Accessible menu with keyboard navigation and ARIA
function AccessibleMenu() {
  const { menuProps, menuItems } = useMenu(/* config */);

  return (
    <ul {...menuProps}>
      {menuItems.map(item => <li key={item.key}>{item.name}</li>)}
    </ul>
  );
}
```

### Accessibility Testing Tools

```bash
# ESLint plugin for JSX accessibility
yarn add --dev eslint-plugin-jsx-a11y

# Automated accessibility testing
yarn add --dev @axe-core/react

# Manual testing
# - Chrome DevTools: Lighthouse Accessibility audit
# - VoiceOver (macOS), NVDA (Windows), JAWS (Windows)
```

### Accessibility Checklist

- ✅ Semantic HTML structure
- ✅ Proper heading hierarchy (h1 → h6)
- ✅ Form labels associated with inputs
- ✅ Keyboard navigation support (Tab, Enter, Space, Arrow keys)
- ✅ Focus visible and manageable
- ✅ Color contrast ratios (WCAG AA: 4.5:1 text, 3:1 graphics)
- ✅ Alt text for images
- ✅ ARIA attributes for complex widgets
- ✅ Skip to main content link
- ✅ Error messages clear and associated

---

## Best Practices Checklist

### Code Quality

- [ ] Use TypeScript strict mode
- [ ] 100% test coverage (unit + E2E)
- [ ] ESLint configuration with recommended rules
- [ ] React DevTools for debugging
- [ ] Profiler for performance issues

### Component Organization

- [ ] Components in `/components` directory
- [ ] Utilities in `/lib/utils`
- [ ] Custom hooks in `/hooks`
- [ ] Types in `/types` or colocated with usage
- [ ] Test files alongside source (`*.test.tsx`)
- [ ] Extract container/presentation logic

### State Management

- [ ] TanStack Query for server state
- [ ] Zustand for simple global state
- [ ] Context + useReducer for complex state
- [ ] Keep state close to usage
- [ ] Avoid prop drilling with proper patterns

### Performance

- [ ] Profile before optimizing
- [ ] Use React DevTools Profiler
- [ ] Lazy load heavy components
- [ ] Virtualize long lists
- [ ] Monitor bundle size
- [ ] Code split at route level
- [ ] Use React Suspense for async operations

### Accessibility

- [ ] Semantic HTML everywhere
- [ ] Keyboard navigation tested
- [ ] Screen reader compatibility
- [ ] Color contrast ratios checked
- [ ] ARIA attributes for complex widgets
- [ ] Automated testing with axe/Lighthouse
- [ ] Manual testing with screen reader

### Testing

- [ ] Unit tests for utilities and logic
- [ ] Component tests with React Testing Library
- [ ] E2E tests for user flows
- [ ] Coverage reports
- [ ] Snapshot testing (used sparingly)
- [ ] Test accessibility explicitly

### Deployment

- [ ] Environment variables configured
- [ ] Error tracking setup (structured logging)
- [ ] Analytics configured
- [ ] Monitoring and alerts in place
- [ ] Build artifacts optimized
- [ ] Load testing completed

---

## Resources and Further Reading

### Official Documentation

- [React Documentation](https://react.dev) - Official React docs with
  interactive examples
- [Next.js Documentation](https://nextjs.org/docs) - Framework-specific patterns
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type safety best
  practices
- [Web Content Accessibility Guidelines (WCAG 2.2)](https://www.w3.org/WAI/WCAG22/quickref/)

### State Management

- [TanStack Query Documentation](https://tanstack.com/query/latest) - Server
  state management
- [Zustand Documentation](https://github.com/pmndrs/zustand) - Minimal state
  management
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/) - Enterprise
  state management
- [React Context API](https://react.dev/reference/react/createContext) -
  Built-in state sharing

### Performance & Optimization

- [React DevTools Profiler Guide](https://react.dev/learn/render-and-commit) -
  Performance profiling
- [Web Vitals](https://web.dev/vitals/) - Core Web Vitals metrics
- [React 19 Compiler](https://react.dev/learn/react-compiler) - Automatic
  optimization

### Accessibility

- [React Aria Library](https://react-spectrum.adobe.com/react-aria/) -
  Accessible components
- [ARIAKit](https://ariakit.org/) - Unstyled accessible primitives
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - ARIA usage
  guide
- [Inclusive Components](https://inclusive-components.design/) - Component
  accessibility patterns

### Testing

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/) -
  Component testing
- [Playwright Documentation](https://playwright.dev/) - E2E testing
- [Vitest Documentation](https://vitest.dev/) - Unit test framework
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about) -
  Query strategies

### Design Patterns

- [Patterns.dev React](https://www.patterns.dev/react/) - Comprehensive pattern
  guide
- [Kent C. Dodds Blog](https://kentcdodds.com/) - React patterns and best
  practices
- [Dan Abramov Blog](https://overreacted.io/) - Deep dives into React concepts
- [Smashing Magazine React](https://www.smashingmagazine.com/tag/react/) -
  In-depth articles

### Featured Articles & Publications

- [React Design Patterns and Best Practices for 2025 (Telerik)](https://www.telerik.com/blogs/react-design-patterns-best-practices)
- [React & Next.js in 2025 - Modern Best Practices (Strapi)](https://strapi.io/blog/react-and-nextjs-in-2025-modern-best-practices)
- [React Stack Patterns (patterns.dev)](https://www.patterns.dev/react/react-2026/)
- [Do You Need State Management in 2025? (DEV Community)](https://dev.to/saswatapal/do-you-need-state-management-in-2025-react-context-vs-zustand-vs-jotai-vs-redux-1ho)
- [State Management in 2025 (Medium)](https://medium.com/@pooja.1502/state-management-in-2025-redux-toolkit-vs-zustand-vs-jotai-vs-tanstack-store-c888e7e6f784)
- [Advanced React Hooks Patterns & Best Practices (Angular Minds)](https://www.angularminds.com/blog/advanced-react-hooks-patterns-and-best-practices)
- [Advanced React Hooks in 2025 (DEV Community)](https://dev.to/tahamjp/advanced-react-hooks-in-2025-patterns-you-should-know-2e4n)

---

## Implementation Guide for Spike Land

### Recommended Stack for This Project

Given the project context (Next.js 15, TypeScript, shadcn/ui):

```typescript
// 1. Server State - TanStack Query
import { useQuery } from "@tanstack/react-query";

// 2. Client State - Zustand
import { create } from "zustand";

// 3. Components - Compound Pattern with Context
export function AppSelect({ children }: { children: React.ReactNode; }) {
  const [value, setValue] = useState("");
  return (
    <SelectContext.Provider value={{ value, setValue }}>
      {children}
    </SelectContext.Provider>
  );
}

// 4. Error Handling - ErrorBoundary + Suspense
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <Suspense fallback={<Spinner />}>
    <DataComponent />
  </Suspense>
</ErrorBoundary>;

// 5. Performance - React.memo for expensive components
const UserCard = memo(function UserCard({ user }: Props) {
  return; /* ... */
});

// 6. Accessibility - Semantic HTML + React Aria
<nav>
  <button aria-expanded={isOpen} aria-controls="menu">
    Menu
  </button>
</nav>;
```

### Next Steps

1. **Audit existing code** against this guide
2. **Implement TanStack Query** for Image Enhancement App API calls
3. **Migrate to Zustand** for UI state (modals, preferences)
4. **Add custom hooks** for reusable logic
5. **Enhance accessibility** with ARIA patterns
6. **Performance testing** with React DevTools Profiler

---

## Version History

| Version | Date     | Changes                                           |
| ------- | -------- | ------------------------------------------------- |
| 1.0     | Dec 2025 | Initial comprehensive guide for React 19 patterns |

---

**Last Updated**: December 6, 2025 **Framework**: React 19+, Next.js 15+
**TypeScript**: Strict Mode Required
