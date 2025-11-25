import { cn } from "@/lib/utils"

export type LoadingSpinnerVariant = "spinner" | "dots" | "pulse" | "bars" | "ring" | "orbit"
export type LoadingSpinnerSize = "xs" | "sm" | "md" | "lg" | "xl"

interface LoadingSpinnerProps {
  variant?: LoadingSpinnerVariant
  size?: LoadingSpinnerSize
  className?: string
  label?: string
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
}

const dotSizes = {
  xs: "w-1 h-1",
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
}

const barSizes = {
  xs: "w-0.5 h-2",
  sm: "w-0.5 h-3",
  md: "w-1 h-4",
  lg: "w-1 h-5",
  xl: "w-1.5 h-7",
}

export function LoadingSpinner({
  variant = "spinner",
  size = "md",
  className,
  label,
}: LoadingSpinnerProps) {
  const renderSpinner = () => {
    switch (variant) {
      case "spinner":
        return (
          <svg
            className={cn(
              "animate-spin text-primary",
              sizeClasses[size],
              className
            )}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )

      case "dots":
        return (
          <div className={cn("flex gap-1", className)}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-primary animate-bounce",
                  dotSizes[size]
                )}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: "0.6s",
                }}
              />
            ))}
          </div>
        )

      case "pulse":
        return (
          <div className={cn("relative", sizeClasses[size], className)}>
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-primary animate-pulse" />
          </div>
        )

      case "bars":
        return (
          <div className={cn("flex items-end gap-0.5", className)}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "bg-primary rounded-sm animate-pulse",
                  barSizes[size]
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "0.8s",
                }}
              />
            ))}
          </div>
        )

      case "ring":
        return (
          <div
            className={cn(
              "border-4 border-primary/20 border-t-primary rounded-full animate-spin",
              sizeClasses[size],
              className
            )}
          />
        )

      case "orbit":
        return (
          <div className={cn("relative", sizeClasses[size], className)}>
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/50 animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            />
          </div>
        )

      default:
        return null
    }
  }

  if (label) {
    return (
      <div className="flex flex-col items-center gap-3">
        {renderSpinner()}
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      </div>
    )
  }

  return renderSpinner()
}

// Fullscreen loading overlay
interface LoadingOverlayProps {
  message?: string
  variant?: LoadingSpinnerVariant
}

export function LoadingOverlay({ message = "Loading...", variant = "orbit" }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card/80 backdrop-blur-md border border-border/50 shadow-2xl">
        <LoadingSpinner variant={variant} size="xl" />
        <p className="text-lg font-medium text-foreground">{message}</p>
      </div>
    </div>
  )
}

// Button loading spinner
interface ButtonLoadingProps {
  className?: string
  size?: LoadingSpinnerSize
}

export function ButtonLoading({ className, size = "sm" }: ButtonLoadingProps) {
  return <LoadingSpinner variant="spinner" size={size} className={cn("mr-2", className)} />
}

// Inline loading text with spinner
interface LoadingTextProps {
  text?: string
  variant?: LoadingSpinnerVariant
  size?: LoadingSpinnerSize
  className?: string
}

export function LoadingText({
  text = "Loading...",
  variant = "dots",
  size = "sm",
  className,
}: LoadingTextProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LoadingSpinner variant={variant} size={size} />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  )
}

// Page loading skeleton
interface PageLoadingProps {
  title?: string
  description?: string
  variant?: LoadingSpinnerVariant
}

export function PageLoading({
  title = "Loading content",
  description,
  variant = "orbit",
}: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <LoadingSpinner variant={variant} size="lg" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
    </div>
  )
}

