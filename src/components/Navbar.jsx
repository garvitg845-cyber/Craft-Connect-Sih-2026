import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingCart, Heart, Bell, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const CUSTOMER_LINKS = [
  { to: '/customer', label: 'Home' },
  { to: '/customer/search', label: 'AI Search' },
  { to: '/customer/craft-guide', label: 'Global Craft AI' },
  { to: '/customer/ai-decor', label: 'AI Home Decor' },
  { to: '/customer/products', label: 'Shop' },
  { to: '/customer/b2b', label: 'B2B Market' },
  { to: '/customer/craft-map', label: 'Craft Map' },
  { to: '/customer/orders', label: 'Orders' },
]

const ARTISAN_LINKS = [
  { to: '/artisan', label: 'Dashboard' },
  { to: '/artisan/products', label: 'Products' },
  { to: '/artisan/ai-studio', label: 'AI Studio' },
  { to: '/artisan/pricing', label: 'Pricing' },
  { to: '/artisan/ai-pricing', label: 'AI Pricing' },
  { to: '/artisan/b2b', label: 'B2B Inquiries' },
  { to: '/artisan/marketplaces', label: 'Marketplace Hub' },
  { to: '/artisan/orders', label: 'Orders' },
  { to: '/artisan/analytics', label: 'Analytics' },
  { to: '/artisan/copilot', label: 'AI Copilot' },
]

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/artisans', label: 'Verification' },
  { to: '/admin/products', label: 'Moderation' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/returns', label: 'Returns' },
  { to: '/admin/reports', label: 'Reports' },
]

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const links = profile?.role === 'artisan' ? ARTISAN_LINKS : profile?.role === 'admin' ? ADMIN_LINKS : CUSTOMER_LINKS

  return (
    <nav className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to={profile ? `/${profile.role}` : '/'} className="font-display text-xl font-bold text-craft-orange">
          Craft<span className="text-tech-teal">Connect</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-gray-600 hover:text-craft-orange">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {profile?.role === 'customer' && (
            <>
              <Link to="/customer/wishlist" aria-label="Wishlist"><Heart className="w-5 h-5 text-gray-600" /></Link>
              <Link to="/customer/cart" aria-label="Cart"><ShoppingCart className="w-5 h-5 text-gray-600" /></Link>
            </>
          )}
          {profile?.role === 'artisan' && (
            <Link to="/artisan/notifications" aria-label="Notifications"><Bell className="w-5 h-5 text-gray-600" /></Link>
          )}
          {profile && (
            <Link to="/settings" aria-label="Settings" title="Settings"><Settings className="w-5 h-5 text-gray-600 hover:text-craft-orange" /></Link>
          )}
          {profile && (
            <button onClick={async () => { await signOut(); navigate('/') }} className="flex items-center gap-1 text-sm text-gray-600 hover:text-craft-orange">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white px-4 pb-4 space-y-2">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-gray-700">
              {l.label}
            </Link>
          ))}
          {profile && (
            <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2 text-sm text-gray-700 font-medium"><Settings className="w-4 h-4" /> Settings</Link>
          )}
          {profile && (
            <button onClick={async () => { await signOut(); navigate('/') }} className="block py-2 text-sm text-red-600 font-medium">
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
