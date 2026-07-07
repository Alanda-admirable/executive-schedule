import { cookies } from 'next/headers'
import './admin.css'
import AdminLayoutClient from './AdminLayoutClient'

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
    <AdminLayoutClient user={user} isAdmin={isAdmin}>
      {children}
    </AdminLayoutClient>
  )
}

