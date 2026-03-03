// Vite build entry point: re-exports @emotion/react's JSX runtime as a stable
// chunk, allowing Emotion-aware JSX transforms to import a consistent module.
export * from "@emotion/react/jsx-runtime";
