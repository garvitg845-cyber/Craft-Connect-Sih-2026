import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  const [artisanCheck, setArtisanCheck] = useState({ loading: false, complete: true })

  const isArtisanArea = profile?.role === 'artisan' && allowedRoles?.includes('artisan')
  const isProfilePage = location.pathname === '/artisan/profile'

  useEffect(() => {
    let active = true
    async function checkArtisanProfile() {
      if (!isArtisanArea || isProfilePage || !user) {
        if (active) setArtisanCheck({ loading: false, complete: true })
        return
      }
      setArtisanCheck({ loading: true, complete: false })
      const [{ data: artisan }, { data: personal }] = await Promise.all([
        supabase.from('artisans').select('business_name,craft_type,state,district,shop_photo_url').eq('id', user.id).maybeSingle(),
        supabase.from('profiles').select('full_name,contact_email,phone,avatar_url').eq('id', user.id).maybeSingle(),
      ])
      const complete = Boolean(
        personal?.full_name && personal?.contact_email && personal?.phone && personal?.avatar_url &&
        artisan?.business_name && artisan?.craft_type && artisan?.state && artisan?.district && artisan?.shop_photo_url
      )
      if (active) setArtisanCheck({ loading: false, complete })
    }
    checkArtisanProfile()
    return () => { active = false }
  }, [isArtisanArea, isProfilePage, user, location.pathname])

  if (loading) return <LoadingSpinner full />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <LoadingSpinner full />

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to={`/${profile.role}`} replace />
  }

  if (artisanCheck.loading) return <LoadingSpinner full />
  if (isArtisanArea && !isProfilePage && !artisanCheck.complete) {
    return <Navigate to="/artisan/profile" replace state={{ required: true }} />
  }

  return children
}
