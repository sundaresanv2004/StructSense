import { Zap, Mail } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignupPage() {
    return (
        <Card className="w-full border-none ring-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card/80 md:backdrop-blur-sm md:p-2">
            <CardHeader className="text-center pt-0 md:pt-6 px-0 md:px-6">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                        <Zap className="h-8 w-8 text-white" strokeWidth={2.5} />
                    </div>
                </div>

                <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                <CardDescription>Get started with StructSense IoT</CardDescription>
            </CardHeader>

            <CardContent className="px-0 space-y-4 md:px-6">
                <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                        Account creation is currently managed by our development team.
                        Please contact the developer to request access to the platform.
                    </AlertDescription>
                </Alert>

                <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                        Need an account?
                    </p>
                    <a
                        href="mailto:developer@structsense.com"
                        className="text-primary font-medium hover:underline"
                    >
                        Contact Developer
                    </a>
                </div>
            </CardContent>

            <CardFooter className="flex justify-center border-t border-border/50 pb-4 px-0 md:px-6">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-primary font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    )
}
