// ============================================================
// ใส่ค่าของท่านเองที่นี่ (ดูวิธีหาค่าใน README.md ขั้นตอนที่ 1)
// Paste your own project's values here — see README.md step 1.
// The "anon" key is safe to put in public front-end code; it can only
// do what your Row Level Security policies in schema.sql allow.
// ============================================================
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

// Optional: only needed if you set up the food-photo recognition function
// (see README.md step 4). Leave as-is if you're not using that yet.
const FOOD_SCAN_FUNCTION_URL = ""; // e.g. "https://YOUR-PROJECT-REF.functions.supabase.co/food-scan"

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
