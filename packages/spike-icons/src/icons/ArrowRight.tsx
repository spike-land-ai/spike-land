import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { IconBase, IconProps } from "../IconBase";

export const ArrowRight = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  return (
    <IconBase ref={ref} {...props}>
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        d="M5 12h14"
      />
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        d="m12 5 7 7-7 7"
      />
    </IconBase>
  );
});

ArrowRight.displayName = "ArrowRight";
