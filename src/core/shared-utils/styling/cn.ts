import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "./cva.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
