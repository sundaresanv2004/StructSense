"use client"

import * as React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import BreadcrumbNav from "./Breadcrumb";

const AdminNavBar: React.FC = () => {
    return (
        <div className="border-b dark:bg-bg_black rounded-t-xl">
            <div className="flex h-16 items-center px-4 justify-start">
                <div className="flex items-center">
                    <div className="flex items-center justify-center space-x-4">
                        <SidebarTrigger className="-ml-1"/>
                        <Separator orientation="vertical" className="mr-2 h-4"/>
                        <BreadcrumbNav />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminNavBar;
