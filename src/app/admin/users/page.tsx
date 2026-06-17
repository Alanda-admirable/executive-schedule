'use client'

import { useEffect, useState } from 'react'
import '../admin.css'

interface User {
  id: string
  username: string
  name: string
  role: string
  lastActive: string
  createdAt: string
}

interface CurrentUser {
  id: string
  username: string
  name: string
  role: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('STAFF')
  const [error, setError] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, meRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/me')
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
      
      if (meRes.ok) {
        const meData = await meRes.json()
        setCurrentUser(meData)
      }
    } catch (err) {
      console.error('Failed to fetch users page data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitLoading(true)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, username, password, role })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการสร้างบัญชี')
      } else {
        // Success
        setIsModalOpen(false)
        // Reset form
        setName('')
        setUsername('')
        setPassword('')
        setRole('STAFF')
        // Refresh list
        fetchData()
      }
    } catch (err) {
      setError('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้')
      console.error(err)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteUser = async (userToDelete: User) => {
    if (currentUser && userToDelete.id === currentUser.id) {
      alert('คุณไม่สามารถลบบัญชีของคุณเองได้')
      return
    }

    const confirmDelete = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของ "${userToDelete.name}" (@${userToDelete.username})?`)
    if (!confirmDelete) return

    try {
      const res = await fetch(`/api/admin/users?id=${userToDelete.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'เกิดข้อผิดพลาดในการลบบัญชี')
      } else {
        fetchData()
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบบัญชี')
      console.error(err)
    }
  }

  const formatLastActive = (dateStr: string) => {
    if (!dateStr) return 'ไม่เคยเข้าใช้งาน'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 5) {
      return (
        <span style={{ color: '#22c55e', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', backgroundColor: '#22c55e', borderRadius: '50%' }}></span>
          ออนไลน์ตอนนี้
        </span>
      )
    }

    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' น.'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>จัดการสิทธิ์เจ้าหน้าที่</h1>
          <p style={{ color: '#64748b' }}>จัดการบัญชีผู้ใช้งานระบบและควบคุมสิทธิ์ระดับแอดมิน (Super Admin) หรือเจ้าหน้าที่ (Staff)</p>
        </div>
        <button className="btn-admin btn-admin-primary" onClick={() => setIsModalOpen(true)}>
          ➕ เพิ่มบัญชีเจ้าหน้าที่
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ชื่อผู้ปฏิบัติงาน</th>
                <th>ชื่อผู้ใช้งาน (Username)</th>
                <th>สิทธิ์เข้าใช้งาน</th>
                <th>กิจกรรมล่าสุด</th>
                <th style={{ width: '120px', textAlign: 'center' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>
                    {user.name} {currentUser?.id === user.id && <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'normal' }}>(คุณ)</span>}
                  </td>
                  <td>@{user.username}</td>
                  <td>
                    {user.role === 'ADMIN' ? (
                      <span className="badge-role badge-role-admin">Super Admin</span>
                    ) : (
                      <span className="badge-role badge-role-staff">Staff</span>
                    )}
                  </td>
                  <td>{formatLastActive(user.lastActive)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-admin btn-admin-danger"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      disabled={currentUser?.id === user.id}
                      onClick={() => handleDeleteUser(user)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', color: '#0f172a' }}>เพิ่มบัญชีเจ้าหน้าที่รายใหม่</h2>
            
            {error && <div className="login-error-msg" style={{ margin: '0 0 20px 0' }}>{error}</div>}

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-name">ชื่อจริง-นามสกุล</label>
                <input
                  id="new-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น นายพงษ์ศักดิ์ รักดี"
                  required
                  disabled={submitLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-username">ชื่อผู้ใช้งาน (Username)</label>
                <input
                  id="new-username"
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ภาษาอังกฤษและตัวเลขเท่านั้น..."
                  pattern="^[a-zA-Z0-9_]+$"
                  title="กรุณากรอกภาษาอังกฤษและตัวเลขเท่านั้น"
                  required
                  disabled={submitLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-password">รหัสผ่าน (Password)</label>
                <input
                  id="new-password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กำหนดรหัสผ่านเข้าใช้งาน..."
                  minLength={6}
                  required
                  disabled={submitLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-role">ระดับสิทธิ์ (Role)</label>
                <select
                  id="new-role"
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  disabled={submitLoading}
                >
                  <option value="STAFF">Staff (จัดการวาระงานเท่านั้น)</option>
                  <option value="ADMIN">Super Admin (สิทธิ์ระบบทั้งหมด)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn-admin btn-admin-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitLoading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-admin btn-admin-primary"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
