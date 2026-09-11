# ตัวช่วยฉีดอินซูลิน — Insulin Dose Helper

A Thai-language, elderly-friendly web app for calculating mealtime insulin
doses (carb coverage + high-blood-glucose correction), with real sign-up/
login, a cloud database for profiles and dose history, and an optional
food-photo recognition feature.

**This is a calculator, not a medical device.** It applies formulas your
doctor gives you — it does not decide doses on its own. Keep the built-in
warnings in place if you customize this.

---

## What's in this folder

```
insulin-app/
├── index.html                          the whole app (all screens)
├── css/style.css                       styling
├── js/
│   ├── config.js                       ← you edit this (your keys go here)
│   └── app.js                          app logic (auth, calculator, db calls)
├── sql/schema.sql                      database tables + security rules
├── supabase/functions/food-scan/       optional: real food-photo recognition
│   └── index.ts
└── README.md                           this file
```

---

## Step 1 — Create your free Supabase project (real accounts + database)

Supabase gives you user sign-up/login and a database for free, and works
perfectly from a static site hosted on GitHub Pages.

1. Go to https://supabase.com → sign up → **New project**.
2. Pick a name, a database password (save it somewhere safe), and a region
   (choose one close to your users, e.g. Singapore for Thailand).
3. Once the project is ready, go to **SQL Editor** → **New query**, paste in
   the entire contents of `sql/schema.sql` from this folder, and click **Run**.
   This creates the `profiles` and `dose_logs` tables and locks each user
   to only see their own data.
4. Go to **Project Settings → API**. Copy:
   - **Project URL** → paste into `js/config.js` as `SUPABASE_URL`
   - **anon public** key → paste into `js/config.js` as `SUPABASE_ANON_KEY`
5. (Optional but recommended) Go to **Authentication → Providers → Email**
   and confirm "Confirm email" is on, so people verify their email before
   logging in. Under **Authentication → URL Configuration**, set the **Site
   URL** to your future GitHub Pages address (step 2) so password-reset
   links work correctly.

At this point, sign-up, login, "forgot password," profile saving, the
calculator, and cloud-synced history all work for real.

---

## Step 2 — Put it on the internet with GitHub Pages

1. Create a new GitHub repository (e.g. `insulin-helper`) — set it to Public.
2. Upload every file in this folder, keeping the same folder structure
   (`css/`, `js/`, `sql/`, `supabase/` and `index.html` all at the repo root).
3. Go to the repo's **Settings → Pages**. Under **Source**, choose the
   `main` branch and `/ (root)` folder → **Save**.
4. After a minute or two, your site is live at:
   `https://YOUR-GITHUB-USERNAME.github.io/insulin-helper`
5. Go back to Supabase → **Authentication → URL Configuration** and set the
   **Site URL** (and add it to **Redirect URLs**) to that exact address, so
   email confirmation and password-reset links send people back to your
   real site.

Your sign-up/login/calculator/history is now live for anyone.

---

## Step 3 — Try it end-to-end before sharing it

1. Open your GitHub Pages link.
2. Sign up with a real email you can check.
3. Confirm the email (check spam folder too).
4. Log in, fill in age / years diagnosed / doctor's numbers.
5. Run a calculation, save a dose, check it appears under "ประวัติการฉีด."
6. Log out, log back in on a different device/browser — your data should
   follow you now, because it's stored in Supabase, not the old
   device-only storage.

---

## Step 4 — (Optional) Real food-photo recognition

Automatic "point the camera, get the carbs" recognition needs a trained
image-recognition service — this isn't something to build from scratch
reliably, so the template here connects to **LogMeal**
(https://logmeal.com), which has a free developer tier. You can swap it for
Nutritionix, Google Cloud Vision + a nutrition lookup, or any other provider
— the function just needs to return `{ items: [{ name, carbs_estimate }] }`.

1. Install the Supabase CLI: https://supabase.com/docs/guides/cli
2. From this folder, run:
   ```
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   supabase secrets set LOGMEAL_API_KEY=your_logmeal_api_key
   supabase functions deploy food-scan
   ```
3. Supabase will print a function URL like
   `https://YOUR-PROJECT-REF.functions.supabase.co/food-scan`.
   Paste it into `js/config.js` as `FOOD_SCAN_FUNCTION_URL`.
4. Re-upload the updated `config.js` to GitHub. The camera button in the
   app will now analyze photos instead of just previewing them.

**Why this can't live directly in the GitHub Pages HTML:** API keys placed
in client-side code on a public site are visible to anyone who views the
page source. Routing the call through a Supabase Edge Function keeps your
LogMeal key private on the server side.

If you skip this step, the app still works fully — people search the
built-in Thai food list or type the carb count in themselves.

---

## Step 5 — Privacy (Thailand's PDPA)

This app stores names, ages, years since diagnosis, and blood glucose
readings — sensitive personal and health data under Thailand's Personal
Data Protection Act. Before real people use it:

- The sign-up screen already includes a consent checkbox in Thai — keep it,
  and consider expanding it into a full privacy policy page.
- Give users a way to ask for their data to be deleted (you can do this
  manually at first: delete their row in Supabase's Table Editor, and
  delete their user in **Authentication → Users**).
- Don't add analytics or ad trackers to a health app without separate,
  explicit consent.

---

## Step 6 — Have a clinician review it

Before anyone relies on this for real doses, have a doctor, endocrinologist,
or diabetes educator check the calculation logic in `js/app.js`
(`calculate()` function) and the wording of the safety warnings. This
matters more than anything else in this project.

---

## Customizing the Thai food list

Edit the `FOOD_DB` array near the top of `js/app.js`. Each entry is
`{name: 'ชื่ออาหาร', carbs: gramsOfCarb}`. Values here are general
estimates — swap in numbers from a Thai food composition database (e.g.
the Institute of Nutrition, Mahidol University's INMU food tables) if you
want more authoritative figures.
