"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

export default function DashboardPage() {
    const router = useRouter()

    const handleLogout = () => {
        Cookies.remove("access_token")
        router.push("/auth/login")
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <h1 className="text-4xl font-bold mb-8">Welcome to Dashboard</h1>
            <p className="text-lg text-muted-foreground mb-8">You are logged in.</p>
            <Button onClick={handleLogout} variant="destructive">
                Log Out
            </Button>
        </div>
    )
}
