// Initialize Supabase Client
const supabaseUrl = 'https://kehyrpousvkmtnbmrvhz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlaHlycG91c3ZrbXRuYm1ydmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTkyNjQsImV4cCI6MjEwNzQ3NTI2NH0.j9P-Pm8IJqnRv_X4iToWJD8Jt7Ks1Par1ZlZSz5t7hU';
const resendKey = '';

window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
window.resendApiKey = resendKey;
