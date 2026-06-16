export default function AdminPage() {
  return (
    <div>
      <h1 className="title" style={{ marginBottom: '16px', fontSize: '1.875rem', fontWeight: 700 }}>ยินดีต้อนรับสู่ระบบจัดการวาระงานผู้บริหาร</h1>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>โปรดใช้เมนูด้านซ้ายเพื่อเริ่มต้นจัดการข้อมูลผู้บริหารและบันทึกวาระงานประจำวัน</p>
      
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="stat-card" style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>จัดการวาระงาน</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>เพิ่ม แก้ไข ลบ วาระงานรายวันของผู้บริหารแต่ละตำแหน่ง</p>
        </div>
        <div className="stat-card" style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>สถานะระบบ</h3>
          <p style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.875rem' }}>เปิดใช้งานปกติ (Operational)</p>
        </div>
      </div>
    </div>
  )
}
