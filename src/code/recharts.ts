// Vite build entry point: re-exports recharts as a stable, lazily-loaded chunk
// to keep it out of the main bundle (recharts is large).
export * from "recharts";
