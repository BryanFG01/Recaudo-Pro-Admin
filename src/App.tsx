import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminUsersPage from './features/auth/presentation/pages/AdminUsersPage'
import CreateUserPage from './features/auth/presentation/pages/CreateUserPage'
import LoginPage from './features/auth/presentation/pages/LoginPage'
import { useAuthStore } from './features/auth/presentation/store/authStore'
import AdminClientsPage from './features/clients/presentation/pages/AdminClientsPage'
import ClientsPage from './features/clients/presentation/pages/ClientsPage'
import CollectionsPage from './features/collections/presentation/pages/CollectionsPage'
import CreditsPage from './features/credits/presentation/pages/CreditsPage'
import DashboardPage from './features/dashboard/presentation/pages/DashboardPage'
import { Layout } from './shared/components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, businessId } = useAuthStore()
  // Permitir acceso si hay usuario O businessId
  return user || businessId ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <PrivateRoute>
              <Layout>
                <ClientsPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <Layout>
                <AdminUsersPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users/create"
          element={
            <PrivateRoute>
              <Layout>
                <CreateUserPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/clients"
          element={
            <PrivateRoute>
              <Layout>
                <AdminClientsPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/credits"
          element={
            <PrivateRoute>
              <Layout>
                <CreditsPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/collections"
          element={
            <PrivateRoute>
              <Layout>
                <CollectionsPage />
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
