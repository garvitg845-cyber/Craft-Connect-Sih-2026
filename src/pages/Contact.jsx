import { Mail, Phone, UserRound, MessageCircle } from 'lucide-react'

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <p className="text-sm font-semibold text-craft-orange uppercase tracking-wider">Craft Connect</p>
        <h1 className="text-3xl md:text-4xl font-bold mt-2">Contact Us</h1>
        <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
          Have a question about Craft Connect, artisan verification, products or the platform? Get in touch directly.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
            <UserRound className="w-6 h-6 text-craft-orange" />
          </div>
          <h2 className="text-xl font-semibold">Garvit</h2>
          <p className="text-sm text-gray-500 mt-1">Craft Connect — Platform Contact</p>
        </div>

        <a href="tel:9350904929" className="card hover:border-craft-orange transition">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
            <Phone className="w-6 h-6 text-tech-teal" />
          </div>
          <h2 className="text-xl font-semibold">Phone</h2>
          <p className="text-gray-600 mt-1">9350904929</p>
          <p className="text-xs text-gray-400 mt-2">Tap to call</p>
        </a>

        <a href="mailto:garvitg845@gmail.com" className="card hover:border-craft-orange transition">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-craft-orange" />
          </div>
          <h2 className="text-xl font-semibold">Email</h2>
          <p className="text-gray-600 mt-1 break-all">garvitg845@gmail.com</p>
          <p className="text-xs text-gray-400 mt-2">Tap to send an email</p>
        </a>

        <div className="card">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-tech-teal" />
          </div>
          <h2 className="text-xl font-semibold">Support</h2>
          <p className="text-gray-600 mt-1">For artisan verification and platform support, please use the phone or email above.</p>
        </div>
      </div>
    </div>
  )
}
