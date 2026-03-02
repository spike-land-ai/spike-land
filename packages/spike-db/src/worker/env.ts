/** Worker environment bindings for spike-db. */
export interface Env {
  SPIKE_DATABASE: DurableObjectNamespace;
  IDENTITY_SECRET: string;
}
