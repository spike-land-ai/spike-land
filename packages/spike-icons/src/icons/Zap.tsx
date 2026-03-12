import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { IconBase, IconProps } from "../IconBase";

export const Zap = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  return (
    <IconBase ref={ref} {...props}>
      <motion.path
        initial={{ pathLength: 0, fill: "transparent" }}
        animate={{ pathLength: 1, fill: props.color || "currentColor" }}
        transition={{
          pathLength: { duration: 0.6, ease: "easeOut" },
          fill: { duration: 0.3, delay: 0.4 },
        }}
        d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
      />
    </IconBase>
  );
});

Zap.displayName = "Zap";
