'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated')
      const authTime = localStorage.getItem('authTime')
      const currentUser = localStorage.getItem('currentUser')

      if (authStatus === 'true' && authTime) {
        // 检查登录是否过期（24小时）
        const loginTime = parseInt(authTime)
        const currentTime = Date.now()
        const hoursPassed = (currentTime - loginTime) / (1000 * 60 * 60)

        if (hoursPassed < 24) {
          setIsAuthenticated(true)

          // 检查管理员权限
          if (requireAdmin) {
            if (currentUser) {
              try {
                const user = JSON.parse(currentUser)
                if (user.role === 'admin') {
                  setHasPermission(true)
                } else {
                  // 不是管理员，跳转到首页
                  router.push('/')
                  return
                }
              } catch {
                // 解析用户信息失败，跳转到登录页
                localStorage.clear()
                router.push('/login')
                return
              }
            } else {
              // 没有用户信息但需要管理员权限，跳转到首页
              router.push('/')
              return
            }
          } else {
            setHasPermission(true)
          }
        } else {
          // 登录过期，清除状态
          localStorage.clear()
          router.push('/login')
        }
      } else {
        router.push('/login')
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router, requireAdmin])

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

  if (!isAuthenticated || !hasPermission) {
    return null // 将重定向到登录页面或首页
  }

  return <>{children}</>
}
