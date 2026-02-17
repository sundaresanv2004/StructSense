"use client"

import type { LucideIcon } from "lucide-react"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface NavSupportProps {
    items: {
        title: string
        url: string
        icon?: LucideIcon
    }[]
    groupTitle: string
    currentPath: string
}

export function NavSupport({ items, groupTitle, currentPath }: NavSupportProps) {
    const { isMobile, setOpenMobile } = useSidebar()

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{groupTitle}</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <SidebarMenuButton
                                        className={cn(
                                            currentPath === item.url && "bg-blue-500/20 text-sidebar-accent-foreground"
                                        )}
                                        tooltip={item.title}
                                    >
                                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Coming Soon</DialogTitle>
                                        <DialogDescription>
                                            The Help & Support documentation and ticketing system is currently under development.
                                            Please contact your system administrator for immediate assistance.
                                        </DialogDescription>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
