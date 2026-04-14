// Initialize Supabase Client
const supabaseUrl = 'https://tqryfaoihqblcgfnoqgc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcnlmYW9paHFibGNnZm5vcWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgzODAsImV4cCI6MjA5MTY2NDM4MH0.jJwCKbcKNuXoSDkLXPhhLcaa91M-5Eynjpdiom8HKMM';

window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
