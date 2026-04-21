'use client';

import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { createNote, deleteNote, listNotesByTripId, updateNote } from '@/lib/notes/service';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Note } from '@/lib/types/trip';

type NotesTabProps = {
  tripId: string;
  canEdit?: boolean;
};

export function NotesTab({ tripId, canEdit = true }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const previewNoteHistoryPushedRef = useRef(false);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handlePopState = () => {
      if (previewNoteHistoryPushedRef.current || previewNote) {
        previewNoteHistoryPushedRef.current = false;
        setPreviewNote(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [previewNote]);

  const openPreviewNote = (note: Note) => {
    setPreviewNote(note);
    if (typeof window !== 'undefined') {
      window.history.pushState({ ...window.history.state, previewModal: 'note' }, '');
      previewNoteHistoryPushedRef.current = true;
    }
  };

  const closePreviewNote = useCallback(() => {
    if (previewNoteHistoryPushedRef.current && typeof window !== 'undefined') {
      previewNoteHistoryPushedRef.current = false;
      window.history.back();
      return;
    }
    setPreviewNote(null);
  }, []);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setErrorMessage('Title and content are required.');
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
      setErrorMessage(result.error ?? 'Failed to add note.');
      return;
    }

    setNotes((prev) => [...prev, result.data!]);
    setTitle('');
    setContent('');
    setAddOpen(false);
  };

  const handleSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingNote) {
      return;
    }

    if (!editingNote.title.trim() || !editingNote.content.trim()) {
      setErrorMessage('Title and content are required.');
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
      setErrorMessage(result.error ?? 'Failed to update note.');
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
    <Stack spacing={1.5}>
      {!canEdit && <Alert severity="info">Read-only mode.</Alert>}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Typography variant="h6" fontWeight={700}>Notes</Typography>
            {canEdit && (
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setTitle('');
                  setContent('');
                  setAddOpen(true);
                }}
              >
                Add note
              </Button>
            )}
          </Stack>
          <Divider />

          {notes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No notes yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {notes.map((note) => (
                <Paper
                  key={note.id}
                  variant="outlined"
                  onClick={() => {
                    openPreviewNote(note);
                  }}
                  sx={{ p: 1.25, cursor: 'pointer' }}
                >
                  <Stack spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <Typography fontWeight={700}>{note.title}</Typography>
                      {canEdit && (
                        <IconButton
                          size="small"
                          aria-label="Delete"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeletingNote(note);
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Dialog
        open={Boolean(previewNote)}
        onClose={closePreviewNote}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        sx={{ '& .MuiDialog-paperFullScreen': { bgcolor: 'background.paper' } }}
      >
        <Box sx={{ minHeight: '100%', mt: 'env(safe-area-inset-top)', bgcolor: 'background.paper' }}>
        <DialogTitle sx={{ pb: 1, bgcolor: 'transparent' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <IconButton onClick={closePreviewNote} color="inherit" aria-label="Close">
              <CloseIcon fontSize="small" />
            </IconButton>
            {canEdit && previewNote && (
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  previewNoteHistoryPushedRef.current = false;
                  setEditingNote(previewNote);
                  setPreviewNote(null);
                }}
              >
                Edit
              </Button>
            )}
          </Stack>
          <Typography variant="h5" fontWeight={700} mt={0.5}>
            {previewNote?.title ?? ''}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={0.5}>
            <Divider />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
              {previewNote?.content}
            </Typography>
          </Stack>
        </DialogContent>
        </Box>
      </Dialog>

      <Dialog open={canEdit && addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <Box component="form" onSubmit={handleAdd}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add note</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} mt={0.5}>
              <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required fullWidth />
              <TextField
                label="Content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
                fullWidth
                multiline
                minRows={5}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Add note'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={canEdit && Boolean(editingNote)}
        onClose={() => setEditingNote(null)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        sx={{ '& .MuiDialog-paperFullScreen': { bgcolor: 'background.paper' } }}
      >
        <Box component="form" onSubmit={handleSaveEdit} sx={{ minHeight: '100%', mt: 'env(safe-area-inset-top)', bgcolor: 'background.paper' }}>
          <DialogTitle sx={{ fontWeight: 700, bgcolor: 'transparent' }}>Edit note</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} mt={0.5}>
              <TextField
                label="Title"
                value={editingNote?.title ?? ''}
                onChange={(event) => setEditingNote((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
                required
                fullWidth
              />
              <TextField
                label="Content"
                value={editingNote?.content ?? ''}
                onChange={(event) => setEditingNote((prev) => (prev ? { ...prev, content: event.target.value } : prev))}
                required
                fullWidth
                multiline
                minRows={5}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingNote(null)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={canEdit && Boolean(deletingNote)} onClose={() => setDeletingNote(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete note</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to delete this note?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingNote(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
