import { SupabaseDBClient } from '@/lib/supabase/types';
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
  supabase: SupabaseDBClient,
  tripId: string,
): Promise<{ data: Note[]; error: string | null }> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (error) {
    return { data: [], error: `Failed to fetch notes: ${error.message}` };
  }

  return { data: data.map(mapNote), error: null };
}

export async function createNote(
  supabase: SupabaseDBClient,
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
    return { data: null, error: `Failed to create note: ${error.message}` };
  }

  return { data: mapNote(data), error: null };
}

export async function updateNote(
  supabase: SupabaseDBClient,
  input: UpdateNoteInput,
): Promise<{ data: Note | null; error: string | null }> {
  const { data, error } = await supabase
    .from('notes')
    .update({ title: input.title, content: input.content })
    .eq('id', input.id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: `Failed to update note: ${error.message}` };
  }

  return { data: mapNote(data), error: null };
}

export async function deleteNote(
  supabase: SupabaseDBClient,
  noteId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('notes').delete().eq('id', noteId);

  if (error) {
    return { error: `Failed to delete note: ${error.message}` };
  }

  return { error: null };
}
