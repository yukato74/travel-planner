'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FormEvent, useEffect, useState } from 'react';
import { deleteTrip, updateTrip } from '@/lib/trips/service';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { TripSummary } from '@/lib/types/trip';

type TripInfoDialogProps = {
  open: boolean;
  trip: TripSummary;
  shareUrl: string;
  showShareInfo?: boolean;
  onClose: () => void;
  onUpdated: (trip: TripSummary) => void;
  onDeleted: (tripId: string) => void;
};

export function TripInfoDialog({ open, trip, shareUrl, showShareInfo = false, onClose, onUpdated, onDeleted }: TripInfoDialogProps) {
  const [title, setTitle] = useState(trip.title);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [isShareProtected, setIsShareProtected] = useState(trip.isShareProtected);
  const [sharePassword, setSharePassword] = useState(trip.sharePassword);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(trip.title);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setIsShareProtected(trip.isShareProtected);
    setSharePassword(trip.sharePassword);
    setErrorMessage(null);
    setConfirmDeleteOpen(false);
  }, [open, trip]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !startDate || !endDate) {
      setErrorMessage('Title, start date, and end date are required.');
      return;
    }

    if (startDate > endDate) {
      setErrorMessage('Start date must be before or equal to end date.');
      return;
    }

    const normalizedPassword = sharePassword.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalizedPassword)) {
      setErrorMessage('Share password must be 6 alphanumeric characters.');
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const result = await updateTrip(client, {
      id: trip.id,
      title: title.trim(),
      startDate,
      endDate,
      isShareProtected,
      sharePassword: normalizedPassword,
    });

    setSaving(false);

    if (result.error || !result.data) {
      setErrorMessage(result.error ?? 'Failed to update trip info.');
      return;
    }

    onUpdated(result.data);
    onClose();
  };

  const handleDeleteTrip = async () => {
    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const result = await deleteTrip(client, trip.id);
    setSaving(false);

    if (result.error) {
      setErrorMessage(result.error);
      setConfirmDeleteOpen(false);
      return;
    }

    setConfirmDeleteOpen(false);
    onClose();
    onDeleted(trip.id);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Edit trip info</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} mt={0.5}>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required fullWidth />

            <TextField
              label="Start date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              required
              fullWidth
            />

            <TextField
              label="End date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              required
              fullWidth
            />

            <FormControlLabel
              control={<Switch checked={isShareProtected} onChange={(event) => setIsShareProtected(event.target.checked)} />}
              label="Share protection"
            />

            {showShareInfo && (
              <>
                <TextField
                  label="Share password"
                  value={sharePassword}
                  onChange={(event) => setSharePassword(event.target.value.toUpperCase())}
                  inputProps={{ maxLength: 6 }}
                  helperText="6 alphanumeric characters"
                  required
                  fullWidth
                />

                <TextField label="Share URL" value={shareUrl} fullWidth size="small" slotProps={{ input: { readOnly: true } }} />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          {showShareInfo && (
            <Button color="error" onClick={() => setConfirmDeleteOpen(true)} disabled={saving} sx={{ mr: 'auto' }}>
              Delete trip
            </Button>
          )}
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Box>

      <Dialog open={showShareInfo && confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Delete trip</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Typography variant="body2">Are you sure you want to delete this trip?</Typography>
            <Typography variant="body2" color="text.secondary">
              This will also remove related places, flights, hotels, and notes.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleDeleteTrip} color="error" variant="contained" disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
