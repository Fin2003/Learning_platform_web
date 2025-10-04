import { cn } from "../../lib/utils"

const Collapsible = ({ 
  children, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  )
}

const CollapsibleTrigger = ({ 
  children, 
  className, 
  onClick,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={cn(
        "flex items-center justify-between w-full p-2 text-left hover:bg-muted rounded-md transition-colors bg-transparent",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

const CollapsibleContent = ({ 
  children, 
  className, 
  isOpen,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { isOpen: boolean }) => {
  return (
    <div 
      className={cn(
        "overflow-hidden transition-all duration-200",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
