import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]",
  {
    variants: {
      variant: {
        primary: "bg-navy text-white hover:bg-navy-600 shadow-sm",
        gold: "bg-gold text-navy-900 hover:bg-gold-400 shadow-sm",
        outline: "border border-navy-200 bg-white text-navy hover:bg-navy-50",
        ghost: "text-navy hover:bg-navy-50",
        danger: "bg-red-600 text-white hover:bg-red-700",
        link: "text-navy underline-offset-4 hover:underline px-0",
      },
      size: { sm: "h-9 px-3", md: "h-11 px-5", lg: "h-12 px-7 text-base", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
export { buttonVariants };
