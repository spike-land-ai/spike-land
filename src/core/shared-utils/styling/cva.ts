/**
 * Minimal internal class-variance-authority (cva) implementation
 * for spike.land. Reduces bundle size and removes external dependency.
 */

export type ClassValue = string | number | boolean | null | undefined | ClassValue[];

export function clsx(...inputs: ClassValue[]): string {
  let str = "";
  for (let i = 0; i < inputs.length; i++) {
    const val = inputs[i];
    if (val) {
      if (typeof val === "string") {
        str += (str && " ") + val;
      } else if (Array.isArray(val)) {
        const inner = clsx(...val);
        if (inner) str += (str && " ") + inner;
      } else if (typeof val === "object") {
        for (const key in val as unknown) {
          if ((val as unknown)[key]) {
            str += (str && " ") + key;
          }
        }
      }
    }
  }
  return str;
}

export type VariantProps<T extends (...args: unknown) => unknown> = Parameters<T>[0];

export type ConfigVariants = Record<string, Record<string, string>>;

export function cva<T extends ConfigVariants>(
  base: string,
  config?: {
    variants?: T;
    defaultVariants?: { [K in keyof T]?: keyof T[K] };
    compoundVariants?: Array<
      { [K in keyof T]?: keyof T[K] | Array<keyof T[K]> } & { className: string }
    >;
  },
) {
  return (
    props?: { [K in keyof T]?: keyof T[K] | undefined | null } & {
      className?: string | undefined | null;
    },
  ) => {
    const { className, ...variants } = props || {};
    let result = base;

    if (config?.variants) {
      const variantsConfig = config.variants;
      for (const variant in variantsConfig) {
        const variantKey = variant as keyof T;
        const value = (variants as unknown)[variantKey] ?? config.defaultVariants?.[variantKey];
        const variantEntry = variantsConfig[variantKey];
        if (value && variantEntry && variantEntry[value as string]) {
          result = clsx(result, variantEntry[value as string]);
        }
      }
    }

    if (config?.compoundVariants) {
      for (const compound of config.compoundVariants) {
        const matches = Object.entries(compound).every(([key, value]) => {
          if (key === "className") return true;
          const propValue =
            (variants as unknown)[key as keyof T] ?? config.defaultVariants?.[key as keyof T];
          return Array.isArray(value) ? value.includes(propValue as unknown) : propValue === value;
        });
        if (matches) {
          result = clsx(result, compound.className);
        }
      }
    }

    return clsx(result, className);
  };
}
