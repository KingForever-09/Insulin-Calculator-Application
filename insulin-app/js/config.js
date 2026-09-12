// ============================================================
// ใส่ค่าของท่านเองที่นี่ (ดูวิธีหาค่าใน README.md ขั้นตอนที่ 1)
// Paste your own project's values here — see README.md step 1.
// The "anon" key is safe to put in public front-end code; it can only
// do what your Row Level Security policies in schema.sql allow.
// ============================================================
const SUPABASE_URL = "https://zjukyzvstrrymfrxyryi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdWt5enZzdHJyeW1mcnh5cnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMDQwODAsImV4cCI6MjEwNDY4MDA4MH0.4TFdD7XzjYMQL0ed05V2VWtlHckop_3z4ijYUOHUjhk";

// Optional: only needed if you set up the food-photo recognition function
// (see README.md step 4). Leave as-is if you're not using that yet.
const FOOD_SCAN_FUNCTION_URL = ""; // e.g. "https://YOUR-PROJECT-REF.functions.supabase.co/food-scan"

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
