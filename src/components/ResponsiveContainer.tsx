'use client'

import { ReactNode } from 'react'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
}

export default function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}

// 响应式主要内容容器
interface ResponsiveMainProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl'
  className?: string
}

export function ResponsiveMain({ 
  children, 
  maxWidth = '7xl', 
  className = '' 
}: ResponsiveMainProps) {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md', 
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl'
  }

  return (
    <main className={`${maxWidthClasses[maxWidth]} mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="space-y-4 sm:space-y-6">
        {children}
      </div>
    </main>
  )
}

// 响应式卡片容器
interface ResponsiveCardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function ResponsiveCard({ 
  children, 
  className = '', 
  padding = 'md' 
}: ResponsiveCardProps) {
  const paddingClasses = {
    'sm': 'p-3 sm:p-4',
    'md': 'p-4 sm:p-6',
    'lg': 'p-6 sm:p-8'
  }

  return (
    <div className={`bg-white shadow rounded-lg ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  )
}

// 响应式表格容器
interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

export function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          {children}
        </div>
      </div>
    </div>
  )
}

// 响应式网格容器
interface ResponsiveGridProps {
  children: ReactNode
  cols?: {
    default: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 'md',
  className = '' 
}: ResponsiveGridProps) {
  const gapClasses = {
    'sm': 'gap-3',
    'md': 'gap-4 sm:gap-6',
    'lg': 'gap-6 sm:gap-8'
  }

  const gridCols = `grid-cols-${cols.default} ${
    cols.sm ? `sm:grid-cols-${cols.sm}` : ''
  } ${
    cols.md ? `md:grid-cols-${cols.md}` : ''
  } ${
    cols.lg ? `lg:grid-cols-${cols.lg}` : ''
  } ${
    cols.xl ? `xl:grid-cols-${cols.xl}` : ''
  }`

  return (
    <div className={`grid ${gridCols} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}
