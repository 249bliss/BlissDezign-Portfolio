const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tqryfaoihqblcgfnoqgc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcnlmYW9paHFibGNnZm5vcWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgzODAsImV4cCI6MjA5MTY2NDM4MH0.jJwCKbcKNuXoSDkLXPhhLcaa91M-5Eynjpdiom8HKMM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("Checking Projects...");
    const { data: projects, error: pError } = await supabase.from('projects').select('id, title, is_case_study');
    if (pError) console.error("Projects Error:", pError);
    else console.log("Projects:", JSON.stringify(projects, null, 2));

    console.log("\nChecking Case Studies...");
    const { data: caseStudies, error: csError } = await supabase.from('case_studies').select('id, full_image_chunks');
    if (csError) console.error("Case Studies Error:", csError);
    else console.log("Case Studies:", JSON.stringify(caseStudies, null, 2));
}

checkData();
