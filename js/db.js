const SUPABASE_URL = "https://xfbzyxcyzqtrqphqtwgy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYnp5eGN5enF0cnFwaHF0d2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzODA3MDUsImV4cCI6MjA5ODk1NjcwNX0.irmA5qZ-fz9Fy1lcIYR80RlsyEoYDEFpvgM4clwLbZU";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Prefer": "return=representation"
};

const DB = {
  async createSession(session) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/workout_sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify(session)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data[0];
  },

  async updateSession(id, updates) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/workout_sessions?id=eq.${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  async getSessions(limit = 30) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/workout_sessions?order=session_date.desc&limit=${limit}`,
      { headers }
    );
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  async getSessionWithSets(sessionId) {
    const [sessionRes, setsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/workout_sessions?id=eq.${sessionId}`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/exercise_sets?session_id=eq.${sessionId}&order=set_number.asc`, { headers })
    ]);
    const sessions = await sessionRes.json();
    const sets = await setsRes.json();
    return { session: sessions[0], sets };
  },

  async addSet(setData) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/exercise_sets`, {
      method: "POST",
      headers,
      body: JSON.stringify(setData)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data[0];
  },

  async updateSet(id, updates) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/exercise_sets?id=eq.${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  async deleteSet(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/exercise_sets?id=eq.${id}`, {
      method: "DELETE",
      headers
    });
    if (!res.ok) throw new Error(await res.text());
  },

  async getExerciseHistory(exerciseName, limit = 60) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/exercise_sets?exercise_name=eq.${encodeURIComponent(exerciseName)}&order=created_at.asc&limit=${limit}`,
      { headers }
    );
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  async getAllExerciseNames() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/exercise_sets?select=exercise_name`,
      { headers }
    );
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return [...new Set(data.map(d => d.exercise_name))].sort();
  },

  async getSessionSets(sessionId) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/exercise_sets?session_id=eq.${sessionId}&order=created_at.asc`,
      { headers }
    );
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  async deleteSession(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/workout_sessions?id=eq.${id}`, {
      method: "DELETE",
      headers
    });
    if (!res.ok) throw new Error(await res.text());
  }
};
