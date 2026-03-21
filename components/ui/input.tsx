import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "min-h-11 w-full rounded-2xl border-0 bg-surface-low px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-secondary focus:border-2 focus:border-primary",
        className
      )}
      {...props}
    />
  );
});
