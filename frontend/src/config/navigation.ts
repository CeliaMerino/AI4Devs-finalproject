export type NavItem = {
  to: string;
  label: string;
  end?: boolean;
};

/** PRD §4 / README §1.3 — single sitemap for the unified sidebar (KAN-19). */
export const APP_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/book-tracker', label: 'Book Tracker' },
  { to: '/stats', label: 'Reading Stats' },
  { to: '/lists', label: 'Lists' },
  { to: '/goals', label: 'Goals' },
  { to: '/library', label: 'Library' },
  { to: '/recap', label: 'Recap / Insights' },
  { to: '/import-export', label: 'Import / Export' },
  { to: '/profile', label: 'Profile / Settings' },
];
