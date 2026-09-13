import { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const LanguageContext = createContext(null)
export const LANGUAGES = [
  ['en', 'English'], ['hi', 'हिन्दी'], ['pa', 'ਪੰਜਾਬੀ'], ['gu', 'ગુજરાતી'],
  ['mr', 'मराठी'], ['bn', 'বাংলা'], ['ta', 'தமிழ்'], ['te', 'తెలుగు']
]

function readSavedLanguage() {
  const saved = localStorage.getItem('cc-language')
  if (saved) return saved
  const match = document.cookie.match(/(?:^|; )googtrans=\/en\/([^;]+)/)
  return match?.[1] || 'en'
}

function setGoogleTranslateCookie(lang) {
  // Google Translate reads this cookie on page load. Using the cookie is more
  // reliable than trying to dispatch a change event on its hidden select,
  // especially in React/Vite SPAs.
  document.cookie = `googtrans=/en/${lang}; path=/; max-age=31536000; SameSite=Lax`
}

function clearGoogleTranslateCookie() {
  document.cookie = 'googtrans=; path=/; max-age=0; SameSite=Lax'
}

function loadGoogleTranslate() {
  if (window.google?.translate?.TranslateElement) return Promise.resolve()
  return new Promise((resolve) => {
    const previous = window.googleTranslateElementInit
    window.googleTranslateElementInit = () => {
      try {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', autoDisplay: false, includedLanguages: 'en,hi,pa,gu,mr,bn,ta,te' },
          'google_translate_element'
        )
      } catch {}
      previous?.()
      resolve()
    }
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      script.onerror = () => resolve()
      document.head.appendChild(script)
    } else {
      setTimeout(resolve, 500)
    }
  })
}

function applyGoogleLanguage(lang) {
  const combo = document.querySelector('.goog-te-combo')
  if (!combo) return false
  combo.value = lang
  combo.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}

export function LanguageProvider({ children }) {
  const location = useLocation()
  const [language, setLanguageState] = useState(readSavedLanguage)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'craft-connect-translate-style'
    style.textContent = `
      /* Keep Google Translate's engine but hide every visual Google banner/control. */
      .goog-te-banner-frame,
      iframe.goog-te-banner-frame,
      body > .skiptranslate,
      body > iframe.goog-te-banner-frame,
      .goog-te-ftab,
      .goog-te-balloon-frame,
      .goog-tooltip{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;opacity:0!important;pointer-events:none!important}
      html,body{top:0!important;margin-top:0!important}
      body.translated-ltr, body.translated-rtl{top:0!important;margin-top:0!important}
      #google_translate_element{position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none}
      .goog-te-gadget{font-size:0!important}
      .goog-te-gadget img{display:none!important}
      .goog-text-highlight{background:transparent!important;box-shadow:none!important}
    `
    document.head.appendChild(style)

    const hideGoogleBanner = () => {
      document.querySelectorAll('.goog-te-banner-frame, iframe.goog-te-banner-frame, body > .skiptranslate, .goog-te-ftab').forEach((el) => {
        el.style.setProperty('display', 'none', 'important')
        el.style.setProperty('visibility', 'hidden', 'important')
        el.style.setProperty('height', '0px', 'important')
        el.style.setProperty('margin', '0', 'important')
      })
      document.body.style.setProperty('top', '0px', 'important')
      document.body.style.setProperty('margin-top', '0px', 'important')
    }
    hideGoogleBanner()
    const bannerObserver = new MutationObserver(hideGoogleBanner)
    bannerObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] })

    loadGoogleTranslate().then(() => {
      setReady(true)
      // Apply the saved language after the Google widget is ready.
      setTimeout(() => {
        if (language !== 'en') applyGoogleLanguage(language)
      }, 600)
    })

    return () => {
      bannerObserver.disconnect()
      style.remove()
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => {
      if (language !== 'en') applyGoogleLanguage(language)
    }, 400)
    return () => clearTimeout(timer)
  }, [language, location.pathname, ready])

  function setLanguage(lang) {
    setLanguageState(lang)
    localStorage.setItem('cc-language', lang)
    document.documentElement.lang = lang
    setGoogleTranslateCookie(lang)

    // Reloading lets Google Translate translate the entire newly-rendered SPA,
    // not just the Settings page. This also makes the choice work consistently
    // after route changes and on Netlify production builds.
    window.location.reload()
  }

  function resetLanguage() {
    localStorage.removeItem('cc-language')
    clearGoogleTranslateCookie()
    setLanguageState('en')
    document.documentElement.lang = 'en'
    window.location.reload()
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, resetLanguage, languages: LANGUAGES }}>
      <div id="google_translate_element" aria-hidden="true" />
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
