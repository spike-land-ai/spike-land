async function main() {
  const JULES_BASE_URL = "https://jules.googleapis.com/v1alpha";
  const apiKey = process.env.JULES_API_KEY;
  if (!apiKey) throw new Error("JULES_API_KEY not found");

  const title = "Interaction via Antigravity Agent";
  const task =
    "Hello Jules! I am Antigravity. I was spawned by Zoltan to monitor you and verify I can spawn tasks for you directly via the production spike.land MCP. Please acknowledge receipt of this message by doing something small!";
  const source = `sources/github/spike-land-ai/spike.land`;

  console.log("Creating Jules session...");
  const response = await fetch(`${JULES_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: task,
      sourceContext: { source, githubRepoContext: { startingBranch: "main" } },
      title,
      requirePlanApproval: true,
      automationMode: "AUTO_CREATE_PR",
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    console.error("Error creating session:", json);
    process.exit(1);
  }

  console.log("Success! Session details:");
  console.log(`ID: ${json.name}`);
  console.log(`State: ${json.state}`);
  console.log(`URL: ${json.url}`);
}

main().catch(console.error);
