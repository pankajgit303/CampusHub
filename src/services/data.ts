import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
export type Table = keyof Database['public']['Tables'];
export type Row = Record<string, string | number | boolean | null | object> & { id: string };
export async function list(table: Table): Promise<Row[]> {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id')
      .range(offset, offset + 999);
    if (error) throw error;
    rows.push(...((data || []) as Row[]));
    if (!data || data.length < 1000) return rows;
  }
}
export async function save(table: Table, values: Record<string, unknown>, id?: string) {
  // Dynamic forms are validated from the resource definition before this boundary.
  const query = id
    ? supabase
        .from(table)
        .update(values as never)
        .eq('id', id)
    : supabase.from(table).insert(values as never);
  const { data, error } = await query.select('id').single();
  if (error) throw error;
  return data;
}
export async function remove(table: Table, id: string) {
  const { data, error } = await supabase.from(table).delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data?.length) throw new Error('The record was not deleted. Check your access and retry.');
}
export async function upload(bucket: string, userId: string, file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error('Files must be smaller than 10 MB.');
  const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}
export async function download(bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
  if (error) throw error;
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}
