import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/db';
import { CreateNoteInput, Note, UpdateNoteInput } from '@/lib/types/trip';

function mapNote(row: Database['public']['Tables']['notes']['Row']): Note {
  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title,
    content: row.content,
  };
}

export async function listNotesByTripId(
  supabase: SupabaseClient<Database>,
  tripId: string,
): Promise<{ data: Note[]; error: string | null }> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (error) {
    return { data: [], error: `メモ一覧の取得に失敗しました: ${error.message}` };
  }

  return { data: data.map(mapNote), error: null };
}

export async function createNote(
  supabase: SupabaseClient<Database>,
  input: CreateNoteInput,
): Promise<{ data: Note | null; error: string | null }> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      trip_id: input.tripId,
      title: input.title,
      content: input.content,
    })
    .select('*')
    .single();

  if (error) {
    return { data: null, error: `メモの追加に失敗しました: ${error.message}` };
  }

  return { data: mapNote(data), error: null };
}

export async function updateNote(
  supabase: SupabaseClient<Database>,
  input: UpdateNoteInput,
): Promise<{ data: Note | null; error: string | null }> {
  const { data, error } = await supabase
    .from('notes')
    .update({ title: input.title, content: input.content })
    .eq('id', input.id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: `メモの更新に失敗しました: ${error.message}` };
  }

  return { data: mapNote(data), error: null };
}

export async function deleteNote(
  supabase: SupabaseClient<Database>,
  noteId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('notes').delete().eq('id', noteId);

  if (error) {
    return { error: `メモの削除に失敗しました: ${error.message}` };
  }

  return { error: null };
}
