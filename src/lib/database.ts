import { supabaseAdmin } from './supabase';
import { Short } from './youtube';

export async function saveShorts(shorts: Short[]) {
  if (shorts.length === 0) return;

  const { error } = await supabaseAdmin.from('shorts').upsert(shorts, {
    onConflict: 'video_id',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error('데이터베이스 저장 오류:', error);
    throw error;
  }

  console.log(`${shorts.length}개의 쇼츠가 저장되었습니다.`);
}

export async function getShorts(limit = 20, offset = 0) {
  const { data, error } = await supabaseAdmin
    .from('shorts')
    .select('*')
    .eq('is_embeddable', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function getActiveChannels() {
  const { data, error } = await supabaseAdmin.from('channels').select('*').eq('is_active', true);

  if (error) throw error;
  return data || [];
}

export async function getShortsStats() {
  const { count, error } = await supabaseAdmin
    .from('shorts')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return { totalShorts: count || 0 };
}
