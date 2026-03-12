import * as React from "react";

/**
 * Minimal internal Slot component for spike.land.
 * Merges props and refs from the Slot to its first child.
 * Used for the "asChild" pattern in UI components.
 */

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>((props, forwardedRef) => {
  const { children, ...slotProps } = props;

  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...slotProps,
      ...(children.props as unknown),
      // @ts-expect-error - cloning refs is tricky but needed here
      ref: (children as unknown).props?.ref
        ? mergeRefs(forwardedRef, (children as unknown).ref)
        : forwardedRef,
    } as unknown);
  }

  return React.Children.count(children) > 1 ? React.Children.only(null) : null;
});

Slot.displayName = "Slot";

function mergeRefs<T>(...refs: Array<React.ForwardedRef<T> | React.Ref<T>>) {
  return (node: T) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && typeof ref === "object") {
        (ref as unknown).current = node;
      }
    }
  };
}
