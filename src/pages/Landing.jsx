import { Link } from 'react-router-dom'
import { Sparkles, MapPin, ShieldCheck, TrendingUp } from 'lucide-react'

export default function Landing() {
  return (
    <div>
      <section className="bg-gradient-to-br from-craft-cream to-orange-50 px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
            Where India's <span className="text-craft-orange">Craft Heritage</span> meets{' '}
            <span className="text-tech-teal">AI-powered</span> commerce
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            Craft Connect helps traditional Indian artisans list, price and sell their work online —
            with AI doing the heavy lifting on listings and pricing, so artisans can focus on their craft.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/signup" className="btn-primary">Start Selling</Link>
            <Link to="/customer/products" className="btn-outline">Explore Crafts</Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-4 gap-6">
        {[
          { icon: Sparkles, title: 'AI Product Studio', desc: 'Speak or type in Hindi — AI drafts your listing, you approve every word.' },
          { icon: TrendingUp, title: 'Smart Pricing', desc: 'True cost-based pricing with transparent margin calculations.' },
          { icon: MapPin, title: 'India Craft Map', desc: 'Discover real artisans and traditional crafts by state.' },
          { icon: ShieldCheck, title: 'Verified Artisans', desc: 'Every artisan is reviewed and approved by our admin team.' },
        ].map((f) => (
          <div key={f.title} className="card text-center">
            <f.icon className="w-8 h-8 text-craft-orange mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800">{f.title}</h3>
            <p className="text-sm text-gray-500 mt-2">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold text-tech-teal mb-3">For Artisans</h2>
            <p className="text-gray-600">
              Get discovered by customers across India and beyond. Use AI to write compelling listings in
              English and Hindi, calculate fair prices from your real costs, track every order and return,
              and get a QR code for your own digital catalog to use at exhibitions and fairs.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-craft-orange mb-3">For Customers</h2>
            <p className="text-gray-600">
              Search naturally — "handmade eco-friendly gift under ₹1000" — and find authentic, verified
              handicrafts. Read each artisan's story, track your order from placed to delivered, and support
              real livelihoods with every purchase.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
