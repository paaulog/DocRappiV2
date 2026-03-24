import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.__APP_CONFIG || {};
const SUPABASE_URL = config.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY || '';

let client = null;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}

export async function signInWithEmailPassword(email, password) {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, message: 'Supabase não configurado.' };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function getCurrentSessionUser() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function signOutFromSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function fetchRemoteContent(language, technology) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('docs_content')
    .select('content_json')
    .eq('language', language)
    .eq('technology', technology)
    .maybeSingle();

  if (error || !data?.content_json) return null;
  return data.content_json;
}

export async function saveRemoteContent(language, technology, content, userEmail = null) {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, message: 'Supabase não configurado.' };

  const payload = {
    language,
    technology,
    content_json: content,
    updated_by: userEmail,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('docs_content')
    .upsert(payload, { onConflict: 'language,technology' });

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
