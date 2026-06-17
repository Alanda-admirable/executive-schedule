'use client'

import { useEffect, useState } from 'react'

interface ActiveUser {
  id: string
  username: string
  name: string
  role: string
  lastActive: string
}

export default function ActiveSessions() {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActiveSessions = async () => {
    try {
      const res = await fetch('/api/admin/active-sessions')
      if (res.ok) {
        const data = await res.json()
        setActiveUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch active sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveSessions()
    
    // Poll every 10 seconds to keep the list fresh
    const interval = setInterval(fetchActiveSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return <span className="badge-role badge-role-admin">Super Admin</span>
    }
    return <span className="badge-role badge-role-staff">Staff</span>
  }

  const formatLastActive = (dateStr: string) => {
    const lastActive = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - lastActive.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins <= 0) return 'กำลังใช้งานอยู่ตอนนี้'
    return `ใช้งานล่าสุดเมื่อ ${diffMins} นาทีที่แล้ว`
  }

  if (loading) {
    return <div style={{ color: '#64748b', fontSize: '0.875rem' }}>กำลังโหลดข้อมูลผู้ใช้งานออนไลน์...</div>
  }

  return (
    <div className="online-indicator-container">
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
        เจ้าหน้าที่ที่กำลังออนไลน์ ({activeUsers.length})
      </h3>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>รายชื่อผู้ใช้งานระบบที่มีกิจกรรมภายใน 5 นาทีที่ผ่านมา (อัปเดตทุก 10 วินาที)</p>
      
      {activeUsers.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b', marginTop: '16px' }}>
          ไม่มีเจ้าหน้าที่อื่นออนไลน์ในขณะนี้
        </div>
      ) : (
        <div className="online-users-list">
          {activeUsers.map((user) => (
            <div key={user.id} className="online-user-card">
              <div className="online-avatar">
                {user.name.charAt(0)}
              </div>
              <div className="online-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="online-name">{user.name}</span>
                  {getRoleBadge(user.role)}
                </div>
                <div className="online-time">@{user.username} • {formatLastActive(user.lastActive)}</div>
              </div>
              <span className="status-dot-active" title="ออนไลน์"></span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
