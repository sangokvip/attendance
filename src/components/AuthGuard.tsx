'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated')
      const authTime = localStorage.getItem('authTime')
      
      if (authStatus === 'true' && authTime) {
        // 检查登录是否过期（24小时）
        const loginTime = parseInt(authTime)
        const currentTime = Date.now()
        const hoursPassed = (currentTime - loginTime) / (1000 * 60 * 60)
        
        if (hoursPassed < 24) {
          setIsAuthenticated(true)
        } else {
          // 登录过期，清除状态
          localStorage.removeItem('isAuthenticated')
          localStorage.removeItem('authTime')
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
      
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="mt-2 text-gray-600">验证登录状态...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // 将重定向到登录页面
  }

  return <>{children}</>
}
