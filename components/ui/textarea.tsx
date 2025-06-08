import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-lg border bg-transparent px-4 py-3 text-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
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
        sm: "min-h-[60px] px-3 py-2 text-xs rounded-md",
        md: "min-h-[80px] px-4 py-3 text-sm rounded-lg",
        lg: "min-h-[120px] px-6 py-4 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "ocean",
      size: "md",
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      label,
      error,
      helperText,
      maxLength,
      showCount = false,
      value,
      ...props
    },
    ref
  ) => {
    const currentLength = value ? String(value).length : 0;

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ocean-700">
              {label}
            </label>
            {showCount && maxLength && (
              <span
                className={cn(
                  "text-xs",
                  currentLength > maxLength * 0.9
                    ? "text-red-500"
                    : "text-ocean-500"
                )}
              >
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
        <textarea
          className={cn(
            textareaVariants({
              variant: error ? "error" : variant,
              size,
              className,
            })
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
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

Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
