'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminLayoutClientProps {
  user: {
    name: string
    role: string
  }
  isAdmin: boolean
  children: React.ReactNode
}

export default function AdminLayoutClient({
  user,
  isAdmin,
  children
}: AdminLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  // Auto-collapse sidebar on smaller screens (less than 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={`admin-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Floating Toggle Button when Collapsed */}
      {isCollapsed && (
        <button 
          className="sidebar-toggle-btn"
          onClick={() => setIsCollapsed(false)}
          title="เปิดเมนูนำทาง"
        >
          ☰
        </button>
      )}

      <nav className="admin-nav">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div className="admin-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 0 }}>
            <img src="/seal.jpg" alt="ตราปทุมธานี" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'contain', background: 'white', border: '1px solid rgba(255, 255, 255, 0.2)' }} />
            <span className="brand-text">ระบบจัดการวาระงาน</span>
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={() => setIsCollapsed(true)}
            title="ซ่อนเมนูนำทาง"
          >
            ✕
          </button>
        </div>

        <div className="admin-profile-section">
          <div className="admin-profile-name">สวัสดี, {user.name}</div>
          <div>
            {isAdmin ? (
              <span className="badge-role badge-role-admin">Super Admin</span>
            ) : (
              <span className="badge-role badge-role-staff">เจ้าหน้าที่ (Staff)</span>
            )}
          </div>
        </div>

        <ul className="admin-nav-links" style={{ flex: 1 }}>
          <li>
            <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>
              📊 ภาพรวมระบบ
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link href="/admin/executives" className={pathname === '/admin/executives' ? 'active' : ''}>
                👤 ข้อมูลผู้บริหาร
              </Link>
            </li>
          )}
          <li>
            <Link href="/admin/schedules" className={pathname === '/admin/schedules' ? 'active' : ''}>
              📅 จัดการวาระงาน
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link href="/admin/users" className={pathname === '/admin/users' ? 'active' : ''}>
                🔑 จัดการสิทธิ์เจ้าหน้าที่
              </Link>
            </li>
          )}
          <li style={{ marginTop: '20px', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
            <Link href="/">
              🌐 ไปหน้าเว็บสาธารณะ
            </Link>
          </li>
        </ul>

        <a href="/api/admin/logout" className="admin-logout-btn">
          🚪 ออกจากระบบ
        </a>
      </nav>
      
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
