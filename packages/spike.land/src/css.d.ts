// Type declaration for CSS file imports.
// Allows `import "./globals.css"` and similar CSS imports in TypeScript files
// without triggering "Cannot find module" errors.
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
