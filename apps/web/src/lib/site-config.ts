export const siteConfig = {
  name: 'Linkpop',
  tagline: 'Share everything in one link',
  description:
    'Create beautiful link-in-bio pages that showcase all your content in one place. Perfect for creators, influencers, and businesses.',
  url: 'https://linkpop.com',
  ogImage: '/og-image.jpg',
  navigation: [
    { name: 'Home', href: '/' },
    { name: 'How it works', href: '/how-it-works' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Resources', href: '/resources' },
    { name: 'Contact', href: '/contact' },
  ],
  cta: {
    primary: { text: 'Get Started', href: '/auth/register' },
    secondary: { text: 'Learn More', href: '/how-it-works' },
  },
  features: [
    {
      icon: 'Link',
      title: 'Unlimited Links',
      description: 'Share as many links as you want with our powerful link-in-bio solution.',
    },
    {
      icon: 'Palette',
      title: 'Custom Design',
      description: 'Choose from beautiful themes and customize your page to match your brand.',
    },
    {
      icon: 'Analytics',
      title: 'Detailed Analytics',
      description: 'Track clicks, referrers, and geographic data for all your links.',
    },
    {
      icon: 'Mobile',
      title: 'Mobile Optimized',
      description: 'Your Linkpop page looks great on every device with responsive design.',
    },
    {
      icon: 'Zap',
      title: 'Lightning Fast',
      description: 'Built on modern web technologies for blazing fast load times.',
    },
    {
      icon: 'Shield',
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security.',
    },
  ],
  howItWorks: [
    {
      step: '01',
      title: 'Create Your Account',
      description: 'Sign up for free and claim your unique Linkpop URL.',
    },
    {
      step: '02',
      title: 'Add Your Links',
      description: 'Connect all your social profiles, websites, and content in minutes.',
    },
    {
      step: '03',
      title: 'Customize Your Page',
      description: 'Choose themes, colors, and layouts that match your brand.',
    },
    {
      step: '04',
      title: 'Share & Track',
      description: 'Share your Linkpop everywhere and watch your engagement grow.',
    },
  ],
  testimonials: [
    {
      name: 'Sarah Johnson',
      role: 'Content Creator',
      content:
        'Linkpop transformed how I share my content. My engagement has increased by 300% since using it!',
      avatar: '/testimonials/sarah.jpg',
    },
    {
      name: 'Mike Chen',
      role: 'Small Business Owner',
      content:
        'Perfect for my business links. Easy to use and the analytics are incredibly detailed.',
      avatar: '/testimonials/mike.jpg',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Influencer',
      content:
        'I love how customizable my Linkpop page is. It truly represents my brand and personality.',
      avatar: '/testimonials/emily.jpg',
    },
  ],
  pricing: {
    free: {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '5 custom links',
        'Basic themes',
        'Click analytics',
        'Mobile responsive',
        'Community support',
      ],
    },
    pro: {
      name: 'Pro',
      price: '$9',
      period: 'per month',
      description: 'Best for creators and professionals',
      features: [
        'Unlimited links',
        'Premium themes',
        'Advanced analytics',
        'Custom domain',
        'Email support',
        'Remove Linkpop branding',
      ],
    },
    business: {
      name: 'Business',
      price: '$29',
      period: 'per month',
      description: 'For teams and businesses',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Advanced customization',
        'API access',
        'Priority support',
        'White-label solution',
      ],
    },
  },
  footer: {
    company: [
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Contact', href: '/contact' },
      { name: 'Status', href: '/status' },
      { name: 'Community', href: '/community' },
    ],
    legal: [
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
    ],
    social: [
      { name: 'Twitter', href: 'https://twitter.com/linkpop' },
      { name: 'Instagram', href: 'https://instagram.com/linkpop' },
      { name: 'LinkedIn', href: 'https://linkedin.com/company/linkpop' },
      { name: 'GitHub', href: 'https://github.com/linkpop' },
    ],
  },
};

export type SiteConfig = typeof siteConfig;
