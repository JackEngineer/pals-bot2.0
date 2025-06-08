import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full border bg-transparent text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        ocean:
          "border-ocean-200 bg-white/90 backdrop-blur-sm focus-visible:border-ocean-500 focus-visible:ring-2 focus-visible:ring-ocean-200 placeholder:text-ocean-400",
        error:
          "border-red-500 text-red-600 focus-visible:ring-2 focus-visible:ring-red-200",
        success:
          "border-green-500 text-green-600 focus-visible:ring-2 focus-visible:ring-green-200",
      },
      size: {
        sm: "h-9 px-3 text-xs rounded-md",
        md: "h-11 px-4 text-sm rounded-lg",
        lg: "h-12 px-6 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "ocean",
      size: "md",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, label, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-ocean-700">{label}</label>
        )}
        <input
          className={cn(
            inputVariants({
              variant: error ? "error" : variant,
              size,
              className,
            })
          )}
          ref={ref}
          {...props}
        />
        {(error || helperText) && (
          <p
            className={cn("text-xs", error ? "text-red-600" : "text-ocean-500")}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
