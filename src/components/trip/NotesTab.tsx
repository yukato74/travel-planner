'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { createNote, deleteNote, listNotesByTripId, updateNote } from '@/lib/notes/service';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Note } from '@/lib/types/trip';

type NotesTabProps = {
  tripId: string;
};

export function NotesTab({ tripId }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      setLoading(false);
      return;
    }

    const result = await listNotesByTripId(client, tripId);
    setNotes(result.data);
    setErrorMessage(result.error);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setErrorMessage('title と content は必須です。');
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const result = await createNote(client, {
      tripId,
      title: title.trim(),
      content: content.trim(),
    });

    setSaving(false);

    if (result.error || !result.data) {
      setErrorMessage(result.error ?? 'メモの追加に失敗しました。');
      return;
    }

    setNotes((prev) => [...prev, result.data!]);
    setTitle('');
    setContent('');
  };

  const handleSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingNote) {
      return;
    }

    if (!editingNote.title.trim() || !editingNote.content.trim()) {
      setErrorMessage('title と content は必須です。');
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const result = await updateNote(client, {
      id: editingNote.id,
      title: editingNote.title.trim(),
      content: editingNote.content.trim(),
    });

    setSaving(false);

    if (result.error || !result.data) {
      setErrorMessage(result.error ?? 'メモの更新に失敗しました。');
      return;
    }

    setNotes((prev) => prev.map((item) => (item.id === result.data!.id ? result.data! : item)));
    setEditingNote(null);
  };

  const handleDelete = async () => {
    if (!deletingNote) {
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);

    const result = await deleteNote(client, deletingNote.id);
    setSaving(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setNotes((prev) => prev.filter((item) => item.id !== deletingNote.id));
    setDeletingNote(null);
  };

  if (loading) {
    return (
      <Stack alignItems="center" py={4}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box component="form" onSubmit={handleAdd}>
          <Stack spacing={1.25}>
            <Typography variant="h6" fontWeight={700}>Note を追加</Typography>
            <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required fullWidth size="small" />
            <TextField
              label="Content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              fullWidth
              size="small"
              multiline
              minRows={3}
            />
            <Stack direction="row" justifyContent="flex-end">
              <Button type="submit" size="small" variant="contained" disabled={saving}>
                {saving ? 'Saving...' : 'Add note'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h6" fontWeight={700}>Notes</Typography>
          <Divider />
          {notes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">まだメモがありません。</Typography>
          ) : (
            <List disablePadding>
              {notes.map((note) => (
                <ListItem key={note.id} disablePadding sx={{ py: 1 }}>
                  <Stack width="100%" spacing={0.5}>
                    <ListItemText primary={note.title} secondary={note.content} />
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button size="small" onClick={() => setEditingNote(note)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => setDeletingNote(note)}>Delete</Button>
                    </Stack>
                  </Stack>
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </Paper>

      <Dialog open={Boolean(editingNote)} onClose={() => setEditingNote(null)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSaveEdit}>
          <DialogTitle>Edit note</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} mt={0.5}>
              <TextField
                label="Title"
                value={editingNote?.title ?? ''}
                onChange={(event) =>
                  setEditingNote((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                }
                required
                fullWidth
              />
              <TextField
                label="Content"
                value={editingNote?.content ?? ''}
                onChange={(event) =>
                  setEditingNote((prev) => (prev ? { ...prev, content: event.target.value } : prev))
                }
                required
                fullWidth
                multiline
                minRows={4}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingNote(null)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deletingNote)} onClose={() => setDeletingNote(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete note</DialogTitle>
        <DialogContent>
          <Typography variant="body2">この note を削除します。よろしいですか？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingNote(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
