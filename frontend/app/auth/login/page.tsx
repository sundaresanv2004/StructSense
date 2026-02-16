"use client"

import React, { useState } from "react"
import { Eye, EyeOff, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // TODO: Implement actual login logic
        console.log("Login submitted")
    }

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
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>Enter your credentials to access your account.</CardDescription>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                            id="email"
                            placeholder="john@example.com"
                            type="email"
                            required
                        />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <InputGroup>
                            <InputGroupInput
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                            />
                            <InputGroupAddon
                                align="inline-end"
                                className="cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </InputGroupAddon>
                        </InputGroup>
                    </Field>

                    <Button type="submit" className="w-full mt-6">
                        Sign In
                    </Button>
                </form>
            </CardContent>

            <CardFooter className="flex justify-center border-t pt-6">
                <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/auth/signup" className="text-blue-500 font-medium hover:underline">
                        Sign up
                    </Link>
                </p>
            </CardFooter>
        </Card>
    )
}
