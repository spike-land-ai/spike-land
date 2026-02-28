# Testing Strategies Best Practices

Comprehensive guide to testing strategies for modern web applications, with
practical examples tailored to Next.js, Vitest, React Testing Library,
Playwright, and Cucumber.

---

## Table of Contents

1. [Testing Pyramid](#testing-pyramid)
2. [Unit Testing with Vitest & React Testing Library](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [E2E Testing with Playwright & Cucumber](#e2e-testing)
5. [API Mocking Strategies](#api-mocking)
6. [Code Coverage](#code-coverage)
7. [CI/CD Integration & Parallelization](#cicd-integration)
8. [Best Practices Summary](#best-practices-summary)

---

## Testing Pyramid

The testing pyramid is a framework that emphasizes the proper balance of
different test types. The structure consists of three layers, each serving a
specific purpose in the testing strategy.

### Pyramid Structure

```
       /\
      /  \
     / E2E \       (10% - Critical User Flows)
    /------\
   /        \
  /Integration\ (20% - Component Interactions)
 /            \
/   Unit Tests\  (70% - Individual Functions/Components)
/______________\
```

### Recommended Test Distribution

- **Unit Tests (70%)**: Fast, isolated tests of individual functions and
  components
- **Integration Tests (20%)**: Tests verifying interactions between multiple
  components or services
- **E2E Tests (10%)**: Critical user journeys and high-risk workflows only

### Why This Structure?

1. **Speed**: Unit tests are fastest, providing quick feedback during
   development
2. **Cost**: E2E tests are expensive to maintain and slow to run; use them
   sparingly
3. **Maintainability**: Fewer E2E tests reduce maintenance burden
4. **Confidence**: Combined coverage provides complete system validation

### Anti-Pattern: The "Ice Cream Cone"

Avoid inverting the pyramid by having many slow E2E tests with few unit tests.
This leads to:

- Slow feedback loops
- High maintenance costs
- Fragile test suites
- Difficult debugging

### Contextual Adaptations

Adjust the pyramid based on your application:

- **Microservices**: More integration tests to validate service communication
- **UI-Heavy Applications**: More E2E tests for complex user interactions
- **Critical Systems**: More comprehensive testing at all levels
- **Monoliths**: More unit tests to catch regressions early

---

## Unit Testing with Vitest & React Testing Library

Unit tests are the foundation of your testing strategy. They validate individual
functions, hooks, and components in isolation.

### Setup & Configuration

#### Install Dependencies

```bash
yarn add --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

#### Configure Vitest

Create `vitest.config.ts`:

```typescript
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "node_modules/",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
      ],
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

#### Setup File

Create `vitest.setup.ts`:

```typescript
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, expect, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Best Practices

#### 1. Use `screen` for Queries

Instead of destructuring from render, always use `screen` to access DOM
elements:

```typescript
// ❌ Bad
import { render } from "@testing-library/react";

const { getByRole } = render(<Button>Click me</Button>);
const button = getByRole("button");

// ✅ Good
import { render, screen } from "@testing-library/react";

render(<Button>Click me</Button>);
const button = screen.getByRole("button", { name: /click me/i });
```

**Why?** Eliminates the need to maintain references and encourages querying the
actual DOM, not implementation details.

#### 2. Prefer Role-Based Queries Over Test IDs

Query by accessibility roles and labels, not test IDs:

```typescript
// ❌ Bad
screen.getByTestId("login-button");
screen.getByTestId("email-input");

// ✅ Good
screen.getByRole("button", { name: /login/i });
screen.getByRole("textbox", { name: /email/i });
```

**Why?** Ensures components are accessible and tests real user interactions.

Query priority order:

1. `getByRole` (button, textbox, checkbox, etc.)
2. `getByLabelText` (form inputs with labels)
3. `getByPlaceholderText` (inputs with placeholder)
4. `getByText` (headings, paragraphs)
5. `getByTestId` (last resort for untestable elements)

#### 3. Use `userEvent` Over `fireEvent`

Use `@testing-library/user-event` to simulate realistic user interactions:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("types in input field", async () => {
  const user = userEvent.setup();
  render(<input />);

  const input = screen.getByRole("textbox");

  // ❌ Bad: fireEvent bypasses browser behavior
  // fireEvent.change(input, { target: { value: 'test' } })

  // ✅ Good: userEvent simulates actual typing
  await user.type(input, "hello world");

  expect(input).toHaveValue("hello world");
});
```

**Why?** `userEvent` fires realistic events (keyDown, keyPress, keyUp) matching
actual user behavior.

#### 4. Handle Asynchronous Operations

Use `findBy` queries or `waitFor` for async operations:

```typescript
import { render, screen, waitFor } from "@testing-library/react";

test("fetches and displays data", async () => {
  render(<UserProfile userId="123" />);

  // ✅ findBy automatically waits
  const userName = await screen.findByText("John Doe");
  expect(userName).toBeInTheDocument();
});

test("updates after button click", async () => {
  const user = userEvent.setup();
  render(<DataComponent />);

  const button = screen.getByRole("button", { name: /load/i });
  await user.click(button);

  // ✅ waitFor for custom assertions
  await waitFor(() => {
    expect(screen.getByText(/loaded/i)).toBeInTheDocument();
  });
});
```

#### 5. Test User Interactions, Not Implementation

Test what users see and do, not internal state:

```typescript
// Component
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// ❌ Bad: Testing implementation details
test("increments count state", () => {
  const { rerender } = render(<Counter />);
  const setCountMock = jest.fn();
  // Can't actually test this without setState access
});

// ✅ Good: Testing user interactions
test("increments count when button is clicked", async () => {
  const user = userEvent.setup();
  render(<Counter />);

  expect(screen.getByText("Count: 0")).toBeInTheDocument();

  const button = screen.getByRole("button", { name: /increment/i });
  await user.click(button);

  expect(screen.getByText("Count: 1")).toBeInTheDocument();
});
```

### Example Test Structures

#### Testing a Component

```typescript
import { Button } from "@/components/ui/button";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

describe("Button Component", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it("renders with text content", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i }))
      .toBeInTheDocument();
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("disables when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders different variants", () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toHaveClass("outline");
  });
});
```

#### Testing a Custom Hook

```typescript
import { useCounter } from "@/hooks/useCounter";
import { act, renderHook } from "@testing-library/react";

describe("useCounter Hook", () => {
  it("initializes with default value", () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it("increments count", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it("decrements count", () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it("resets count", () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(0);
  });
});
```

#### Testing Complex User Flows

```typescript
import { LoginForm } from "@/components/auth/LoginForm";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("LoginForm Component", () => {
  it("submits form with valid credentials", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    // Fill in the form
    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "user@example.com",
    );

    await user.type(
      screen.getByLabelText(/password/i),
      "SecurePassword123",
    );

    // Submit the form
    await user.click(screen.getByRole("button", { name: /login/i }));

    // Verify submission
    expect(handleSubmit).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "SecurePassword123",
    });
  });

  it("displays validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "invalid-email",
    );

    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
  });
});
```

### File Organization

Organize test files alongside source files:

```
src/
├── components/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   ├── Card.tsx
│   └── Card.test.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useAuth.test.ts
│   ├── useCounter.ts
│   └── useCounter.test.ts
├── lib/
│   ├── utils.ts
│   └── utils.test.ts
└── pages/
    ├── dashboard.tsx
    └── dashboard.test.tsx
```

---

## Integration Testing

Integration tests verify that multiple components, hooks, and services work
together correctly.

### What to Test

- Component interactions
- External API calls (with mocks)
- Database operations
- State management flows
- Router navigation

### Example: Testing Component Integration

```typescript
import { UserProfile } from "@/components/UserProfile";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

describe("UserProfile Integration", () => {
  it("fetches and displays user data", async () => {
    const mockUser = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
    };

    // Mock the fetch call
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockUser,
      } as Response)
    );

    render(<UserProfile userId="1" />);

    // Wait for data to load
    const userName = await screen.findByText("John Doe");
    expect(userName).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith("/api/users/1");
  });

  it("handles API errors gracefully", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      } as Response)
    );

    render(<UserProfile userId="1" />);

    const errorMessage = await screen.findByText(/failed to load user/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
```

---

## API Mocking Strategies

Mock external APIs to ensure tests are fast, reliable, and don't depend on
external services.

### Strategy 1: Mock Service Worker (MSW) - Recommended

MSW intercepts HTTP requests at the network level, providing mock responses that
work across all environments (tests, Storybook, dev servers).

#### Setup MSW

```bash
yarn add --save-dev msw
```

#### Create Mock Handlers

Create `src/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from "msw";

export const handlers = [
  // GET request
  http.get("/api/users/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: "John Doe",
      email: "john@example.com",
    });
  }),

  // POST request
  http.post("/api/auth/login", async ({ request }) => {
    const body = await request.json();

    if (body.email === "user@example.com" && body.password === "password") {
      return HttpResponse.json(
        { token: "mock-token" },
        { status: 200 },
      );
    }

    return HttpResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }),

  // Error response
  http.get("/api/error", () => {
    return HttpResponse.json(
      { error: "Server error" },
      { status: 500 },
    );
  }),
];
```

#### Setup MSW in Tests

Create `src/mocks/server.ts`:

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

Update `vitest.setup.ts`:

```typescript
import { server } from "@/mocks/server";
import { afterAll, afterEach, beforeAll } from "vitest";

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

#### Use in Tests

```typescript
import { LoginForm } from "@/components/auth/LoginForm";
import { server } from "@/mocks/server";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

describe("Login with MSW", () => {
  it("logs in successfully", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "user@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/logged in/i)).toBeInTheDocument();
    });
  });

  it("handles login failure", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "user@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("overrides handler for specific test", async () => {
    const user = userEvent.setup();

    // Override default handler for this test only
    server.use(
      http.post("/api/auth/login", () => {
        return HttpResponse.json(
          { error: "Server maintenance" },
          { status: 503 },
        );
      }),
    );

    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "user@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/server maintenance/i)).toBeInTheDocument();
    });
  });
});
```

### Strategy 2: Manual Fetch Mocking

For simple cases, mock fetch directly:

```typescript
import { vi } from "vitest";

describe("Fetch Mocking", () => {
  it("mocks fetch requests", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ id: 1, name: "John" }),
      } as Response)
    );

    const response = await fetch("/api/user");
    const data = await response.json();

    expect(data.name).toBe("John");
  });

  it("mocks failed requests", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

    expect(fetch("/api/user")).rejects.toThrow("Network error");
  });
});
```

### Best Practices for API Mocking

1. **Use MSW for complex scenarios** - Supports all HTTP methods and
   cross-environment use
2. **Keep handlers organized** - Group related endpoints in handler files
3. **Test error cases** - Always mock error responses (4xx, 5xx)
4. **Override handlers per test** - Use `server.use()` for test-specific mock
   behavior
5. **Don't mock everything** - Use real API for E2E tests when appropriate

---

## E2E Testing with Playwright & Cucumber

E2E tests validate complete user workflows in a real browser environment. Use
BDD with Cucumber for human-readable test specifications.

### Setup Playwright & Cucumber

#### Install Dependencies

```bash
yarn add --save-dev @playwright/test @cucumber/cucumber cucumber-html-reporter
```

#### Configure Cucumber

Create `cucumber.js` in project root:

```javascript
module.exports = {
  default: {
    require: [
      "e2e/step-definitions/**/*.steps.ts",
      "e2e/support/**/*.ts",
    ],
    requireModule: ["ts-node/register"],
    format: [
      "progress-bar",
      "html:e2e/reports/cucumber-report.html",
    ],
    parallel: 2,
    dryRun: false,
    failFast: false,
    strict: true,
    tags: "not @skip",
  },
};
```

### Writing Feature Files

Create human-readable test specifications in `e2e/features/`:

#### Example: Authentication Flow

Create `e2e/features/auth.feature`:

```gherkin
Feature: User Authentication
  As a visitor
  I want to authenticate with the platform
  So that I can access my apps

  Background:
    Given I am on the login page

  Scenario: Login with valid credentials
    When I enter email "user@example.com"
    And I enter password "SecurePassword123"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see "Welcome back" message

  Scenario: Login with invalid credentials
    When I enter email "user@example.com"
    And I enter password "WrongPassword"
    And I click the login button
    Then I should see an error message "Invalid credentials"
    And I should remain on the login page

  Scenario: Login with empty fields
    When I click the login button
    Then I should see validation errors
    And the login button should be disabled

  @skip
  Scenario: Login with unverified email
    Given I have an account with unverified email
    When I enter email "unverified@example.com"
    And I enter password "SecurePassword123"
    And I click the login button
    Then I should see "Please verify your email" message
```

#### Example: App Creation Flow

Create `e2e/features/apps.feature`:

```gherkin
Feature: App Management
  As an authenticated user
  I want to create and manage apps
  So that I can build applications on the platform

  Scenario: Create a new app
    Given I am logged in as "user@example.com"
    And I am on the "My Apps" page
    When I click the "Create New App" button
    And I enter app name "Image Enhancer"
    And I enter description "Enhance images with AI"
    And I click the "Create" button
    Then I should see the new app in my apps list
    And I should be redirected to the app details page

  Scenario: View app requirements
    Given I have an app named "Image Enhancer"
    When I click on the app
    And I navigate to the "Requirements" tab
    Then I should see the requirements form
    And I should see existing requirements listed

  Scenario: Fork an existing app
    Given I am on the apps marketplace
    When I click the "Fork" button on an app
    Then I should be prompted to confirm
    And a copy of the app should be created in my apps
```

### Step Definitions

Implement steps in `e2e/step-definitions/`:

#### Authentication Steps

Create `e2e/step-definitions/auth.steps.ts`:

```typescript
import { After, Before, Given, Then, When } from "@cucumber/cucumber";
import { expect, Page } from "@playwright/test";
import { createTestContext, TestContext } from "../support/context";

let context: TestContext;

Before(async function() {
  context = await createTestContext();
});

After(async function() {
  await context.close();
});

Given("I am on the login page", async () => {
  await context.page.goto("http://localhost:3000/login");
});

When("I enter email {string}", async (email: string) => {
  await context.page.fill(
    "input[type=\"email\"]",
    email,
  );
});

When("I enter password {string}", async (password: string) => {
  await context.page.fill(
    "input[type=\"password\"]",
    password,
  );
});

When("I click the login button", async () => {
  await context.page.click("button[type=\"submit\"]");
});

Then("I should be redirected to the dashboard", async () => {
  await context.page.waitForURL("http://localhost:3000/dashboard");
  expect(context.page.url()).toContain("/dashboard");
});

Then("I should see {string} message", async (message: string) => {
  const messageElement = context.page.locator(
    `text=${message}`,
  );
  await expect(messageElement).toBeVisible();
});

Then("I should see an error message {string}", async (error: string) => {
  const errorElement = context.page.locator(
    `[role="alert"], .error, .text-red-500`,
  );
  await expect(errorElement).toContainText(error);
});

Then("I should remain on the login page", async () => {
  expect(context.page.url()).toContain("/login");
});

Then("I should see validation errors", async () => {
  const errors = context.page.locator("[data-testid=\"error\"]");
  expect(await errors.count()).toBeGreaterThan(0);
});

Then("the login button should be disabled", async () => {
  const button = context.page.locator("button[type=\"submit\"]");
  await expect(button).toBeDisabled();
});
```

#### App Management Steps

Create `e2e/step-definitions/apps.steps.ts`:

```typescript
import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { context as testContext } from "../support/context";

Given("I am logged in as {string}", async (email: string) => {
  const { page } = testContext;

  // Navigate to login
  await page.goto("http://localhost:3000/login");

  // Enter credentials
  await page.fill("input[type=\"email\"]", email);
  await page.fill("input[type=\"password\"]", "TestPassword123");

  // Submit and wait for navigation
  await page.click("button[type=\"submit\"]");
  await page.waitForURL("**/dashboard");
});

Given("I am on the {string} page", async (pageName: string) => {
  const { page } = testContext;
  const routes: { [key: string]: string; } = {
    "My Apps": "/my-apps",
    "Marketplace": "/marketplace",
    "Settings": "/settings",
  };

  await page.goto(`http://localhost:3000${routes[pageName]}`);
});

When("I click the {string} button", async (buttonName: string) => {
  const { page } = testContext;
  await page.click(`button:has-text("${buttonName}")`);
});

When("I enter app name {string}", async (name: string) => {
  const { page } = testContext;
  await page.fill("input[placeholder*=\"App name\"]", name);
});

When("I enter description {string}", async (description: string) => {
  const { page } = testContext;
  await page.fill("textarea[placeholder*=\"description\"]", description);
});

Then("I should see the new app in my apps list", async () => {
  const { page } = testContext;
  const appCard = page.locator("[data-testid=\"app-card\"]").first();
  await expect(appCard).toBeVisible();
});

Then("I should be redirected to the app details page", async () => {
  const { page } = testContext;
  await page.waitForURL("**/apps/**");
  expect(page.url()).toMatch(/\/apps\/[a-z0-9]+/);
});
```

### Test Context & Utilities

Create `e2e/support/context.ts`:

```typescript
import { Browser, BrowserContext, chromium, Page } from "@playwright/test";

export interface TestContext {
  browser?: Browser;
  browserContext?: BrowserContext;
  page: Page;
  close: () => Promise<void>;
}

let globalContext: TestContext;

export async function createTestContext(): Promise<TestContext> {
  const browser = await chromium.launch({
    headless: process.env.HEADED !== "true",
  });

  const browserContext = await browser.newContext({
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
  });

  const page = await browserContext.newPage();

  return {
    browser,
    browserContext,
    page,
    close: async () => {
      await browserContext.close();
      await browser.close();
    },
  };
}

export function getContext(): TestContext {
  return globalContext;
}

export function setContext(ctx: TestContext): void {
  globalContext = ctx;
}
```

### Running E2E Tests

```bash
# Run all E2E tests
yarn test:e2e:local

# Run specific feature
yarn test:e2e:local --require-module ts-node/register -- e2e/features/auth.feature

# Run with specific tags
yarn test:e2e:local --tags "@auth"

# Run in headed mode (see browser)
HEADED=true yarn test:e2e:local

# Generate HTML report
yarn test:e2e:local
open e2e/reports/cucumber-report.html
```

### Best Practices for E2E Tests

1. **Test critical user workflows only** - Don't test every possible scenario
2. **Use BDD/Gherkin** - Write readable feature files that stakeholders
   understand
3. **Keep tests isolated** - Each test should be independent and work in any
   order
4. **Wait for elements properly** - Use Playwright's auto-waiting and explicit
   waits
5. **Capture screenshots on failure** - Aids debugging
6. **Use tags to organize** - @auth, @payment, @smoke for selective running
7. **Test against real browser** - Use actual Chromium/Firefox, not jsdom

---

## Code Coverage

Code coverage measures how much of your codebase is tested. Use it as a quality
metric, not a goal.

### Coverage Goals

| Test Type         | Coverage Goal |
| ----------------- | ------------- |
| Unit Tests        | 100% (strict) |
| Integration Tests | 80-90%        |
| System Tests      | 70-80%        |
| Overall           | 80%+          |

**Important**: Coverage is a metric, not a goal. 100% coverage doesn't guarantee
quality. Focus on:

- Testing important logic paths
- Covering error cases
- Validating critical features
- Testing edge cases

### Coverage Metrics

Different metrics track different aspects:

1. **Line Coverage**: Percentage of lines executed
2. **Branch Coverage**: Percentage of conditional paths tested (if/else,
   switches)
3. **Function Coverage**: Percentage of functions called
4. **Statement Coverage**: Percentage of statements executed

### Configure Coverage in Vitest

Already configured in `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  all: true,
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'node_modules/',
    'src/**/*.test.{ts,tsx}',
    'src/**/*.d.ts',
  ],
  lines: 100,
  functions: 100,
  branches: 100,
  statements: 100,
},
```

### Generate Coverage Reports

```bash
# Run tests with coverage
yarn test:coverage

# View detailed HTML report
open coverage/index.html
```

### Enforcing Coverage in CI

The project enforces 100% coverage in CI. Any PR that drops coverage will fail.

```bash
# Fail if coverage drops below threshold
yarn test:coverage

# Check specific file
yarn test:coverage -- src/components/Button.tsx
```

### What NOT to Test

Don't waste time testing:

- External library code (already tested by maintainers)
- Simple getters/setters
- Configuration files
- Generated code

Example exclusions in `vitest.config.ts`:

```typescript
exclude: [
  'node_modules/',
  'src/**/*.test.{ts,tsx}',
  'src/**/*.d.ts',
  'src/mocks/**',        // Mock handlers
  'src/types/**',        // Type definitions only
  'src/constants/**',    // Configuration
],
```

### Coverage Best Practices

1. **Focus on important code** - Test business logic, not infrastructure
2. **Test error cases** - Branches matter more than line count
3. **Use meaningful tests** - One good test beats ten meaningless ones
4. **Refactor untestable code** - High coverage indicates good design
5. **Combined metrics** - Use statement + branch coverage together

---

## CI/CD Integration & Parallelization

Run tests efficiently in CI by parallelizing execution across multiple jobs.

### GitHub Actions Setup

Configure `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
      fail-fast: false
    steps:
      - uses: actions/checkout@v6

      - uses: actions/setup-node@v6
        with:
          node-version: "20"
          cache: "yarn"

      - run: yarn

      - run: yarn test:coverage --shard=${{ matrix.shard }}/4

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true

  e2e-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2]
      fail-fast: false
    steps:
      - uses: actions/checkout@v6

      - uses: actions/setup-node@v6
        with:
          node-version: "20"
          cache: "yarn"

      - run: yarn

      - run: yarn build

      - uses: actions/setup-node@v6
        with:
          node-version: "20"

      - run: yarn test:e2e:ci --shard=${{ matrix.shard }}/2

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report-${{ matrix.shard }}
          path: playwright-report/
          retention-days: 30
```

### Test Sharding in Vitest

Vitest 1.0+ supports native sharding:

```bash
# Run shard 1 of 4
yarn test --shard=1/4

# Run shard 2 of 4
yarn test --shard=2/4
```

Vitest automatically distributes tests across shards for balanced execution.

### Test Sharding in Playwright

```bash
# Run shard 1 of 2
yarn playwright test --shard=1/2

# Run shard 2 of 2
yarn playwright test --shard=2/2
```

### Parallel Test Benefits

| Approach               | Time     | Cost   |
| ---------------------- | -------- | ------ |
| Single job (4 workers) | 6 min    | Low    |
| 4 jobs (1 shard each)  | ~2 min   | Medium |
| 8 jobs (1 shard each)  | ~1.5 min | High   |

### Monitoring CI Status

Check PR status with GitHub CLI:

```bash
# View PR checks
gh pr checks <PR-NUMBER>

# Wait for checks to complete
gh pr view <PR-NUMBER> --json statusCheckRollup

# View detailed logs
gh run view <RUN-ID> --log-failed
```

### CI Best Practices

1. **Shard tests strategically** - Balance speed vs. cost
2. **Fail fast for unit tests** - Stop early on coverage failures
3. **Continue E2E on unit failure** - Some overlaps are okay
4. **Cache dependencies** - Speed up `yarn`
5. **Upload coverage reports** - Track trends over time
6. **Keep CI logs clean** - Use appropriate log levels
7. **Monitor performance** - Track execution time trends

---

## Best Practices Summary

### Testing Pyramid

```
70% Unit Tests (Fast, Isolated)
↓
20% Integration Tests (Component Interactions)
↓
10% E2E Tests (Critical Workflows)
```

### Unit Testing Checklist

- [ ] Use `screen` queries instead of destructuring
- [ ] Prefer role-based queries (`getByRole`)
- [ ] Use `userEvent` for interactions
- [ ] Test user behavior, not implementation
- [ ] Handle async properly (`findBy`, `waitFor`)
- [ ] Achieve 100% code coverage
- [ ] Keep tests co-located with source

### Integration Testing Checklist

- [ ] Test component interactions
- [ ] Mock external APIs/services
- [ ] Verify state flows
- [ ] Test error scenarios
- [ ] Use MSW for consistent mocking

### E2E Testing Checklist

- [ ] Test critical user workflows only
- [ ] Write tests in Gherkin/BDD
- [ ] Use meaningful step definitions
- [ ] Test against real browsers
- [ ] Capture screenshots on failure
- [ ] Organize tests with tags
- [ ] Keep tests independent

### Coverage Checklist

- [ ] Aim for 80% overall coverage
- [ ] Enforce 100% for unit tests
- [ ] Focus on important code paths
- [ ] Test error cases and edge cases
- [ ] Monitor coverage trends over time
- [ ] Don't chase coverage numbers

### CI/CD Checklist

- [ ] Shard tests for parallel execution
- [ ] Cache dependencies
- [ ] Fail fast on critical checks
- [ ] Upload coverage reports
- [ ] Monitor execution time
- [ ] Keep logs clean
- [ ] Test against production-like environments

### Anti-Patterns to Avoid

❌ **The Ice Cream Cone** - Too many E2E tests, few unit tests ❌ **Test
Implementation Details** - Test behavior, not internal state ❌ **Flaky E2E
Tests** - Use explicit waits, avoid sleeps ❌ **No Mocking** - Mock external
services in unit/integration tests ❌ **100% Coverage Obsession** - Focus on
quality, not quantity ❌ **Skipped Tests** - Remove or fix, don't leave `@skip`

---

## References & Further Reading

### Testing Theory

- [The Practical Test Pyramid - Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Testing Pyramid Guide - BrowserStack](https://www.browserstack.com/guide/testing-pyramid-for-test-automation)
- [Code Coverage Best Practices - Google Testing Blog](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html)

### Tools & Frameworks

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Docs](https://testing-library.com/react)
- [Mock Service Worker](https://mswjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Cucumber.js Guide](https://cucumber.io/docs/cucumber/)

### React & Next.js Testing

- [React Testing with Vitest - Maya Shavin](https://mayashavin.com/articles/test-react-components-with-vitest)
- [Next.js Testing Guide](https://nextjs.org/docs/app/guides/testing/vitest)
- [Comprehensive React Testing Guide - Trevor Lasn](https://www.trevorlasn.com/blog/react-testing-mock-service-worker)

### CI/CD & Automation

- [Playwright Test Sharding](https://playwright.dev/docs/test-sharding)
- [GitHub Actions Test Parallelization](https://docs.github.com/en/actions)
- [Optimizing Tests in CI/CD - Medium](https://medium.com/@sharma.atulkumar29/enhancing-playwright-test-efficiency-parallel-runs-with-docker-sharding-on-github-actions-2ce87ac97ef7)

---

**Last Updated**: December 2025

**Document Version**: 1.0

For questions or suggestions, please refer to the project's contributing
guidelines.
