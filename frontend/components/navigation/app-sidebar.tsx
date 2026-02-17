"use client"

import type * as React from "react"
import {
  LayoutDashboard,
  Cpu,
  Users,
  BarChart,
  Settings,
  HelpCircle,
  Zap,
  Gauge,
} from "lucide-react"
import { NavMain } from "./nav-main"
import { NavFooter } from "./nav-footer"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Devices",
      url: "/dashboard/devices",
      icon: Gauge,
      isActive: false,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChart,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
  navSupport: [
    {
      title: "Help & Support",
      url: "/dashboard/support",
      icon: HelpCircle,
    },
  ]
}

const AppSidebar: React.FC<React.ComponentProps<typeof Sidebar>> = ({ ...props }) => {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Zap className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">StructSense</span>
                <span className="truncate text-xs">IoT Platform</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} groupTitle="Management" currentPath={pathname} />
        <NavMain items={data.navSupport} groupTitle="Support" currentPath={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <NavFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar

