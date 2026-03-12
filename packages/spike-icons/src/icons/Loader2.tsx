import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { IconBase, IconProps } from "../IconBase";

export const Loader2 = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  return (
    <IconBase ref={ref} {...props}>
      <motion.path
        animate={{ rotate: 360 }}
        transition={{ duration: 1, ease: "linear", repeat: Infinity }}
        style={{ transformOrigin: "center" }}
        d="M21 12a9 9 0 1 1-6.219-8.56"
      />
    </IconBase>
  );
});

Loader2.displayName = "Loader2";
