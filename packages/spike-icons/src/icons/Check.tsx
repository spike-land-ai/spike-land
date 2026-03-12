import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { IconBase, IconProps } from "../IconBase";

export const Check = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  return (
    <IconBase ref={ref} {...props}>
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        d="M20 6 9 17l-5-5"
      />
    </IconBase>
  );
});

Check.displayName = "Check";
