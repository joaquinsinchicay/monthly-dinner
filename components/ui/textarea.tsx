import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-32 w-full rounded-2xl border-0 bg-surface-low px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-secondary focus:border-2 focus:border-primary",
        className
      )}
      {...props}
    />
  );
});
