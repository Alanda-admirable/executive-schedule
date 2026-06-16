'use client'

import { useState, useEffect } from 'react'

interface Executive {
  id: string
  name: string
  title: string
  imageUrl: string | null
  color: string
  order: number
}

export default function ExecutivesAdmin() {
  const [executives, setExecutives] = useState<Executive[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [currentExec, setCurrentExec] = useState<Partial<Executive>>({})

  useEffect(() => {
    fetchExecutives()
  }, [])

  const fetchExecutives = async () => {
    setLoading(true)
    const res = await fetch('/api/executives')
    const data = await res.json()
    setExecutives(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = currentExec.id ? 'PATCH' : 'POST'
    const url = currentExec.id ? `/api/executives/${currentExec.id}` : '/api/executives'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentExec),
    })

    if (res.ok) {
      setIsEditing(false)
      setCurrentExec({})
      fetchExecutives()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบข้อมูลผู้บริหารรายนี้? การลบนี้อาจส่งผลต่อข้อมูลวาระงานที่เกี่ยวข้องด้วย')) {
      const res = await fetch(`/api/executives/${id}`, { method: 'DELETE' })
      if (res.ok) fetchExecutives()
    }
  }

  return (
    <div className="admin-page">
      <div className="header">
        <div>
          <h1 className="title">จัดการข้อมูลผู้บริหาร</h1>
          <p className="subtitle">เพิ่ม แก้ไข หรือลบข้อมูลผู้บริหารของจังหวัดและตั้งค่าสีประจำตำแหน่งผู้บริหาร</p>
        </div>
        <button className="btn-admin btn-admin-primary" onClick={() => { setIsEditing(true); setCurrentExec({ order: 0 }); }}>
          <span>+ เพิ่มผู้บริหารใหม่</span>
        </button>
      </div>

      {isEditing && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 className="modal-title">{currentExec.id ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูล'}ผู้บริหาร</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">ชื่อ-นามสกุล</label>
                <input 
                  className="form-input"
                  type="text" 
                  value={currentExec.name || ''} 
                  onChange={e => setCurrentExec({...currentExec, name: e.target.value})}
                  required
                  placeholder="e.g. นายเอกวิทย์ มีเพียร"
                />
              </div>
              <div className="form-group">
                <label className="form-label">ตำแหน่ง</label>
                <input 
                  className="form-input"
                  type="text" 
                  value={currentExec.title || ''} 
                  onChange={e => setCurrentExec({...currentExec, title: e.target.value})}
                  required
                  placeholder="e.g. ผู้ว่าราชการจังหวัดปทุมธานี"
                />
              </div>
              <div className="form-group">
                <label className="form-label">สีประจำตัวผู้บริหาร</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    className="form-input"
                    type="color" 
                    value={currentExec.color || '#64748b'} 
                    onChange={e => setCurrentExec({...currentExec, color: e.target.value})}
                    style={{ width: '60px', padding: '2px', height: '42px' }}
                  />
                  <input 
                    className="form-input"
                    type="text" 
                    value={currentExec.color || '#64748b'} 
                    onChange={e => setCurrentExec({...currentExec, color: e.target.value})}
                    placeholder="#รหัสสีฐานสิบหก"
                  />
                </div>
                <p className="hint">สีนี้จะถูกใช้เป็นสีตัวอักษรของแถววาระงานและจุดสีบนปฏิทิน</p>
              </div>
              <div className="form-group">
                <label className="form-label">ลำดับการแสดงผล</label>
                <input 
                  className="form-input"
                  type="number" 
                  value={currentExec.order || 0} 
                  onChange={e => setCurrentExec({...currentExec, order: parseInt(e.target.value)})}
                />
              </div>
              <div className="actions">
                <button type="submit" className="btn-admin btn-admin-primary">บันทึกข้อมูล</button>
                <button type="button" className="btn-admin btn-admin-secondary" onClick={() => setIsEditing(false)}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">กำลังดึงข้อมูลผู้บริหาร...</div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ลำดับ</th>
                <th>ชื่อผู้บริหาร</th>
                <th>ตำแหน่ง</th>
                <th>สีประจำตัว</th>
                <th style={{ width: '200px' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {executives.map(exec => (
                <tr key={exec.id}>
                  <td><span className="order-badge">{exec.order}</span></td>
                  <td className="font-bold">{exec.name}</td>
                  <td className="text-slate-500">{exec.title}</td>
                  <td>
                    <div className="color-preview">
                      <div className="color-swatch" style={{ background: exec.color || '#64748b' }}></div>
                      <code>{exec.color || '#64748b'}</code>
                    </div>
                  </td>
                  <td>
                    <div className="flex-actions">
                      <button className="btn-admin btn-admin-secondary btn-sm" onClick={() => { setCurrentExec(exec); setIsEditing(true); }}>แก้ไข</button>
                      <button className="btn-admin btn-admin-danger btn-sm" onClick={() => handleDelete(exec.id)}>ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .admin-page { max-width: 1000px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .title { font-size: 1.875rem; font-weight: 700; color: #0f172a; margin: 0; }
        .subtitle { color: #64748b; margin-top: 4px; }
        
        .modal-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 24px; }
        .hint { font-size: 0.75rem; color: #94a3b8; margin-top: 6px; }
        .actions { display: flex; gap: 12px; margin-top: 32px; }
        
        .order-badge { background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 0.75rem; }
        .font-bold { font-weight: 600; color: #1e293b; }
        .text-slate-500 { color: #64748b; }
        
        .color-preview { display: flex; align-items: center; gap: 10px; }
        .color-swatch { width: 24px; height: 24px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.1); }
        .color-preview code { font-size: 0.75rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #475569; }
        
        .flex-actions { display: flex; gap: 8px; }
        .btn-sm { padding: 6px 12px; font-size: 0.75rem; }
        
        .loading-state { padding: 40px; text-align: center; color: #64748b; background: white; border-radius: 12px; border: 1px dashed #cbd5e1; }
      `}</style>
    </div>
  )
}
