import type { ReactNode } from "react";

interface ImageGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6 | 8;
}

const gridCols = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
  8: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8",
};

export function ImageGrid({ children, columns = 6 }: ImageGridProps) {
  return <div className={`grid gap-4 ${gridCols[columns]}`}>{children}</div>;
}
