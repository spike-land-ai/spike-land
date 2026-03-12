import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { IconBase, IconProps } from "../IconBase";

export const Sparkles = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  return (
    <IconBase ref={ref} {...props}>
      <motion.path
        initial={{ scale: 0.8, opacity: 0, rotate: -45 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        style={{ transformOrigin: "center" }}
        d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
      />
      <motion.path
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "backOut" }}
        style={{ transformOrigin: "20px 4px" }}
        d="M20 3v4"
      />
      <motion.path
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "backOut" }}
        style={{ transformOrigin: "22px 5px" }}
        d="M22 5h-4"
      />
      <motion.path
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "backOut" }}
        style={{ transformOrigin: "4px 20px" }}
        d="M4 17v4"
      />
      <motion.path
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "backOut" }}
        style={{ transformOrigin: "2px 19px" }}
        d="M2 19h4"
      />
    </IconBase>
  );
});

Sparkles.displayName = "Sparkles";
