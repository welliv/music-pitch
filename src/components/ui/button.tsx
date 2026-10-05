import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-button whitespace-nowrap text-[0.9375rem] font-medium tracking-[-0.01em] transition-all duration-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        // Apple primary CTA: white/near-white fill, black label (never inherit body mist)
        default:
          "bg-white text-black shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] hover:bg-white/95 active:scale-[0.98]",
        alternate:
          "bg-white text-black hover:bg-white/95 active:scale-[0.98]",
        secondary:
          "border border-white/20 bg-transparent text-mist hover:border-white/35 hover:bg-white/[0.06] active:scale-[0.98]",
        "secondary-alt":
          "border border-white/30 bg-transparent text-white hover:bg-white/10",
        link: "gap-2 border-0 bg-transparent p-0 text-accent underline-offset-4 hover:underline",
        "link-alt": "gap-2 border-0 bg-transparent p-0 text-white",
        ghost: "border-0 bg-transparent text-mist-dim hover:bg-white/[0.06] hover:text-mist",
        none: "",
      },
      size: {
        // Avoid `text-small` — twMerge treats custom text-* names as colors and
        // strips variant text-* (e.g. text-black / text-mist) when size=sm.
        default: "min-h-11 px-6 py-2.5",
        sm: "min-h-9 px-4 py-2 text-[0.875rem] leading-[1.5] tracking-[-0.008em]",
        link: "p-0",
        icon: "size-10",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    title?: string;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  iconLeft,
  iconRight,
  title,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const content = asChild ? (
    children
  ) : (
    <>
      {iconLeft}
      {children ?? title}
      {iconRight}
    </>
  );

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {content}
    </Comp>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
