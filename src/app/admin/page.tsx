import { prisma } from '@/lib/prisma'
import ActiveSessions from './ActiveSessions'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const executivesCount = await prisma.executive.count()

  // Calculate today's start and end times in the database timezone
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const schedulesTodayCount = await prisma.schedule.count({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  })

  const usersCount = await prisma.user.count()

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>ภาพรวมระบบจัดการ</h1>
        <p style={{ color: '#64748b' }}>ยินดีต้อนรับเข้าสู่ระบบหลังบ้าน จังหวัดปทุมธานี โปรดใช้แถบเมนูด้านซ้ายเพื่อเริ่มงาน</p>
      </div>

      <div className="stats-grid">
        {/* Executives Stat Card */}
        <div className="stat-card-custom">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            👤
          </div>
          <div className="stat-info">
            <div className="stat-value">{executivesCount} คน</div>
            <div className="stat-label">ผู้บริหารในระบบ</div>
          </div>
        </div>

        {/* Schedules Stat Card */}
        <div className="stat-card-custom">
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            📅
          </div>
          <div className="stat-info">
            <div className="stat-value">{schedulesTodayCount} วาระ</div>
            <div className="stat-label">วาระงานวันนี้</div>
          </div>
        </div>

        {/* Users Stat Card */}
        <div className="stat-card-custom">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            🔑
          </div>
          <div className="stat-info">
            <div className="stat-value">{usersCount} บัญชี</div>
            <div className="stat-label">เจ้าหน้าที่ระบบทั้งหมด</div>
          </div>
        </div>
      </div>

      {/* Online Users List */}
      <div className="admin-card" style={{ marginTop: '24px' }}>
        <ActiveSessions />
      </div>
    </div>
  )
}
