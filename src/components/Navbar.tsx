'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthService, AuthUser } from '@/lib/auth'

interface NavbarProps {
  currentPage?: 'home' | 'employees' | 'attendance' | 'reports' | 'settings' | 'salary' | 'admin'
}

export default function Navbar({ currentPage }: NavbarProps) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const user = AuthService.getCurrentUser()
    setCurrentUser(user)
  }, [])

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      AuthService.logout()
      router.push('/login')
    }
  }

  const getLinkClass = (page: string, activeColor: string = 'blue') => {
    const baseClass = "px-3 py-2 rounded-md text-sm font-medium"
    if (currentPage === page) {
      const colorMap: { [key: string]: string } = {
        blue: 'text-blue-600 hover:text-blue-700',
        green: 'text-green-600 hover:text-green-700',
        purple: 'text-purple-600 hover:text-purple-700',
        orange: 'text-orange-600 hover:text-orange-700',
        red: 'text-red-600 hover:text-red-700'
      }
      return `${baseClass} ${colorMap[activeColor] || colorMap.blue}`
    }
    return `${baseClass} text-gray-700 hover:text-gray-900`
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
              KTV考勤系统
            </Link>
          </div>

          {/* 桌面端导航 */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* 主要导航链接 */}
            <Link href="/employees" className={getLinkClass('employees', 'blue')}>
              员工管理
            </Link>
            <Link href="/attendance" className={getLinkClass('attendance', 'green')}>
              考勤录入
            </Link>
            <Link href="/reports" className={getLinkClass('reports', 'purple')}>
              报表统计
            </Link>
            <Link href="/salary" className={getLinkClass('salary', 'orange')}>
              工资结算
            </Link>
            {/* 系统设置 - 仅管理员可见 */}
            {currentUser?.role === 'admin' && (
              <Link href="/settings" className={getLinkClass('settings', 'orange')}>
                系统设置
              </Link>
            )}

            {/* 调试信息 - 临时显示 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded">
                用户: {currentUser?.displayName || '未登录'} |
                角色: {currentUser?.role || '无'} |
                是否管理员: {currentUser?.role === 'admin' ? '是' : '否'}
              </div>
            )}

            {/* 管理员专用链接 */}
            {currentUser?.role === 'admin' && (
              <>
                <Link href="/admin/users" className={getLinkClass('admin', 'red')}>
                  用户管理
                </Link>
                <Link href="/admin/attendance-logs" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  考勤记录
                </Link>
                <div className="border-l border-gray-200 h-6"></div>
                <span className="text-xs text-gray-500 font-medium">管理员</span>
              </>
            )}



            {/* 用户信息和退出 */}
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
              {currentUser && (
                <div className="flex items-center space-x-2">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{currentUser.displayName}</div>
                    <div className="text-gray-500 text-xs">
                      {currentUser.role === 'admin' ? '管理员' : '用户'}
                      {currentUser.expiresAt && (
                        <span className="ml-1">
                          (至 {new Date(currentUser.expiresAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    currentUser.expiresAt && new Date(currentUser.expiresAt) < new Date()
                      ? 'bg-red-400'
                      : 'bg-green-400'
                  }`} title={
                    currentUser.expiresAt && new Date(currentUser.expiresAt) < new Date()
                      ? '账户已过期'
                      : '账户正常'
                  }></div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 hover:border-gray-400 transition-colors"
              >
                退出
              </button>
            </div>
          </div>

          {/* 移动端菜单按钮 */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <Link
                href="/employees"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === 'employees'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                员工管理
              </Link>
              <Link
                href="/attendance"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === 'attendance'
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                考勤录入
              </Link>
              <Link
                href="/reports"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === 'reports'
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                报表统计
              </Link>
              <Link
                href="/salary"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === 'salary'
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                工资结算
              </Link>
              {/* 系统设置 - 仅管理员可见 */}
              {currentUser?.role === 'admin' && (
                <Link
                  href="/settings"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    currentPage === 'settings'
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  系统设置
                </Link>
              )}

              {/* 管理员专用链接 - 移动端 */}
              {currentUser?.role === 'admin' && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    href="/admin/users"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      currentPage === 'admin'
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    用户管理
                  </Link>
                  <Link
                    href="/admin/attendance-logs"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    考勤记录
                  </Link>
                  <div className="px-3 py-2">
                    <span className="text-xs text-gray-500 font-medium">管理员权限</span>
                  </div>
                </>
              )}

              {/* 用户信息 - 移动端 */}
              <div className="border-t border-gray-200 my-2"></div>
              {currentUser && (
                <div className="px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{currentUser.displayName}</div>
                      <div className="text-gray-500 text-xs">
                        {currentUser.role === 'admin' ? '管理员' : '用户'}
                        {currentUser.expiresAt && (
                          <span className="ml-1">
                            (至 {new Date(currentUser.expiresAt).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      currentUser.expiresAt && new Date(currentUser.expiresAt) < new Date()
                        ? 'bg-red-400'
                        : 'bg-green-400'
                    }`}></div>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  handleLogout()
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                退出登录
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
