import { forwardRef, isValidElement, type ButtonHTMLAttributes } from "react";
import { cn } from "../../../styling/cn";
import { cva, type VariantProps } from "../../../../../core/shared-utils/styling/cva";
import { Slot } from "../../../../../core/shared-utils/ui/slot";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[calc(var(--radius-control)-0.1rem)] border text-sm font-semibold tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-foreground text-background shadow-[0_18px_40px_color-mix(in_srgb,var(--fg)_12%,transparent)] hover:bg-foreground/92 hover:shadow-[0_22px_48px_color-mix(in_srgb,var(--fg)_16%,transparent)]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-[0_18px_40px_color-mix(in_srgb,var(--destructive-fg)_14%,transparent)] hover:bg-destructive/92",
        outline:
          "border-border bg-background/86 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] hover:border-primary/28 hover:bg-card hover:text-primary",
        secondary:
          "border-border bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:border-primary/22 hover:bg-secondary/88",
        ghost: "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-6 text-[0.95rem]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild && !isValidElement(children)) {
      return (
        <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </button>
      );
    }

    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
