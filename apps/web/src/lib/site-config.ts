export const siteConfig = {
  name: 'Linkforest',
  tagline: 'Grow your links. Own your audience.',
  description:
    'Start free and grow into PRO. Create beautiful link-in-bio pages with real analytics — upgrade for 1-year retention.',
  url: 'https://linkforest.com',
  ogImage: '/og-image.jpg',
  navigation: [
    { name: 'Home', href: '/' },
    { name: 'How it works', href: '/how-it-works' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Resources', href: '/resources' },
    { name: 'Contact', href: '/contact' },
  ],
  cta: {
    primary: { text: 'Start Building', href: '/auth/register' },
    secondary: { text: 'Learn More', href: '/how-it-works' },
  },
  features: [
    {
      icon: 'BarChart3',
      title: 'Real Analytics',
      description:
        'Track every click with detailed analytics. Start free, then upgrade to PRO for 1-year history.',
    },
    {
      icon: 'Palette',
      title: 'Full Customization',
      description:
        'Complete design control with themes, colors, fonts, and custom CSS. Make it yours.',
    },
    {
      icon: 'Eye',
      title: 'No Branding',
      description:
        'Your page, your brand. No Linkforest watermarks or forced branding on any plan.',
    },
    {
      icon: 'DollarSign',
      title: 'Simple Pricing',
      description:
        'FREE ($0) for everything you need — upgrade to PRO ($9/mo) to keep 1-year analytics history.',
    },
    {
      icon: 'Zap',
      title: 'Lightning Fast',
      description: 'Built on Next.js 14 for blazing fast page loads. Your audience stays engaged.',
    },
    {
      icon: 'Shield',
      title: 'Secure & Private',
      description:
        'Enterprise-grade security. Your data is protected and never sold to third parties.',
    },
  ],
  howItWorks: [
    {
      step: '01',
      title: 'Create Your Account',
      description: 'Sign up and claim your unique Linkforest URL.',
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
      description: 'Share your Linkforest everywhere and watch your engagement grow.',
    },
  ],
  testimonials: [
    {
      name: 'Sarah Johnson',
      role: 'Content Creator',
      content:
        'Linkforest transformed how I share my content. My engagement has increased by 300% since using it!',
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
        'I love how customizable my Linkforest page is. It truly represents my brand and personality.',
      avatar: '/testimonials/emily.jpg',
    },
  ],
  pricing: {
    free: {
      name: 'FREE',
      price: '$0',
      period: 'per month',
      description: 'Everything you need to start — for free.',
      features: [
        'Unlimited links',
        'Copy fields',
        'Markdown pages',
        'Full customization',
        'Free subdomain (username.linkforest.com)',
        'Free custom domain',
        'QR codes',
        '7-day analytics retention',
        'Basic support',
      ],
    },
    pro: {
      name: 'PRO',
      price: '$9',
      period: 'per month',
      description: "Don't lose your funnel performance data — keep a full year of analytics.",
      features: [
        'Everything in FREE',
        '1-year analytics retention',
        'Custom JavaScript injection',
        'Built-in URL shortener',
        'Priority support',
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
      { name: 'Twitter', href: 'https://twitter.com/linkforest' },
      { name: 'Instagram', href: 'https://instagram.com/linkforest' },
      { name: 'LinkedIn', href: 'https://linkedin.com/company/linkforest' },
      { name: 'GitHub', href: 'https://github.com/linkforest' },
    ],
  },
};

export type SiteConfig = typeof siteConfig;
