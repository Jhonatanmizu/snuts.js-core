import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref): React.ReactElement => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-btn border border-snuts-border bg-snuts-well px-[15px] py-[10px] font-body text-[13.5px] text-snuts-text placeholder:text-snuts-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-snuts-accent disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
