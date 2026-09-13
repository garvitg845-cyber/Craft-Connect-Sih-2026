import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Contact from './pages/Contact'
import Settings from './pages/Settings'

// Customer
import CustomerHome from './pages/customer/Home'
import AISearch from './pages/customer/AISearch'
import ProductListing from './pages/customer/ProductListing'
import ProductDetails from './pages/customer/ProductDetails'
import ArtisanProfile from './pages/customer/ArtisanProfile'
import Wishlist from './pages/customer/Wishlist'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import Orders from './pages/customer/Orders'
import Returns from './pages/customer/Returns'
import CustomerProfile from './pages/customer/Profile'
import CraftMap from './pages/customer/CraftMap'
import CraftGuide from './pages/customer/CraftGuide'
import AIDecor from './pages/customer/AIDecor'
import CraftPassport from './pages/customer/CraftPassport'
import B2BMarket from './pages/customer/B2BMarket'

// Artisan
import ArtisanDashboard from './pages/artisan/Dashboard'
import ArtisanProfileEdit from './pages/artisan/ArtisanProfileEdit'
import ArtisanProducts from './pages/artisan/Products'
import AddEditProduct from './pages/artisan/AddEditProduct'
import AIProductStudio from './pages/artisan/AIProductStudio'
import Inventory from './pages/artisan/Inventory'
import ArtisanOrders from './pages/artisan/ArtisanOrders'
import PricingCalculator from './pages/artisan/PricingCalculator'
import SalesAnalytics from './pages/artisan/SalesAnalytics'
import ArtisanReviews from './pages/artisan/ArtisanReviews'
import QRCatalog from './pages/artisan/QRCatalog'
import Notifications from './pages/artisan/Notifications'
import AIBusinessCopilot from './pages/artisan/AIBusinessCopilot'
import AIDynamicPricing from './pages/artisan/AIDynamicPricing'
import B2BInquiries from './pages/artisan/B2BInquiries'
import MarketplaceLinkage from './pages/artisan/MarketplaceLinkage'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import ArtisanVerification from './pages/admin/ArtisanVerification'
import ProductModeration from './pages/admin/ProductModeration'
import AdminUsers from './pages/admin/Users'
import AdminOrders from './pages/admin/AdminOrders'
import AdminPayments from './pages/admin/AdminPayments'
import AdminReturns from './pages/admin/AdminReturns'
import AdminReports from './pages/admin/AdminReports'
import AdminCategories from './pages/admin/AdminCategories'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/settings" element={<Settings />} />

        {/* Public product/artisan/map browsing works for everyone */}
        <Route path="/customer" element={<CustomerHome />} />
        <Route path="/customer/products" element={<ProductListing />} />
        <Route path="/customer/products/:id" element={<ProductDetails />} />
        <Route path="/customer/artisans/:id" element={<ArtisanProfile />} />
        <Route path="/customer/artisans/:id/passport" element={<CraftPassport />} />
        <Route path="/customer/ai-decor" element={<ProtectedRoute allowedRoles={['customer']}><AIDecor /></ProtectedRoute>} />
        <Route path="/customer/craft-guide" element={<ProtectedRoute allowedRoles={['customer']}><CraftGuide /></ProtectedRoute>} />
        <Route path="/customer/craft-map" element={<CraftMap />} />
        <Route path="/customer/search" element={<AISearch />} />
        <Route path="/customer/b2b" element={<ProtectedRoute allowedRoles={['customer']}><B2BMarket /></ProtectedRoute>} />

        {/* Customer-only actions */}
        <Route path="/customer/wishlist" element={<ProtectedRoute allowedRoles={['customer']}><Wishlist /></ProtectedRoute>} />
        <Route path="/customer/cart" element={<ProtectedRoute allowedRoles={['customer']}><Cart /></ProtectedRoute>} />
        <Route path="/customer/checkout" element={<ProtectedRoute allowedRoles={['customer']}><Checkout /></ProtectedRoute>} />
        <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['customer']}><Orders /></ProtectedRoute>} />
        <Route path="/customer/returns" element={<ProtectedRoute allowedRoles={['customer']}><Returns /></ProtectedRoute>} />
        <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['customer']}><CustomerProfile /></ProtectedRoute>} />

        {/* Artisan */}
        <Route path="/artisan" element={<ProtectedRoute allowedRoles={['artisan']}><ArtisanDashboard /></ProtectedRoute>} />
        <Route path="/artisan/profile" element={<ProtectedRoute allowedRoles={['artisan']}><ArtisanProfileEdit /></ProtectedRoute>} />
        <Route path="/artisan/products" element={<ProtectedRoute allowedRoles={['artisan']}><ArtisanProducts /></ProtectedRoute>} />
        <Route path="/artisan/products/new" element={<ProtectedRoute allowedRoles={['artisan']}><AddEditProduct /></ProtectedRoute>} />
        <Route path="/artisan/products/:id/edit" element={<ProtectedRoute allowedRoles={['artisan']}><AddEditProduct /></ProtectedRoute>} />
        <Route path="/artisan/ai-studio" element={<ProtectedRoute allowedRoles={['artisan']}><AIProductStudio /></ProtectedRoute>} />
        <Route path="/artisan/inventory" element={<ProtectedRoute allowedRoles={['artisan']}><Inventory /></ProtectedRoute>} />
        <Route path="/artisan/orders" element={<ProtectedRoute allowedRoles={['artisan']}><ArtisanOrders /></ProtectedRoute>} />
        <Route path="/artisan/pricing" element={<ProtectedRoute allowedRoles={['artisan']}><PricingCalculator /></ProtectedRoute>} />
        <Route path="/artisan/ai-pricing" element={<ProtectedRoute allowedRoles={['artisan']}><AIDynamicPricing /></ProtectedRoute>} />
        <Route path="/artisan/b2b" element={<ProtectedRoute allowedRoles={['artisan']}><B2BInquiries /></ProtectedRoute>} />
        <Route path="/artisan/marketplaces" element={<ProtectedRoute allowedRoles={['artisan']}><MarketplaceLinkage /></ProtectedRoute>} />
        <Route path="/artisan/analytics" element={<ProtectedRoute allowedRoles={['artisan']}><SalesAnalytics /></ProtectedRoute>} />
        <Route path="/artisan/reviews" element={<ProtectedRoute allowedRoles={['artisan']}><ArtisanReviews /></ProtectedRoute>} />
        <Route path="/artisan/qr-catalog" element={<ProtectedRoute allowedRoles={['artisan']}><QRCatalog /></ProtectedRoute>} />
        <Route path="/artisan/notifications" element={<ProtectedRoute allowedRoles={['artisan']}><Notifications /></ProtectedRoute>} />
        <Route path="/artisan/copilot" element={<ProtectedRoute allowedRoles={['artisan']}><AIBusinessCopilot /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/artisans" element={<ProtectedRoute allowedRoles={['admin']}><ArtisanVerification /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin']}><ProductModeration /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayments /></ProtectedRoute>} />
        <Route path="/admin/returns" element={<ProtectedRoute allowedRoles={['admin']}><AdminReturns /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><AdminCategories /></ProtectedRoute>} />

        <Route path="*" element={<Landing />} />
      </Route>
    </Routes>
  )
}
