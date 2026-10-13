import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kehyrpousvkmtnbmrvhz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlaHlycG91c3ZrbXRuYm1ydmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTkyNjQsImV4cCI6MjEwNzQ3NTI2NH0.j9P-Pm8IJqnRv_X4iToWJD8Jt7Ks1Par1ZlZSz5t7hU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SupabaseProject {
  id: string;
  title: string;
  subtitle: string | null;
  hero_image: string;
  is_case_study: boolean;
  layout_type?: string;
  category_tags?: string[];
  created_at?: string;
  is_featured?: boolean;
  display_order?: number;
  grid_layout?: string;
}

export interface SupabaseCaseStudy {
  id: string;
  role?: string;
  duration?: string;
  tools?: string;
  industry?: string;
  full_image_chunks?: string[];
  problem?: string | null;
  goal?: string | null;
  features?: any[];
  project_link?: string | null;
  created_at?: string;
}

export interface SupabaseReview {
  id: string;
  author_name: string;
  author_role: string;
  review_text: string;
  avatar_url: string;
  created_at?: string;
  display_order?: number;
}

export interface SupabaseMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export interface SupabaseSubscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface SupabasePost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  is_published: boolean;
  created_at?: string;
  published_at?: string;
  likes?: number;
}

export interface SupabaseAnalytics {
  id: string;
  created_at: string;
  page_path: string;
  event_type: string;
}

// ─── QUERY HELPERS ──────────────────────────────────────────────

const DUMMY_PROJECT_IDS = new Set([
  'neura',
  'wysahealth',
  'logistiq',
  'wayve - app store screenshot',
  'health-in-tech',
  'riki-ai',
  'swychr',
  'skin&soul',
  'dr portfolio',
  'vaulta wallet',
  'avenor landingpage',
  'wagestream redesign',
]);

const REVIEW_AVATAR_HEAL_MAP: Record<string, string> = {
  'Aaron Munga': '/assets/Aaron.webp',
  'はたけやま Hatake': '/assets/Hatake.jpg',
  'Hatake': '/assets/Hatake.jpg',
  'Favour Augustine': '/assets/favour.avif',
  'Rafael Ribeiro': '/assets/Trusted by team at/xoria.png',
  'Alexandre Erzadeoglu': '/assets/Trusted by team at/Frame 1487627493.png',
  'Boluwatife Ojo': '/assets/Trusted by team at/Tife Ojo Consults.png',
  'Kre8mind Team': '/assets/Trusted by team at/krea8 x banner new 2.png',
};

export async function fetchProjectsFromSupabase(): Promise<SupabaseProject[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) console.warn('Supabase query error:', error.message);
      return [];
    }

    // Filter out dummy/placeholder seeds and broken legacy storage links
    const authentic = data.filter((p) => {
      if (DUMMY_PROJECT_IDS.has(p.id)) return false;
      if (p.hero_image && p.hero_image.includes('tqryfaoihqblcgfnoqgc.supabase.co')) return false;
      return true;
    });

    return authentic;
  } catch (err) {
    console.warn('Failed to connect to Supabase:', err);
    return [];
  }
}

const CASE_STUDY_AUTHENTIC_CHUNKS: Record<string, string[]> = {
  'wagestream-redesign': [
    'https://res.cloudinary.com/adfxi8js/image/upload/v1791922454/case_studies/fwvmkps9ff9zdiejg35j.webp',
    'https://res.cloudinary.com/adfxi8js/image/upload/v1791922460/case_studies/fe2xox7f9snxj1rqenkl.webp',
    'https://res.cloudinary.com/adfxi8js/image/upload/v1791922465/case_studies/ijhhoaghbg9ngueop99b.webp',
    'https://res.cloudinary.com/adfxi8js/image/upload/v1791922470/case_studies/pr5ce9n3bsoxa1dohj7w.webp',
    'https://res.cloudinary.com/adfxi8js/image/upload/v1791922473/case_studies/idbfbofsd1eqrtkdqstd.webp',
  ],
  'avenor-landingpage': [
    'https://res.cloudinary.com/adfxi8js/image/upload/v1791922478/case_studies/qeabhbfivw2i7lj62rud.webp',
    'https://res.cloudinary.com/adfxi8js/image/upload/v1791922485/case_studies/nfgnuppdut71edbx0f6i.webp',
    'https://res.cloudinary.com/adfxi8js/image/upload/v1791922492/case_studies/wqd11ylqaxt05dabtpv6.webp',
    'https://res.cloudinary.com/adfxi8js/image/upload/v1791922493/case_studies/abzfr9179ybb5eymgktz.webp',
  ],
};

export async function fetchCaseStudyFromSupabase(id: string): Promise<SupabaseCaseStudy | null> {
  const authenticSlices = CASE_STUDY_AUTHENTIC_CHUNKS[id];
  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      if (authenticSlices && (!data.full_image_chunks || data.full_image_chunks.length < authenticSlices.length)) {
        data.full_image_chunks = authenticSlices;
      }
      return data;
    }
  } catch (err) {
    console.warn('Supabase case study fetch failed:', err);
  }

  if (authenticSlices) {
    return {
      id,
      role: 'Product Designer (UX UI)',
      duration: '2 weeks',
      tools: 'Figma, AI',
      industry: id.includes('wagestream') ? 'Fintech & Financial Wellness' : 'Real Estate',
      full_image_chunks: authenticSlices,
    };
  }

  return null;
}

export async function fetchReviewsFromSupabase(): Promise<SupabaseReview[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching reviews from Supabase:', error);
      return [];
    }
    return (data || []).map((r) => {
      const fallback = REVIEW_AVATAR_HEAL_MAP[r.author_name];
      let avatar = r.avatar_url;
      if (!avatar || avatar.includes('tqryfaoihqblcgfnoqgc.supabase.co')) {
        avatar = fallback || avatar;
      }
      return {
        ...r,
        avatar_url: avatar,
      };
    });
  } catch (err) {
    console.warn('Failed to fetch reviews:', err);
    return [];
  }
}


export async function fetchMessagesFromSupabase(): Promise<SupabaseMessage[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('Error fetching messages from Supabase:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch messages:', err);
    return [];
  }
}

export async function fetchSubscribersFromSupabase(): Promise<SupabaseSubscriber[]> {
  try {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Error fetching subscribers from Supabase:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch subscribers:', err);
    return [];
  }
}

export async function fetchPostsFromSupabase(): Promise<SupabasePost[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching posts from Supabase:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch posts:', err);
    return [];
  }
}

// ─── MUTATION HELPERS ───────────────────────────────────────────

export async function upsertProjectInSupabase(
  projectData: Partial<SupabaseProject> & { id: string },
  caseStudyData?: Partial<SupabaseCaseStudy> | null
): Promise<void> {
  // 1. Upsert Project
  const { error: projErr } = await supabase
    .from('projects')
    .upsert(projectData, { onConflict: 'id' });

  if (projErr) throw projErr;

  // 2. Upsert Case Study if enabled
  if (projectData.is_case_study && caseStudyData) {
    const csPayload = {
      ...caseStudyData,
      id: projectData.id,
    };
    const { error: csErr } = await supabase
      .from('case_studies')
      .upsert(csPayload, { onConflict: 'id' });

    if (csErr) throw csErr;
  }
}

export async function deleteProjectInSupabase(id: string): Promise<void> {
  // 1. Delete associated case study if exists
  await supabase.from('case_studies').delete().eq('id', id);

  // 2. Delete main project
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertReviewInSupabase(review: Partial<SupabaseReview>): Promise<void> {
  const { error } = await supabase.from('reviews').upsert(review);
  if (error) throw error;
}

export async function deleteReviewInSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertPostInSupabase(post: Partial<SupabasePost>): Promise<void> {
  const { error } = await supabase.from('posts').upsert(post);
  if (error) throw error;
}

export async function deletePostInSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

// ─── ASSET UPLOADER (POWERED BY CLOUDINARY CDN) ─────────────────
import { uploadAssetToCloudinary, sliceAndUploadCaseStudyImage } from './cloudinaryClient';
export { uploadAssetToCloudinary, sliceAndUploadCaseStudyImage };

export async function uploadAssetToSupabase(file: File, folder = 'projects'): Promise<string> {
  if (!file) throw new Error('No file selected for upload.');
  // Direct upload to Cloudinary (adfxi8js / bliss_uploads)
  return await uploadAssetToCloudinary(file, folder);
}
