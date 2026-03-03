let _verbose = false;

export function setVerbose(v: boolean): void {
  _verbose = v;
}

export function isVerbose(): boolean {
  return _verbose || process.env.BAZDMEG_VERBOSE === "1";
}
