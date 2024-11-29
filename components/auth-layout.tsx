"use client"

import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/auth')) {
      router.push('/auth')
    }
    if (!loading && user && pathname.startsWith('/auth')) {
      router.push('/')
    }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return children
}