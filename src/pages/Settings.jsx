import { useState } from 'react'
import { Globe2, Moon, Sun, Bell, ShieldCheck, RotateCcw, Languages } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function Settings() {
  const { language, setLanguage, resetLanguage, languages } = useLanguage()
  const [dark, setDark] = useState(() => localStorage.getItem('cc-theme') === 'dark')
  const [compact, setCompact] = useState(() => localStorage.getItem('cc-compact') === '1')
  const [notifications, setNotifications] = useState(() => localStorage.getItem('cc-notifications') !== '0')

  function toggleDark(value) {
    setDark(value); localStorage.setItem('cc-theme', value ? 'dark' : 'light')
    document.documentElement.classList.toggle('cc-dark', value)
  }
  function toggleCompact(value) {
    setCompact(value); localStorage.setItem('cc-compact', value ? '1' : '0')
    document.documentElement.classList.toggle('cc-compact', value)
  }
  function toggleNotifications(value) {
    setNotifications(value); localStorage.setItem('cc-notifications', value ? '1' : '0')
  }
  function reset() {
    localStorage.removeItem('cc-language'); localStorage.removeItem('cc-theme'); localStorage.removeItem('cc-compact'); localStorage.removeItem('cc-notifications')
    resetLanguage(); toggleDark(false); toggleCompact(false); toggleNotifications(true)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6"><div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center"><Globe2 className="w-6 h-6 text-craft-orange" /></div><div><h1 className="text-2xl font-bold">Settings</h1><p className="text-sm text-gray-500">Customize your Craft Connect experience.</p></div></div>

      <section className="card mb-5">
        <div className="flex items-start gap-3"><Languages className="w-5 h-5 text-craft-orange mt-1" /><div className="flex-1"><h2 className="font-semibold">Website Language</h2><p className="text-sm text-gray-500 mt-1">Change the language of the complete website. Your choice is saved on this device.</p><div className="grid sm:grid-cols-2 gap-3 mt-4">{languages.map(([code, name]) => <button key={code} onClick={() => setLanguage(code)} className={`p-3 rounded-xl border text-left transition ${language === code ? 'border-craft-orange bg-orange-50' : 'hover:border-craft-orange'}`}><span className="font-medium">{name}</span>{language === code && <span className="block text-xs text-craft-orange mt-1">Selected</span>}</button>)}</div></div></div>
      </section>

      <section className="card space-y-5">
        <SettingRow icon={dark ? Moon : Sun} title="Dark Mode" description="Use a darker interface for low-light browsing." value={dark} onChange={toggleDark} />
        <SettingRow icon={Bell} title="Notifications" description="Allow Craft Connect to show in-app notification preferences." value={notifications} onChange={toggleNotifications} />
        <SettingRow icon={ShieldCheck} title="Compact View" description="Reduce spacing for denser product and dashboard views." value={compact} onChange={toggleCompact} />
      </section>

      <button onClick={reset} className="btn-outline mt-5 inline-flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Reset Settings</button>
      <p className="text-xs text-gray-400 mt-4">Language translation uses the browser's Google Translate service. Product names, artisan stories and AI-generated content are translated dynamically when available.</p>
    </div>
  )
}

function SettingRow({ icon: Icon, title, description, value, onChange }) {
  return <div className="flex items-center justify-between gap-4"><div className="flex gap-3"><Icon className="w-5 h-5 text-tech-teal mt-0.5" /><div><h3 className="font-medium">{title}</h3><p className="text-sm text-gray-500">{description}</p></div></div><button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)} className={`relative w-12 h-7 rounded-full transition ${value ? 'bg-tech-teal' : 'bg-gray-300'}`}><span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition ${value ? 'left-6' : 'left-1'}`} /></button></div>
}
