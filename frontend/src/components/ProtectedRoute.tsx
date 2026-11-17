import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { JSX } from 'react'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, token } = useAuth()
  if (!token && !user) return <Navigate to="/login" replace />
  return children
}
