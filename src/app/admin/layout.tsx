import Link from 'next/link'
import { cookies } from 'next/headers'
import './admin.css'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')
  
  let user = null
  if (sessionCookie) {
    try {
      user = JSON.parse(sessionCookie.value)
    } catch (e) {
      // Ignore invalid cookies
    }
  }

  // If no user session is found, render children directly (e.g., for login page)
  if (!user) {
    return <div style={{ minHeight: '100vh', background: '#f8fafc' }}>{children}</div>
  }

  const isAdmin = user.role === 'ADMIN'

  return (
    <div className="admin-container">
      <nav className="admin-nav">
        <div className="admin-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/seal.jpg" alt="ตราปทุมธานี" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'contain', background: 'white', border: '1px solid rgba(255, 255, 255, 0.2)' }} />
          <span>ระบบจัดการวาระงาน</span>
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
          <li><Link href="/admin">📊 ภาพรวมระบบ</Link></li>
          {isAdmin && <li><Link href="/admin/executives">👤 ข้อมูลผู้บริหาร</Link></li>}
          <li><Link href="/admin/schedules">📅 จัดการวาระงาน</Link></li>
          {isAdmin && <li><Link href="/admin/users">🔑 จัดการสิทธิ์เจ้าหน้าที่</Link></li>}
          <li style={{ marginTop: '20px', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
            <Link href="/">🌐 ไปหน้าเว็บสาธารณะ</Link>
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

