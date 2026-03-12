interface Env {
  VSCODE_REF: string;
  PRERELEASE_VERSION: string;
}

export function getNightlyEnv(): Env {
  const { PRERELEASE_VERSION, VSCODE_REF } = process.env;
  if (!PRERELEASE_VERSION) {
    throw new Error(`Missing PRERELEASE_VERSION in process.env`);
  }
  if (!VSCODE_REF) {
    throw new Error(`Missing VSCODE_REF in process.env`);
  }
  return { PRERELEASE_VERSION, VSCODE_REF };
}
