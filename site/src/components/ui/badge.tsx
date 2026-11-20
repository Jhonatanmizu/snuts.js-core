import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-snuts-accent-14 text-snuts-accent-hover",
        solid: "bg-snuts-accent text-[#261B1F] font-semibold",
        card: "bg-snuts-card text-snuts-muted border border-snuts-border",
        outline: "bg-transparent text-snuts-muted border border-snuts-border",
        ok: "bg-snuts-ok-12 text-snuts-ok",
        warn: "bg-snuts-warn-14 text-snuts-warn",
        err: "bg-snuts-err-14 text-snuts-err",
        chestnut: "bg-snuts-chestnut-10 text-snuts-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): React.ReactElement {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
