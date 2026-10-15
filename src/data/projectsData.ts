// ProjectData interface — used as the adapted shape for case study modals
// All actual project data comes from Supabase via the admin board
export interface ProjectData {
  id: string;
  title: string;
  client: string;
  year: string;
  category: string;
  categoryTag: string;
  role: string;
  duration: string;
  tools: string[];
  industry: string;
  liveUrl?: string;
  thumbnail: string;
  visuals: string[];
  metrics: { label: string; value: string }[];
  tagline: string;
  overview: string;
  challenge: string;
  solution: string;
  impact: string[];
  colorAccent: string;
  hasCaseStudy?: boolean;
}
