import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { ProductForm } from './pages/ProductForm'
import { Receipts } from './pages/Receipts'
import { ReceiptForm } from './pages/ReceiptForm'
import { Deliveries } from './pages/Deliveries'
import { DeliveryForm } from './pages/DeliveryForm'
import { Transfers } from './pages/Transfers'
import { TransferForm } from './pages/TransferForm'
import { Adjustments } from './pages/Adjustments'
import { AdjustmentForm } from './pages/AdjustmentForm'
import { Stock } from './pages/Stock'
import { Settings } from './pages/Settings'
import { Profile } from './pages/Profile'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id/edit" element={<ProductForm />} />
        <Route path="/operations/receipts" element={<Receipts />} />
        <Route path="/operations/receipts/new" element={<ReceiptForm />} />
        <Route path="/operations/receipts/:id/edit" element={<ReceiptForm />} />
        <Route path="/operations/deliveries" element={<Deliveries />} />
        <Route path="/operations/deliveries/new" element={<DeliveryForm />} />
        <Route path="/operations/deliveries/:id/edit" element={<DeliveryForm />} />
        <Route path="/operations/transfers" element={<Transfers />} />
        <Route path="/operations/transfers/new" element={<TransferForm />} />
        <Route path="/operations/transfers/:id/edit" element={<TransferForm />} />
        <Route path="/operations/adjustments" element={<Adjustments />} />
        <Route path="/operations/adjustments/new" element={<AdjustmentForm />} />
        <Route path="/operations/adjustments/:id/edit" element={<AdjustmentForm />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/warehouses" element={<Settings />} />
        <Route path="/settings/locations" element={<Settings />} />
        <Route path="/settings/categories" element={<Settings />} />
        <Route path="/settings/uoms" element={<Settings />} />
        <Route path="/settings/users" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}