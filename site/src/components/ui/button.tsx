import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-btn font-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-snuts-accent disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-snuts-accent text-[#261B1F] font-semibold hover:bg-snuts-accent-hover",
        secondary:
          "bg-snuts-card text-snuts-text border border-snuts-border font-medium hover:bg-snuts-card-hover",
        ghost: "text-snuts-muted hover:bg-snuts-card hover:text-snuts-text",
        well: "bg-snuts-well text-snuts-text border border-snuts-border hover:border-snuts-accent",
      },
      size: {
        default: "px-[18px] py-[11px] text-[14px]",
        lg: "px-[26px] py-[15px] text-[15px] font-bold",
        sm: "px-[13px] py-[8px] text-[12.5px]",
        icon: "h-[44px] w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref): React.ReactElement => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
