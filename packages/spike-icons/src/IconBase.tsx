import React, { forwardRef } from "react";
import { motion, SVGMotionProps } from "framer-motion";

export interface IconProps
  extends Omit<SVGMotionProps<SVGSVGElement>, "color" | "strokeWidth" | "size" | "ref"> {
  color?: string;
  size?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
}

export const IconBase = forwardRef<SVGSVGElement, IconProps>(
  (
    {
      color = "currentColor",
      size = 24,
      strokeWidth = 2,
      absoluteStrokeWidth,
      children,
      className,
      ...rest
    },
    ref,
  ) => {
    return (
      <motion.svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...rest}
      >
        {children}
      </motion.svg>
    );
  },
);

IconBase.displayName = "IconBase";
