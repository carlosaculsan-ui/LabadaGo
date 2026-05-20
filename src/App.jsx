import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Checkout from './pages/Checkout'
import OrderTracking from './pages/OrderTracking'
import RiderDashboard from './pages/RiderDashboard'
import MerchantDashboard from './pages/MerchantDashboard'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'browse', element: <Browse /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'order-tracking', element: <OrderTracking /> },
    ],
  },
  { path: '/rider',     element: <RiderDashboard />     },
  { path: '/merchant', element: <MerchantDashboard /> },
  { path: '/signin',   element: <SignIn />           },
  { path: '/signup',   element: <SignUp />           },
])

export default function App() {
  return <RouterProvider router={router} />
}
