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

    return data;
  } catch (err) {
    console.warn('Failed to connect to Supabase:', err);
    return [];
  }
}

export async function fetchCaseStudyFromSupabase(id: string): Promise<SupabaseCaseStudy | null> {
  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase case study fetch failed:', err);
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
    return data || [];
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
