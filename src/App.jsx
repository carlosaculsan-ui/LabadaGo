import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Checkout from './pages/Checkout'
import OrderTracking from './pages/OrderTracking'
import RiderDashboard from './pages/RiderDashboard'
import MerchantDashboard from './pages/MerchantDashboard'
import AdminDashboard from './pages/AdminDashboard'
import MakeAdmin from './pages/MakeAdmin'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import SeedPage from './pages/SeedPage'
import MyOrders from './pages/MyOrders'
import Partner from './pages/Partner'
import Apply from './pages/Apply'
import ShopDetail from './pages/ShopDetail'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'browse', element: <Browse /> },
      { path: 'shop/:id', element: <ShopDetail /> },
      { path: 'partner', element: <Partner /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile', element: <Profile /> },
        ],
      },
      {
        element: <ProtectedRoute blockedRoles={['admin']} />,
        children: [
          { path: 'checkout', element: <Checkout /> },
          { path: 'order-tracking', element: <OrderTracking /> },
          { path: 'my-orders', element: <MyOrders /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute blockedRoles={['admin']} />,
    children: [{ path: '/apply/:type', element: <Apply /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={['rider']} />,
    children: [{ path: '/rider', element: <RiderDashboard /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={['merchant']} />,
    children: [{ path: '/merchant', element: <MerchantDashboard /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [{ path: '/admin', element: <AdminDashboard /> }],
  },
  { path: '/make-admin', element: <MakeAdmin /> },
  { path: '/signin', element: <SignIn /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/seed', element: <SeedPage /> },
  { path: '*', element: <NotFound /> },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
