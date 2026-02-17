
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
    title: string
    description?: string
    icon?: LucideIcon
    children?: React.ReactNode
    className?: string
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    children,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b mb-6", className)}>
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="w-8 h-8 text-primary" />
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                    {children}
                </div>
            )}
        </div>
    )
}
