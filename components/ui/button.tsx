import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        // 海洋主题变体
        ocean:
          "bg-ocean-500 text-white shadow-lg shadow-ocean-500/25 hover:bg-ocean-600 hover:shadow-xl hover:shadow-ocean-500/35 hover:-translate-y-0.5",
        "ocean-outline":
          "border-2 border-ocean-500 text-ocean-600 bg-transparent hover:bg-ocean-500 hover:text-white hover:shadow-lg hover:shadow-ocean-500/25",
        aqua: "bg-aqua-500 text-white shadow-lg shadow-aqua-500/25 hover:bg-aqua-600 hover:shadow-xl hover:shadow-aqua-500/35 hover:-translate-y-0.5",
        "aqua-outline":
          "border-2 border-aqua-500 text-aqua-600 bg-transparent hover:bg-aqua-500 hover:text-white hover:shadow-lg hover:shadow-aqua-500/25",
        deepblue:
          "bg-deepblue-500 text-white shadow-lg shadow-deepblue-500/25 hover:bg-deepblue-600 hover:shadow-xl hover:shadow-deepblue-500/35 hover:-translate-y-0.5",

        // 标准变体
        default: "bg-primary-500 text-white hover:bg-primary-600",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25",
        outline:
          "border-2 border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",

        // 成功/警告/错误状态
        success:
          "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25",
        warning:
          "bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25",
        error:
          "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-11 w-11",
      },
      rounded: {
        default: "rounded-lg",
        full: "rounded-full",
        xl: "rounded-xl",
      },
    },
    defaultVariants: {
      variant: "ocean",
      size: "md",
      rounded: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>加载中...</span>
          </div>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
