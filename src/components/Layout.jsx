import { Outlet, Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Craft Connect — Empowering Indian Artisans with AI</p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/contact" className="font-medium text-gray-600 hover:text-craft-orange">Contact Us</Link>
            <a href="tel:9350904929" className="text-gray-500 hover:text-craft-orange inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />9350904929</a>
            <a href="mailto:garvitg845@gmail.com" className="text-gray-500 hover:text-craft-orange inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" />Email</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
