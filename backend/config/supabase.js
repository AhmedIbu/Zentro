// Supabase client + helpers for logging history and (optionally) caching files.
//
// If SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set, every helper becomes
// a no-op so the backend still works as a pure downloader without a database.

const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'media-cache';
const CACHE_ENABLED = process.env.ENABLE_CACHE === 'true';
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h signed URL + freshness window

const enabled = Boolean(SUPABASE_URL && SUPABASE_KEY);
const supabase = enabled
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  : null;

if (!enabled) {
  console.warn('[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — history & cache disabled.');
}

function cacheEnabled() {
  return enabled && CACHE_ENABLED;
}

/** Insert a row into the downloads table. Never throws. */
async function logDownload(row) {
  if (!enabled) return null;
  try {
    const { data, error } = await supabase
      .from('downloads')
      .insert({
        source_url: row.source_url,
        platform: row.platform,
        title: row.title || null,
        file_size: row.file_size || 0,
        quality: row.quality || 'best',
        status: row.status || 'completed',
        storage_path: row.storage_path || null,
      })
      .select()
      .single();
    if (error) {
      console.error('[supabase] logDownload error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[supabase] logDownload threw:', err.message);
    return null;
  }
}

/** Fetch recent download history, newest first. */
async function getHistory(limit = 50) {
  if (!enabled) return [];
  const { data, error } = await supabase
    .from('downloads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(Number(limit) || 50, 200));
  if (error) {
    console.error('[supabase] getHistory error:', error.message);
    return [];
  }
  return data || [];
}

/** Deterministic storage key for a url+quality+ext combination. */
function cacheKey(url, quality, ext) {
  const hash = crypto.createHash('sha1').update(url).digest('hex');
  return `${quality}/${hash}.${ext}`;
}

/** Upload a downloaded file to the media-cache bucket. Returns storage path or null. */
async function uploadToCache(filePath, key, contentType) {
  if (!cacheEnabled()) return null;
  try {
    const buffer = await fsp.readFile(filePath);
    const { error } = await supabase.storage.from(BUCKET).upload(key, buffer, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
    });
    if (error) {
      console.error('[supabase] uploadToCache error:', error.message);
      return null;
    }
    return key;
  } catch (err) {
    console.error('[supabase] uploadToCache threw:', err.message);
    return null;
  }
}

/**
 * Look for a recent (< 24h) cached download for this url+quality that still has
 * a storage_path. Returns the row or null.
 */
async function findCachedDownload(url, quality) {
  if (!cacheEnabled()) return null;
  const since = new Date(Date.now() - CACHE_TTL_SECONDS * 1000).toISOString();
  const { data, error } = await supabase
    .from('downloads')
    .select('*')
    .eq('source_url', url)
    .eq('quality', quality)
    .eq('status', 'completed')
    .not('storage_path', 'is', null)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[supabase] findCachedDownload error:', error.message);
    return null;
  }
  return data || null;
}

/** Create a temporary signed URL for a cached object. */
async function getSignedUrl(storagePath) {
  if (!enabled) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, CACHE_TTL_SECONDS);
  if (error) {
    console.error('[supabase] getSignedUrl error:', error.message);
    return null;
  }
  return data?.signedUrl || null;
}

module.exports = {
  supabase,
  enabled,
  cacheEnabled,
  BUCKET,
  logDownload,
  getHistory,
  cacheKey,
  uploadToCache,
  findCachedDownload,
  getSignedUrl,
};
