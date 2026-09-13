// Presentation-only sample data. It is never written to Supabase.
// Real Supabase data always wins; these samples are shown only when a page has no records.
export const DEMO_NOTICE = 'Demo preview — sample data shown because this section has no live records yet.'

export const DEMO_SALES = [
  { label: 'Aug 1', revenue: 8200, orders: 4, units: 11 },
  { label: 'Aug 8', revenue: 10400, orders: 5, units: 14 },
  { label: 'Aug 15', revenue: 12800, orders: 6, units: 17 },
  { label: 'Aug 22', revenue: 11600, orders: 5, units: 15 },
  { label: 'Aug 29', revenue: 15100, orders: 7, units: 20 },
  { label: 'Sep 5', revenue: 17400, orders: 8, units: 23 },
  { label: 'Sep 10', revenue: 13200, orders: 6, units: 18 },
]

export const DEMO_PRODUCTS = [
  { title: 'Handcrafted Bamboo Decorative Pot', revenue: 28600, units: 38, stock: 42 },
  { title: 'Traditional Handwoven Basket', revenue: 21900, units: 31, stock: 24 },
  { title: 'Blue Pottery Serving Bowl', revenue: 17400, units: 19, stock: 17 },
  { title: 'Block Printed Table Runner', revenue: 12900, units: 24, stock: 36 },
  { title: 'Terracotta Diya Set', revenue: 9800, units: 49, stock: 72 },
]

export const DEMO_ORDERS = [
  { id: 'CC-DEMO-4821', customer: 'Aarav Sharma', product: 'Handcrafted Bamboo Decorative Pot', quantity: 6, amount: 2400, status: 'delivered', date: '2026-09-08' },
  { id: 'CC-DEMO-4715', customer: 'Meera Kapoor', product: 'Traditional Handwoven Basket', quantity: 4, amount: 3200, status: 'shipped', date: '2026-09-05' },
  { id: 'CC-DEMO-4632', customer: 'Rohan Verma', product: 'Blue Pottery Serving Bowl', quantity: 3, amount: 2100, status: 'packed', date: '2026-09-01' },
  { id: 'CC-DEMO-4510', customer: 'Nisha Gupta', product: 'Block Printed Table Runner', quantity: 5, amount: 2750, status: 'confirmed', date: '2026-08-27' },
  { id: 'CC-DEMO-4398', customer: 'Kabir Singh', product: 'Terracotta Diya Set', quantity: 8, amount: 2000, status: 'delivered', date: '2026-08-19' },
  { id: 'CC-DEMO-4264', customer: 'Ananya Rao', product: 'Handcrafted Bamboo Decorative Pot', quantity: 10, amount: 4000, status: 'shipped', date: '2026-08-11' },
]

export const DEMO_REVIEWS = [
  { id: 'review-demo-1', product: 'Handcrafted Bamboo Decorative Pot', rating: 5, comment: 'Beautiful finishing and very good packaging.', date: '2026-09-07' },
  { id: 'review-demo-2', product: 'Traditional Handwoven Basket', rating: 4, comment: 'Lovely handmade work. Looks exactly like the listing.', date: '2026-09-02' },
  { id: 'review-demo-3', product: 'Block Printed Table Runner', rating: 5, comment: 'Excellent colours and craftsmanship.', date: '2026-08-25' },
]

export const DEMO_NOTIFICATIONS = [
  { id: 'notif-demo-1', title: 'New order received', body: 'A bulk buyer placed an order for Handcrafted Bamboo Decorative Pot.', date: '2026-09-08', is_read: false },
  { id: 'notif-demo-2', title: 'Product approved', body: 'Your Traditional Handwoven Basket listing passed catalog moderation.', date: '2026-09-04', is_read: false },
  { id: 'notif-demo-3', title: 'New customer review', body: 'A customer rated your Blue Pottery Serving Bowl 5 stars.', date: '2026-08-29', is_read: true },
]

export const DEMO_PAYMENTS = [
  { id: 'pay-demo-1', order: 'CC-DEMO-4821', customer: 'Aarav Sharma', provider: 'Demo UPI', amount: 2400, status: 'paid', date: '2026-09-08' },
  { id: 'pay-demo-2', order: 'CC-DEMO-4715', customer: 'Meera Kapoor', provider: 'Demo Card', amount: 3200, status: 'paid', date: '2026-09-05' },
  { id: 'pay-demo-3', order: 'CC-DEMO-4632', customer: 'Rohan Verma', provider: 'Demo NetBanking', amount: 2100, status: 'pending', date: '2026-09-01' },
]

export const DEMO_RETURNS = [
  { id: 'return-demo-1', product: 'Block Printed Table Runner', customer: 'Nisha Gupta', reason: 'Colour variation reported', status: 'under_review', date: '2026-09-03' },
  { id: 'return-demo-2', product: 'Terracotta Diya Set', customer: 'Kabir Singh', reason: 'Two pieces damaged in transit', status: 'approved', date: '2026-08-21' },
]

export const DEMO_CATEGORIES = ['Pottery & Ceramics', 'Bamboo & Cane', 'Textiles', 'Woodcraft', 'Metalcraft', 'Home Decor']
export const DEMO_REGIONS = [
  { id: 'region-demo-1', state_name: 'Rajasthan', famous_crafts: ['Blue Pottery', 'Block Printing'] },
  { id: 'region-demo-2', state_name: 'Assam', famous_crafts: ['Bamboo Craft', 'Muga Silk'] },
  { id: 'region-demo-3', state_name: 'Gujarat', famous_crafts: ['Ajrakh', 'Bandhani'] },
]

export const DEMO_USERS = [
  { id: 'user-demo-1', full_name: 'Aarav Sharma', role: 'customer', created_at: '2026-09-08' },
  { id: 'user-demo-2', full_name: 'Meera Kapoor', role: 'customer', created_at: '2026-09-05' },
  { id: 'user-demo-3', full_name: 'Rajasthan Heritage Crafts', role: 'artisan', created_at: '2026-08-29' },
  { id: 'user-demo-4', full_name: 'Bamboo Village Studio', role: 'artisan', created_at: '2026-08-21' },
  { id: 'user-demo-5', full_name: 'Craft Connect Admin', role: 'admin', created_at: '2026-08-01' },
]

export const DEMO_MODERATION = [
  { id: 'product-demo-1', title: 'Hand-painted Terracotta Vase', artisan: 'Rajasthan Heritage Crafts', price: 850 },
  { id: 'product-demo-2', title: 'Assam Bamboo Lamp', artisan: 'Bamboo Village Studio', price: 1250 },
  { id: 'product-demo-3', title: 'Ajrakh Cotton Dupatta', artisan: 'Heritage Textile Collective', price: 1650 },
]

export const DEMO_VERIFICATIONS = [
  { id: 'artisan-demo-1', name: 'Rajasthan Heritage Crafts', business: 'Rajasthan Heritage Crafts', craft: 'Blue Pottery & Block Printing', location: 'Jaipur, Rajasthan', status: 'pending' },
  { id: 'artisan-demo-2', name: 'Bamboo Village Studio', business: 'Bamboo Village Studio', craft: 'Bamboo & Cane Craft', location: 'Sivasagar, Assam', status: 'approved' },
  { id: 'artisan-demo-3', name: 'Heritage Textile Collective', business: 'Heritage Textile Collective', craft: 'Hand Block Printing', location: 'Kutch, Gujarat', status: 'pending' },
]
