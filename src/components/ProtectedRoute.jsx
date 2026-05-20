import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function Spinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: '4px solid #e5e7eb',
        borderTopColor: '#3b82f6',
        animation: 'spin 0.75s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function ProtectedRoute({ allowedRoles }) {
  const { user, userProfile, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/signin" replace />
  if (allowedRoles && !allowedRoles.includes(userProfile?.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
