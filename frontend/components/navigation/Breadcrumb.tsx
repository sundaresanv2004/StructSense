'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MoreHorizontal } from 'lucide-react'
import {
    Breadcrumb as BreadcrumbComponent,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const BreadcrumbNav: React.FC = () => {
    const pathname = usePathname()
    const pathSegments = pathname.split('/').filter(segment => segment !== '' && segment !== 'admin')

    const renderBreadcrumbItem = (segment: string, index: number, isLast: boolean, href: string) => (
        <BreadcrumbItem key={segment}>
            {isLast ? (
                <BreadcrumbPage>{segment}</BreadcrumbPage>
            ) : (
                <BreadcrumbLink asChild>
                    <Link href={href}>{segment}</Link>
                </BreadcrumbLink>
            )}
        </BreadcrumbItem>
    )

    return (
        <BreadcrumbComponent>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/dashboard">
                            <Home className="h-4 w-4" />
                            <span className="sr-only">Home</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {/* Full path for larger screens */}
                <div className="hidden sm:contents">
                    {pathSegments.map((segment, index) => {
                        const href = `/${pathSegments.slice(0, index + 1).join('/')}`
                        const isLast = index === pathSegments.length - 1
                        return (
                            <React.Fragment key={segment}>
                                <BreadcrumbSeparator />
                                {renderBreadcrumbItem(segment, index, isLast, href)}
                            </React.Fragment>
                        )
                    })}
                </div>

                {/* Shrunk path for small screens */}
                <div className="sm:hidden contents">
                    {pathSegments.length > 2 && (
                        <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-1">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">More</span>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {pathSegments.slice(0, -2).map((segment, index) => {
                                            const href = `/${pathSegments.slice(0, index + 1).join('/')}`
                                            return (
                                                <DropdownMenuItem key={segment} asChild>
                                                    <Link href={href} className="w-full">
                                                        {segment}
                                                    </Link>
                                                </DropdownMenuItem>
                                            )
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </BreadcrumbItem>
                        </>
                    )}
                    {pathSegments.slice(-2).map((segment, index, arr) => {
                        const href = `/${pathSegments.slice(0, pathSegments.length - 2 + index + 1).join('/')}`
                        const isLast = index === arr.length - 1
                        return (
                            <React.Fragment key={segment}>
                                <BreadcrumbSeparator />
                                {renderBreadcrumbItem(segment, index, isLast, href)}
                            </React.Fragment>
                        )
                    })}
                </div>
            </BreadcrumbList>
        </BreadcrumbComponent>
    )
}

export default BreadcrumbNav;

