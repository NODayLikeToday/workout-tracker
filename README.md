# Workout Tracker

A mobile-first workout logging app built with vanilla JS + Supabase.

## Setup

### 1. Run the Supabase schema

1. Go to your [Supabase dashboard](https://supabase.com/dashboard)
2. Open your project → SQL Editor
3. Copy the contents of `schema.sql` and run it
4. You should see two new tables: `workout_sessions` and `exercise_sets`

### 2. Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `workout-tracker`)
2. Push all files in this folder to the repo root
3. Go to Settings → Pages → Source → select `main` branch, `/ (root)`
4. Your app will be live at `https://yourusername.github.io/workout-tracker`

That's it. No build step, no npm install.

## How to use

- **Today tab** — shows today's workout type and a Start button. Tap it to begin logging.
- **Log tab** — active workout session. Add exercises, log sets with reps/weight/effort, note duration and walk.
- **History tab** — browse past sessions, tap any to see full detail.
- **Progress tab** — pick any exercise to see a weight-over-time chart.

## Progressive overload rule

When you hit the top of your rep range cleanly on all sets, increase weight next session. The app will pre-fill the last weight you used for each exercise.

## Files

```
index.html          Main HTML shell
css/style.css       All styles (mobile-first dark theme)
js/data.js          Workout schedule + exercise lists
js/db.js            Supabase API client
js/app.js           App state, rendering, event handling
schema.sql          Supabase table definitions + RLS policies
```

## Security note

The Supabase anon key is visible in the JS source. This is acceptable for a personal tracker — RLS policies prevent bulk damage, but someone who finds your repo URL could read your data. Add Supabase Auth when/if that matters.
