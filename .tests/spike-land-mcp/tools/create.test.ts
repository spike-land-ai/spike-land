import { describe, expect, it } from "vitest";
import {
  assessCreateSessionHealth,
  classifyIdeaLocally,
} from "../../../src/edge-api/spike-land/core-logic/tools/create";

describe("create tool local fallbacks", () => {
  it("classifies dashboard ideas without the legacy classifier API", () => {
    const result = classifyIdeaLocally(
      "Build me an analytics dashboard for sales metrics with reports and admin views",
    );

    expect(result.status).toBe("heuristic");
    expect(result.slug).toBe("analytics-dashboard-sales-metrics-reports");
    expect(result.category).toBe("dashboard");
    expect(result.template).toBe("dashboard");
    expect(result.reason).toContain("dashboard");
  });

  it("marks default scaffold sessions as unhealthy", () => {
    const result = assessCreateSessionHealth({
      code: `export default () => (
        <div>
          <h1>404 - for now.</h1>
          <h2>But you can edit even this page and share with your friends.</h2>
        </div>
      );`,
      html: "<div></div>",
      css: "",
      transpiled: "",
    });

    expect(result.healthy).toBe(false);
    expect(result.score).toBe(0);
  });

  it("marks edited sessions with rendered output as healthy", () => {
    const result = assessCreateSessionHealth({
      code: `
        export default function App() {
          return (
            <main className="dashboard">
              <h1>Revenue Overview</h1>
              <p>Active subscriptions and churn.</p>
            </main>
          );
        }
      `,
      html: "<main class=\"dashboard\"><h1>Revenue Overview</h1><p>Active subscriptions and churn.</p></main>",
      css: ".dashboard{display:grid;gap:16px;padding:24px}",
      transpiled: 'const App = () => React.createElement("main", null, "Revenue Overview"); export default App;',
    });

    expect(result.healthy).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.reason).toContain("non-default source");
  });
});
