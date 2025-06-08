import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",

        // 海洋主题变体
        ocean:
          "border-transparent bg-ocean-500 text-white shadow-lg shadow-ocean-500/25 hover:bg-ocean-600",
        "ocean-outline":
          "border-ocean-500 text-ocean-600 bg-transparent hover:bg-ocean-50",
        "ocean-soft":
          "border-transparent bg-ocean-100 text-ocean-700 hover:bg-ocean-200",

        aqua: "border-transparent bg-aqua-500 text-white shadow-lg shadow-aqua-500/25 hover:bg-aqua-600",
        "aqua-outline":
          "border-aqua-500 text-aqua-600 bg-transparent hover:bg-aqua-50",
        "aqua-soft":
          "border-transparent bg-aqua-100 text-aqua-700 hover:bg-aqua-200",

        deepblue:
          "border-transparent bg-deepblue-500 text-white shadow-lg shadow-deepblue-500/25 hover:bg-deepblue-600",
        "deepblue-outline":
          "border-deepblue-500 text-deepblue-600 bg-transparent hover:bg-deepblue-50",
        "deepblue-soft":
          "border-transparent bg-deepblue-100 text-deepblue-700 hover:bg-deepblue-200",

        // 状态变体
        success:
          "border-transparent bg-green-500 text-white shadow-lg shadow-green-500/25 hover:bg-green-600",
        "success-outline":
          "border-green-500 text-green-600 bg-transparent hover:bg-green-50",
        "success-soft":
          "border-transparent bg-green-100 text-green-700 hover:bg-green-200",

        warning:
          "border-transparent bg-yellow-500 text-white shadow-lg shadow-yellow-500/25 hover:bg-yellow-600",
        "warning-outline":
          "border-yellow-500 text-yellow-600 bg-transparent hover:bg-yellow-50",
        "warning-soft":
          "border-transparent bg-yellow-100 text-yellow-700 hover:bg-yellow-200",

        error:
          "border-transparent bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600",
        "error-outline":
          "border-red-500 text-red-600 bg-transparent hover:bg-red-50",
        "error-soft":
          "border-transparent bg-red-100 text-red-700 hover:bg-red-200",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "ocean",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
