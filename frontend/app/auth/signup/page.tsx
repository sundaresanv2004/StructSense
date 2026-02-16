import { Zap, Mail } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignupPage() {
    return (
        <Card className="w-full bg-card/95 backdrop-blur-sm shadow-xl border-border/50">
            <CardHeader className="text-center space-y-4 pb-6">
                {/* Logo */}
                <div className="flex justify-center">
                    <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                        <Zap className="h-8 w-8 text-white" strokeWidth={2.5} />
                    </div>
                </div>

                <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                    <CardDescription>Get started with StructSense IoT</CardDescription>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                        Account creation is currently managed by developer.
                        Please contact developer to request access to the platform.
                    </AlertDescription>
                </Alert>

                <div className="text-center space-y-3 pt-2">
                    <p className="text-sm text-muted-foreground">
                        Need an account?
                    </p>
                    <a
                        href="mailto:contact@sundaresan.dev"
                        className="inline-flex items-center gap-2 text-blue-500 font-medium hover:underline"
                    >
                        <Mail className="h-4 w-4" />
                        Contact Developer
                    </a>
                </div>
            </CardContent>

            <CardFooter className="flex justify-center border-t pt-6">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-blue-500 font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    )
}
