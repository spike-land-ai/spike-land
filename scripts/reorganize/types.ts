export interface FileNode {
  absPath: string;
  relPath: string; // relative to src/
  packageName: string;
  externalDeps: Set<string>;
  relativeImports: Set<string>; // abs paths
  resolvedDeps?: Set<string>; // inherited
}

export interface MovePlan {
  fileNode: FileNode;
  targetDir: string;
  targetFileName: string;
  targetRelPath: string; // new path relative to src/
}

export interface ManifestPkg {
  kind?: string;
}
