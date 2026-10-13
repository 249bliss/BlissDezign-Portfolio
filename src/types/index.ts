export type Theme = 'light' | 'dark';

export interface Project {
  id: string;
  title: string;
  category: string;
  summary: string;
  thumbnail: string;
  slug: string;
  featured?: boolean;
  metrics?: { label: string; value: string }[];
  tags?: string[];
}

export interface NavigationItem {
  label: string;
  href: string;
  isExternal?: boolean;
}
