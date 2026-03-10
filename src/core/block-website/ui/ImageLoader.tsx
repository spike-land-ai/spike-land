import { useEffect, useState } from "react";
import { cn } from "@spike-land-ai/shared";
import { buildPromptDrivenBlogImageSrc } from "../core-logic/blog-image-policy";

interface ImageLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  prompt?: string | null;
  wrapperClassName?: string;
}

export function ImageLoader({
  src,
  prompt,
  alt = "",
  className,
  wrapperClassName,
  onLoad,
  onError,
  ...imgProps
}: ImageLoaderProps) {
  const resolvedSrc = buildPromptDrivenBlogImageSrc(typeof src === "string" ? src : null, prompt);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [resolvedSrc]);

  if (!resolvedSrc) return null;

  return (
    <div className={cn("relative overflow-hidden bg-muted/30", wrapperClassName)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted/60" aria-hidden="true" />}
      <img
        {...imgProps}
        src={resolvedSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setLoaded(true);
          onError?.(event);
        }}
      />
    </div>
  );
}
