'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  currentPage?: 'home' | 'employees' | 'attendance' | 'reports' | 'settings'
}

export default function Navbar({ currentPage }: NavbarProps) {
  const router = useRouter()

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('authTime')
      router.push('/login')
    }
  }

  const getLinkClass = (page: string) => {
    const baseClass = "px-3 py-2 rounded-md text-sm font-medium"
    if (currentPage === page) {
      return `${baseClass} text-blue-600 hover:text-blue-700`
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
          <div className="flex items-center space-x-4">
            <Link href="/employees" className={getLinkClass('employees')}>
              员工管理
            </Link>
            <Link href="/attendance" className={getLinkClass('attendance')}>
              考勤录入
            </Link>
            <Link href="/reports" className={getLinkClass('reports')}>
              报表统计
            </Link>
            <Link href="/settings" className={getLinkClass('settings')}>
              系统设置
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 hover:border-gray-400"
            >
              退出
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
