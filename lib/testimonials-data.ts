export type LocalTestimonial = { name: string; role?: string; company?: string; quote: string; order: number }

export const testimonialsData: LocalTestimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'Director of E-commerce',
    company: 'RetailCo',
    quote:
      'The new checkout flow paid for itself in the first month. Our customers love how fast and simple it is.',
    order: 0,
  },
  {
    name: 'Dr. Michael Torres',
    role: 'CTO',
    company: 'MediHealth',
    quote:
      'Security and accessibility were both critical. The team delivered on both without compromise.',
    order: 1,
  },
  {
    name: 'James Park',
    role: 'Operations Manager',
    company: 'QuickShip',
    quote: "Our drivers actually love using this app. That's never happened before.",
    order: 2,
  },
]
