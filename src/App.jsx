import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Checkout from './pages/Checkout'
import OrderTracking from './pages/OrderTracking'

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
])

export default function App() {
  return <RouterProvider router={router} />
}
