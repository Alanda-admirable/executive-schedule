import Link from 'next/link'
import './admin.css'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-container">
      <nav className="admin-nav">
        <div className="admin-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/seal.jpg" alt="ตราปทุมธานี" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'contain', background: 'white', border: '1px solid rgba(255, 255, 255, 0.2)' }} />
          <span>ระบบจัดการวาระงาน</span>
        </div>
        <ul className="admin-nav-links">
          <li><Link href="/admin">ภาพรวมระบบ</Link></li>
          <li><Link href="/admin/executives">ข้อมูลผู้บริหาร</Link></li>
          <li><Link href="/admin/schedules">จัดการวาระงาน</Link></li>
          <li><Link href="/">ไปหน้าเว็บสาธารณะ</Link></li>
        </ul>
      </nav>
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
