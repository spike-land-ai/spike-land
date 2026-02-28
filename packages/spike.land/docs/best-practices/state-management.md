# React State Management Best Practices 2025

A comprehensive guide to managing state in modern React applications, covering
server state, client state, URL state, form state, and persistence strategies.

---

## Table of Contents

1. [Overview & Core Principles](#overview--core-principles)
2. [Server State Management](#server-state-management)
3. [Client State Management](#client-state-management)
4. [URL State Management](#url-state-management)
5. [Form State & Validation](#form-state--validation)
6. [Global vs Local State](#global-vs-local-state)
7. [State Persistence](#state-persistence)
8. [Decision Framework](#decision-framework)

---

## Overview & Core Principles

### The Modern State Management Mindset

The approach to state management has fundamentally changed in modern React
development. Instead of using a single state management library for everything,
developers now use **specialized libraries for different types of state**:

- **Server State**: Data from APIs and external sources
- **Client State**: Local application state (UI, preferences, filters)
- **URL State**: Navigation and filterable data (search params, pagination)
- **Form State**: User inputs and validation

### Key Principles

1. **Keep State Local When Possible**
   - Only share state between components when necessary
   - Avoid premature abstraction and "state management for everything"
   - Use React's built-in hooks (useState, useContext, useReducer) for most
     needs

2. **Separate Server State from Client State**
   - Server state has unique challenges: caching, synchronization, staleness
   - Client state is local UI state that you fully control
   - Different tools excel at different problems

3. **Choose Based on Problem Size**
   - Small apps: React hooks + Context
   - Medium apps: Zustand + TanStack Query
   - Large/enterprise apps: Redux Toolkit + TanStack Query + specialized tools

4. **Type Safety First**
   - Use TypeScript to catch errors early
   - Leverage type inference from validation schemas (Zod)
   - Define clear interfaces for state shapes

---

## Server State Management

### Overview

Server state is fundamentally different from client state. It's:

- **Persisted remotely** - Stored on a server you may not control
- **Can become stale** - May change without your knowledge
- **Asynchronous** - Requires loading, caching, and synchronization logic
- **Shared across users** - Multiple users accessing the same data

### TanStack Query (React Query)

**TanStack Query** is the de facto standard for server state management. It
handles fetching, caching, synchronization, and updating server state without
touching global state.

#### Key Features

- Automatic caching and deduplication
- Background refetching and synchronization
- Stale data handling
- Pagination and infinite scrolling
- Request cancellation
- Optimistic updates
- SSR/Suspense support
- Devtools for debugging

#### Installation

```bash
npm install @tanstack/react-query
```

#### Basic Setup

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}
```

#### Query Example

```typescript
import { useQuery } from "@tanstack/react-query";

function UserProfile({ userId }: { userId: string; }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["users", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.name}</div>;
}
```

#### Mutation Example

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

function UpdateUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newUser: User) => {
      const res = await fetch(`/api/users/${newUser.id}`, {
        method: "PUT",
        body: JSON.stringify(newUser),
      });
      return res.json();
    },
    onSuccess: data => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ["users", data.id],
      });
    },
  });

  return (
    <button onClick={() => mutation.mutate({ id: 1, name: "New Name" })}>
      Update
    </button>
  );
}
```

#### Best Practices

- **Query Keys**: Use arrays for clear, nested structure:
  `['users', userId, 'posts']`
- **Stale Time**: Set appropriate `staleTime` to balance freshness and requests
- **GC Time**: Configure garbage collection to manage memory
- **Invalidation**: Invalidate related queries after mutations, not the entire
  cache
- **Error Boundaries**: Use error boundaries for better error handling

### Alternative: SWR

SWR is lighter and simpler than TanStack Query, suitable for simpler fetching
scenarios.

```typescript
import useSWR from "swr";

function Profile() {
  const { data, error, isLoading } = useSWR("/api/user", fetcher);

  if (error) return <div>Failed to load</div>;
  if (isLoading) return <div>Loading...</div>;

  return <div>Hello {data.name}!</div>;
}
```

---

## Client State Management

### When to Use Client State

Client state is for:

- UI state (modals, dropdowns, toggles)
- User preferences
- Local filters and sorting
- Theme selection
- Authenticated user info
- Temporary form data before submission

### React Built-in Solutions

For most applications, React's built-in hooks are sufficient:

```typescript
// Simple component state
const [count, setCount] = useState(0);

// Shared state with Context
const ThemeContext = createContext<string>("light");

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// Complex logic with useReducer
const reducer = (state, action) => {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    case "RESET":
      return { ...state, count: 0 };
    default:
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, initialState);
```

### Zustand

**Zustand** is the popular choice for when Context becomes cumbersome. It offers
simplicity with power.

#### Key Advantages

- **Minimal boilerplate**: No actions, reducers, or providers
- **Hook-based API**: Works like useState
- **Small bundle size**: ~3KB gzipped
- **No provider hell**: Access state directly
- **TypeScript first**: Excellent type inference
- **Middleware support**: Devtools, persistence, etc.

#### Installation

```bash
npm install zustand
```

#### Basic Example

```typescript
import { create } from "zustand";

interface CountStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useCountStore = create<CountStore>(set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 })),
}));

// Usage in components
function Counter() {
  const count = useCountStore(state => state.count);
  const increment = useCountStore(state => state.increment);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

#### Advanced: Sliced Stores

Organize complex stores into slices for better maintainability:

```typescript
const useAppStore = create<AppStore>(set => ({
  // User slice
  user: null,
  setUser: user => set({ user }),

  // UI slice
  sidebarOpen: true,
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

  // Theme slice
  theme: "light",
  setTheme: theme => set({ theme }),
}));
```

#### Middleware Examples

```typescript
// With persistence
const useStore = create<Store>(
  persist(
    set => ({
      count: 0,
      increment: () => set(state => ({ count: state.count + 1 })),
    }),
    {
      name: "app-store", // localStorage key
      storage: localStorage,
      partialize: state => ({ count: state.count }), // Optional: persist only specific fields
    },
  ),
);

// With devtools
const useStore = create<Store>(
  devtools(
    set => ({
      count: 0,
      increment: () => set(state => ({ count: state.count + 1 })),
    }),
    { name: "app-store" },
  ),
);
```

### Jotai

**Jotai** uses an atomic bottom-up approach, excellent for fine-grained
reactivity and code splitting.

#### Key Advantages

- **Atomic model**: Compose small pieces of state together
- **Fine-grained updates**: Only components using specific atoms re-render
- **Suspense support**: Built-in async atom handling
- **Code splitting friendly**: Atoms split naturally with code
- **No boilerplate**: Simple atom definitions

#### Installation

```bash
npm install jotai
```

#### Basic Example

```typescript
import { atom, useAtom } from "jotai";

// Define atoms
const countAtom = atom(0);
const doubledAtom = atom(get => get(countAtom) * 2);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const [doubled] = useAtom(doubledAtom);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

#### Complex Example with Async

```typescript
const userAtom = atom(
  async get => {
    const userId = get(userIdAtom);
    const res = await fetch(`/api/users/${userId}`);
    return res.json();
  },
);

function UserComponent() {
  const [user] = useAtom(userAtom);
  // Suspense will be triggered during loading
  return <div>{user.name}</div>;
}
```

### Comparison: Zustand vs Jotai

| Feature                | Zustand                 | Jotai                 |
| ---------------------- | ----------------------- | --------------------- |
| Model                  | Single store (top-down) | Atoms (bottom-up)     |
| Bundle Size            | ~3KB                    | ~2KB                  |
| Re-render Optimization | Manual selectors        | Automatic (atom deps) |
| Code Splitting         | Moderate                | Excellent             |
| Suspense               | Good                    | Built-in              |
| Learning Curve         | Very low                | Low                   |
| Best For               | Global app state        | Fine-grained state    |

### Redux Toolkit

**Redux Toolkit** is the modern way to use Redux. Recommended for large
enterprise applications with complex state logic.

#### When to Use Redux Toolkit

- Enterprise applications with 100+ components
- Complex state interactions and workflows
- Team requires strict state patterns
- Need time-travel debugging
- Complex async workflows (redux-thunk, redux-saga)

#### Basic Example

```typescript
import { configureStore, createSlice } from "@reduxjs/toolkit";

const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: state => {
      state.value += 1;
    },
    decrement: state => {
      state.value -= 1;
    },
  },
});

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

function Counter() {
  const dispatch = useDispatch();
  const count = useSelector(state => state.counter.value);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch(counterSlice.actions.increment())}>
        Increment
      </button>
    </div>
  );
}
```

---

## URL State Management

### Why URL State Matters

Shareable URLs, browser back button support, and bookmarkable state are features
users expect. URL state is ideal for:

- Search and filters
- Pagination
- Tab selection
- Sort order
- Date ranges

### nuqs: Type-Safe URL State

**nuqs** provides a `useState`-like API for URL search parameters with full type
safety.

#### Installation

```bash
npm install nuqs
```

#### Setup (Next.js App Router)

```typescript
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
```

#### Basic Usage

```typescript
"use client";

import { useQueryState } from "nuqs";

function SearchProducts() {
  const [search, setSearch] = useQueryState("q", {
    defaultValue: "",
    history: "replace", // or 'push'
  });

  const [page, setPage] = useQueryState("page", {
    defaultValue: "1",
    parse: parseInt,
    serialize: String,
  });

  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search..."
      />
      <p>Page: {page}</p>
      <button onClick={() => setPage(page + 1)}>Next</button>
    </div>
  );
}
```

#### Type-Safe Multiple Params

```typescript
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

function Filters() {
  const [state, setState] = useQueryStates({
    search: parseAsString.withDefault(""),
    category: parseAsString.withDefault("all"),
    page: parseAsInteger.withDefault(1),
    sort: parseAsString.withDefault("newest"),
  });

  return (
    <div>
      <input
        value={state.search}
        onChange={e => setState(prev => ({ ...prev, search: e.target.value }))}
      />
      {/* More filters */}
    </div>
  );
}
```

#### Custom Type Parsers

```typescript
import { createSearchParamsCache, parseAsArrayOf, parseAsString } from "nuqs";

// For complex types
const parseDate = parseAsString.pipe(val => new Date(val));

function DateFilter() {
  const [date, setDate] = useQueryState("date", {
    parse: parseDate,
    serialize: date => date.toISOString(),
  });

  return (
    <input
      type="date"
      onChange={e => setDate(new Date(e.target.value))}
    />
  );
}
```

#### Benefits

- **Type-safe**: Full TypeScript support with parser inference
- **Small**: 6KB gzipped
- **Framework agnostic**: Works with Next.js, Remix, TanStack Router, etc.
- **History control**: Push or replace history
- **Shallow updates**: Control when RSCs re-render
- **Familiar API**: Works like useState

---

## Form State & Validation

### React Hook Form + Zod

This combination is the modern standard for form handling in React, providing
excellent developer experience and type safety.

#### Installation

```bash
npm install react-hook-form zod @hookform/resolvers
```

#### Basic Form Example

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define validation schema
const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  age: z.number().min(18, "Must be 18+"),
  password: z.string().min(8, "Password must be 8+ characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UserFormData = z.infer<typeof userSchema>;

export function UserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const onSubmit = async (data: UserFormData) => {
    // Submit form data
    const response = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} placeholder="Name" />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register("email")} placeholder="Email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input
        {...register("age", { valueAsNumber: true })}
        type="number"
        placeholder="Age"
      />
      {errors.age && <span>{errors.age.message}</span>}

      <input {...register("password")} type="password" placeholder="Password" />
      {errors.password && <span>{errors.password.message}</span>}

      <input
        {...register("confirmPassword")}
        type="password"
        placeholder="Confirm Password"
      />
      {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

#### Advanced: Conditional Validation

```typescript
const eventSchema = z.object({
  eventType: z.enum(["online", "physical"]),
  location: z.string().optional(),
  url: z.string().url().optional(),
}).refine(
  data => {
    if (data.eventType === "physical" && !data.location) return false;
    if (data.eventType === "online" && !data.url) return false;
    return true;
  },
  {
    message: "Location required for physical events, URL for online",
    path: ["location"],
  },
);
```

#### Advanced: Dynamic Fields with useFieldArray

```typescript
import { useFieldArray } from "react-hook-form";

const teamSchema = z.object({
  members: z.array(
    z.object({
      name: z.string(),
      email: z.string().email(),
      role: z.string(),
    }),
  ),
});

function TeamForm() {
  const { control, register, handleSubmit } = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      members: [{ name: "", email: "", role: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  return (
    <form>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`members.${index}.name`)} placeholder="Name" />
          <input {...register(`members.${index}.email`)} placeholder="Email" />
          <input {...register(`members.${index}.role`)} placeholder="Role" />
          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ name: "", email: "", role: "" })}
      >
        Add Member
      </button>
    </form>
  );
}
```

#### Reusable Input Component

```typescript
import { forwardRef } from 'react'
import { FieldError } from 'react-hook-form'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: FieldError
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => (
    <div>
      {label && <label>{label}</label>}
      <input ref={ref} {...props} />
      {error && <span className="error">{error.message}</span>}
    </div>
  )
)

// Usage with form
<Input {...register('name')} label="Name" error={errors.name} />
```

#### Best Practices

1. **Reuse schemas**: Use the same schema for client and server validation
2. **Type inference**: Always use `z.infer<typeof schema>` for types
3. **Validation messages**: Provide clear, user-friendly error messages
4. **Async validation**: Use `refine` for server-side checks
5. **Composition**: Break complex schemas into smaller, reusable pieces

```typescript
// Reusable base schemas
const emailSchema = z.string().email("Invalid email");
const passwordSchema = z.string().min(8, "Password too short");
const nameSchema = z.string().min(1, "Name required");

// Compose into larger schemas
const userSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});
```

---

## Global vs Local State

### Decision Matrix

| Type                | State Type | Tool                                | Example                          |
| ------------------- | ---------- | ----------------------------------- | -------------------------------- |
| **Local Component** | Client     | useState                            | Modal open/close, hover state    |
| **Shared by Few**   | Client     | useState + prop drilling or Context | Theme in subtree                 |
| **Shared Widely**   | Client     | Zustand                             | Theme, auth user, UI preferences |
| **Fine-grained**    | Client     | Jotai                               | Complex derived state            |
| **Enterprise**      | Client     | Redux Toolkit                       | Large app state management       |
| **Server Data**     | Server     | TanStack Query                      | API responses, lists             |
| **URL-synced**      | Client     | nuqs                                | Filters, pagination, search      |
| **Forms**           | Client     | React Hook Form                     | User input, validation           |

### Pattern: Lifting State

```typescript
// ❌ Prop drilling
function Parent() {
  const [theme, setTheme] = useState("light");
  return <Child theme={theme} setTheme={setTheme} />;
}

// ✅ Context (small to medium apps)
const ThemeContext = createContext<ThemeContextType>(null);

function Parent() {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Child />
    </ThemeContext.Provider>
  );
}

// ✅ Zustand (larger apps)
const useThemeStore = create(set => ({
  theme: "light",
  setTheme: theme => set({ theme }),
}));

function Parent() {
  return <Child />; // Access directly with useThemeStore
}
```

---

## State Persistence

### LocalStorage Persistence

Persist state between page refreshes using localStorage.

#### With Zustand

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist(
    set => ({
      user: null,
      setUser: user => set({ user }),
    }),
    {
      name: "user-storage", // localStorage key
      storage: localStorage,
      partialize: state => ({ user: state.user }), // Persist only user
    },
  ),
);
```

#### With TanStack Query

```typescript
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});
```

#### With nuqs

URL state is already persistent (bookmarkable) via the URL itself.

```typescript
const [search, setSearch] = useQueryState("q", {
  defaultValue: "",
  history: "push", // URL changes are added to history
});
```

### IndexedDB for Large Data

For large datasets, use IndexedDB instead of localStorage (5-50MB limit).

```typescript
import Dexie, { type Table } from 'dexie'

interface Album {
  id?: number
  name: string
  photos: Photo[]
}

class MyDatabase extends Dexie {
  albums!: Table<Album>

  constructor() {
    super('myDatabase')
    this.version(1).stores({
      albums: '++id, name', // Indexes
    })
  }
}

const db = new MyDatabase()

// Store data
await db.albums.add({
  name: 'Vacation',
  photos: [...],
})

// Retrieve data
const albums = await db.albums.where('name').startsWith('Vac').toArray()
```

### Session Storage

For temporary data lasting only the current browser session:

```typescript
const useSessionStore = create(
  persist(
    set => ({
      tempData: null,
      setTempData: data => set({ tempData: data }),
    }),
    {
      name: "session-store",
      storage: sessionStorage, // Clears when tab closes
    },
  ),
);
```

### Best Practices for Persistence

1. **Choose the right storage**:
   - localStorage: Small data, simple key-value
   - IndexedDB: Large datasets, complex queries
   - sessionStorage: Temporary data

2. **Handle hydration correctly** (Important for Next.js):

```typescript
function App() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null; // Prevent hydration mismatch

  return <YourApp />;
}
```

3. **Encrypt sensitive data**:

```typescript
import crypto from "crypto";

const encryptData = (data: string, key: string) => {
  // Use proper encryption library like tweetnacl or libsodium
  // Never store raw passwords or tokens
};
```

4. **Set expiration times**:

```typescript
const useStore = create(
  persist(
    set => ({
      data: null,
      timestamp: null,
    }),
    {
      name: "app-store",
      partialize: state => state,
      merge: (persistedState, currentState) => {
        const now = Date.now();
        const age = now - (persistedState.timestamp || 0);
        const MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

        if (age > MAX_AGE) {
          return currentState; // Use fresh state
        }

        return persistedState;
      },
    },
  ),
);
```

---

## Decision Framework

### Choose Your Tool

**Start Here: How is your state being used?**

#### Pure Client-Side State

```
Is it local to one component?
├─ Yes → useState / useReducer
└─ No → Next question...

Is it used by 2-3 child components?
├─ Yes → useState + props or Context
└─ No → Next question...

Is it used across many parts of the app?
├─ Small app (< 20 components) → Context API
├─ Medium app → Zustand
├─ Large app (100+) → Redux Toolkit
└─ Fine-grained reactive → Jotai
```

#### Server-Side Data

```
Is it API data?
├─ Yes → TanStack Query (always)
└─ No → Client state (above)

Do you need caching?
├─ Yes → TanStack Query
├─ No → SWR (simpler) or TanStack Query anyway
```

#### URL-Synced State

```
Should it be shareable/bookmarkable?
├─ Yes → nuqs
└─ No → Client state (above)

Examples: filters, pagination, search, tabs
```

#### Form State

```
Is it a simple form?
├─ Yes → React Hook Form + Zod
└─ More complex forms → Still React Hook Form + Zod

Do you need:
├─ Validation → Zod + React Hook Form
├─ Dynamic fields → useFieldArray
├─ Async validation → Zod refine + React Hook Form
```

### Real-World Example: E-Commerce App

```typescript
// Server State: Products from API
const { data: products } = useQuery({
  queryKey: ["products"],
  queryFn: fetchProducts,
});

// URL State: Filters and pagination
const [search, setSearch] = useQueryState("q");
const [page, setPage] = useQueryState("page", { defaultValue: "1" });

// Client State: Sidebar toggle, theme
const useSidebarStore = create(set => ({
  open: true,
  toggle: () => set(state => ({ open: !state.open })),
}));

// Form State: Checkout form
const checkoutSchema = z.object({
  email: z.string().email(),
  address: z.string(),
  paymentMethod: z.enum(["card", "paypal"]),
});

function CheckoutForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(checkoutSchema),
  });
  // ...
}
```

---

## Common Patterns & Anti-Patterns

### Anti-Pattern: Over-centralizing State

```typescript
// ❌ BAD: Everything in global state
const useAppStore = create(set => ({
  // 50+ properties...
  hoveredItemId: null,
  userPreferences: {},
  apiData: {},
  formErrors: {},
  // ...
}));
```

### Pattern: Smart Composition

```typescript
// ✅ GOOD: Separate concerns
const useUIStore = create(set => ({
  sidebarOpen: true,
  theme: "light",
  // ...
}));

const useAuthStore = create(set => ({
  user: null,
  isAuthenticated: false,
  // ...
}));

// API data handled by TanStack Query
const { data: products } = useQuery({
  queryKey: ["products"],
  queryFn: fetchProducts,
});
```

### Anti-Pattern: Syncing State

```typescript
// ❌ BAD: Duplicating server state in client state
const [products, setProducts] = useState([]);

useEffect(() => {
  fetchProducts().then(setProducts); // Sync antipattern
}, []);
```

### Pattern: Single Source of Truth

```typescript
// ✅ GOOD: Let TanStack Query handle it
const { data: products } = useQuery({
  queryKey: ["products"],
  queryFn: fetchProducts,
  // Automatic caching and sync
});
```

---

## Performance Optimization

### Selector Functions (Zustand)

```typescript
// Without selectors: Causes re-render on ANY state change
const store = useThemeStore();

// With selectors: Only re-render on theme change
const theme = useThemeStore(state => state.theme);
```

### Query Optimization (TanStack Query)

```typescript
// Use specific query keys for fine-grained caching
useQuery({
  queryKey: ["users", userId, "posts", postId],
  queryFn: () => fetchUserPost(userId, postId),
});

// Avoid wildcard cache invalidation
// ❌ Bad: queryClient.invalidateQueries()
// ✅ Good: queryClient.invalidateQueries({
//   queryKey: ['users', userId],
// })
```

### Atom Dependencies (Jotai)

```typescript
// Atoms automatically track dependencies
const namesAtom = atom(get => {
  const users = get(usersAtom);
  return users.map(u => u.name); // Only re-computed when usersAtom changes
});
```

---

## Summary: Quick Reference

| Need                    | Tool                  | Bundle | Setup    |
| ----------------------- | --------------------- | ------ | -------- |
| Local state             | useState              | 0KB    | Built-in |
| Shared in subtree       | Context               | 0KB    | Built-in |
| Global client state     | Zustand               | 3KB    | Minimal  |
| Fine-grained reactivity | Jotai                 | 2KB    | Minimal  |
| Enterprise patterns     | Redux Toolkit         | 65KB   | Moderate |
| Server data             | TanStack Query        | 47KB   | Moderate |
| URL-synced state        | nuqs                  | 6KB    | Minimal  |
| Forms + validation      | React Hook Form + Zod | 10KB   | Minimal  |

---

## Resources & Further Reading

### Official Documentation

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Jotai Docs](https://jotai.org/)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Docs](https://zod.dev/)
- [nuqs Docs](https://nuqs.dev/)

### Articles & Guides

- [React State Management in 2025: What You Actually Need](https://www.developerway.com/posts/react-state-management-2025)
- [Modern React State Management: A Practical Guide](https://dev.to/joodi/modern-react-state-management-in-2025-a-practical-guide-2j8f)
- [State Management Beyond useState](https://medium.com/@karanssoni2002/state-management-beyond-usestate-context-api-vs-redux-vs-zustand-vs-jotai-ee6627b45d1b)

---

## Contributing & Updates

This document reflects best practices as of 2025. As React and its ecosystem
continue to evolve, these recommendations may change. Please refer to official
documentation for the latest versions and APIs.

Last updated: 2025-12-06
