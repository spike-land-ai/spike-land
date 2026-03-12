const fs = require('fs');
const path = 'src/edge-api/main/api/index.ts';
let code = fs.readFileSync(path, 'utf8');

function replaceBlock(startStr, endStr, replaceFunc) {
    const startIndex = code.indexOf(startStr);
    if (startIndex === -1) {
        console.log("NOT FOUND: " + startStr);
        return;
    }
    const endIndex = code.indexOf(endStr, startIndex + startStr.length);
    if (endIndex === -1) {
        console.log("NOT FOUND END: " + endStr);
        return;
    }
    const block = code.substring(startIndex, endIndex + endStr.length);
    const newBlock = replaceFunc(block);
    code = code.substring(0, startIndex) + newBlock + code.substring(endIndex + endStr.length);
}

replaceBlock(
    'app.get("/api/store/tools", async (c) => {',
    '  return c.json({ categories, featured, total: tools.length });\n});',
    (block) => {
        return `export const getApiStoreToolsHandler = async (c: import("hono").Context<{ Bindings: Env; Variables: Variables }>) => {` + 
               block.substring('app.get("/api/store/tools", async (c) => {'.length, block.length - 3) + 
               `};\napp.get("/api/store/tools", getApiStoreToolsHandler);`;
    }
);

code = code.replace(
    'async function mcpProxy(c: import("hono").Context<{ Bindings: Env; Variables: Variables }>) {',
    'export async function mcpProxy(c: import("hono").Context<{ Bindings: Env; Variables: Variables }>) {'
);

replaceBlock(
    'app.get("/.well-known/oauth-authorization-server", (c) => {',
    '  });\n});',
    (block) => {
        return `export const oauthAuthorizationServerHandler = (c: import("hono").Context<{ Bindings: Env; Variables: Variables }>) => {` + 
               block.substring('app.get("/.well-known/oauth-authorization-server", (c) => {'.length, block.length - 3) + 
               `};\napp.get("/.well-known/oauth-authorization-server", oauthAuthorizationServerHandler);`;
    }
);

replaceBlock(
    'app.get("/.well-known/oauth-protected-resource/mcp", (c) => {',
    '  });\n});',
    (block) => {
        return `export const oauthProtectedResourceMcpHandler = (c: import("hono").Context<{ Bindings: Env; Variables: Variables }>) => {` + 
               block.substring('app.get("/.well-known/oauth-protected-resource/mcp", (c) => {'.length, block.length - 3) + 
               `};\napp.get("/.well-known/oauth-protected-resource/mcp", oauthProtectedResourceMcpHandler);`;
    }
);

replaceBlock(
    'app.post("/oauth/device/approve", authMiddleware, async (c) => {',
    '  });\n});',
    (block) => {
        return `export const oauthDeviceApproveHandler = async (c: import("hono").Context<{ Bindings: Env; Variables: Variables }>) => {` + 
               block.substring('app.post("/oauth/device/approve", authMiddleware, async (c) => {'.length, block.length - 3) + 
               `};\napp.post("/oauth/device/approve", authMiddleware, oauthDeviceApproveHandler);`;
    }
);

replaceBlock(
    'app.get("/mcp", async (c, next) => {',
    '  return next();\n});',
    (block) => {
        return `export const mcpGetHandler = async (c: import("hono").Context<{ Bindings: Env; Variables: Variables }>, next: import("hono").Next) => {` + 
               block.substring('app.get("/mcp", async (c, next) => {'.length, block.length - 3) + 
               `};\napp.get("/mcp", mcpGetHandler);`;
    }
);

replaceBlock(
    'app.all("/api/auth/*", async (c) => {',
    '  });\n});',
    (block) => {
        return `export const apiAuthAllHandler = async (c: import("hono").Context<{ Bindings: Env; Variables: Variables }>) => {` + 
               block.substring('app.all("/api/auth/*", async (c) => {'.length, block.length - 3) + 
               `};\napp.all("/api/auth/*", apiAuthAllHandler);`;
    }
);

replaceBlock(
    'app.all("/api/*", (c) => {',
    '  return c.json({ error: "Not Found", path: c.req.path }, 404);\n});',
    (block) => {
        return `export const apiCatchAllHandler = (c: import("hono").Context<{ Bindings: Env; Variables: Variables }>) => {` + 
               block.substring('app.all("/api/*", (c) => {'.length, block.length - 3) + 
               `};\napp.all("/api/*", apiCatchAllHandler);`;
    }
);

fs.writeFileSync(path, code);
