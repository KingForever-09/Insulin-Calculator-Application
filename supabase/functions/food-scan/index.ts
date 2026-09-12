// ============================================================
// Optional: real food-photo recognition
// Deploy with: supabase functions deploy food-scan
// Set your food-recognition API key first:
//   supabase secrets set LOGMEAL_API_KEY=your_key_here
//
// This function receives a photo from the app, sends it to LogMeal's
// food recognition API (https://logmeal.com — has a free developer tier),
// and returns an estimated food name + carbohydrate grams.
// Swap the fetch() call below for Nutritionix, Google Cloud Vision, or
// any other provider you prefer — the shape it must return to the app is:
//   { "items": [ { "name": "...", "carbs_estimate": 45 }, ... ] }
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOGMEAL_API_KEY = Deno.env.get("LOGMEAL_API_KEY");

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    if (!LOGMEAL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOGMEAL_API_KEY not configured on the server" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const incomingForm = await req.formData();
    const imageFile = incomingForm.get("image");
    if (!imageFile) {
      return new Response(JSON.stringify({ error: "No image provided" }), { status: 400 });
    }

    // Step 1: send image to LogMeal for recognition
    const recognitionForm = new FormData();
    recognitionForm.append("image", imageFile);

    const recognitionResp = await fetch(
      "https://api.logmeal.com/v2/image/segmentation/complete",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${LOGMEAL_API_KEY}` },
        body: recognitionForm,
      }
    );
    const recognitionData = await recognitionResp.json();

    // Step 2: get nutritional info (carbs) for the recognized dish
    const imageId = recognitionData.imageId;
    const nutritionResp = await fetch(
      "https://api.logmeal.com/v2/nutrition/recipe/nutritionalInfo",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOGMEAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId }),
      }
    );
    const nutritionData = await nutritionResp.json();

    const items = (recognitionData.recognition_results || []).map((r: any, i: number) => ({
      name: r.name || "อาหารไม่ทราบชื่อ",
      carbs_estimate: Math.round(
        nutritionData?.nutritional_info?.totalNutrients?.CHOCDF?.quantity ?? 0
      ),
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
