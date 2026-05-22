import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-[#F4F7FA]">
      <img src="/LabadaGoLogo.png" alt="LabadaGo" className="h-12 w-auto mb-8 opacity-60" />
      <p className="text-6xl font-heading font-bold text-[#1B6CA8] mb-3">404</p>
      <h1 className="text-xl font-heading font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <button
        onClick={() => navigate('/')}
        className="bg-[#1B6CA8] text-white text-sm font-semibold px-8 py-3 rounded-xl hover:bg-[#155a8a] transition-colors"
      >
        Back to home
      </button>
    </div>
  )
}
