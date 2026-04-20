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
import { FormEvent, useEffect, useState } from 'react';
import { updateTrip } from '@/lib/trips/service';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { TripSummary } from '@/lib/types/trip';

type TripInfoDialogProps = {
  open: boolean;
  trip: TripSummary;
  shareUrl: string;
  onClose: () => void;
  onUpdated: (trip: TripSummary) => void;
};

export function TripInfoDialog({ open, trip, shareUrl, onClose, onUpdated }: TripInfoDialogProps) {
  const [title, setTitle] = useState(trip.title);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [isShareProtected, setIsShareProtected] = useState(trip.isShareProtected);
  const [sharePassword, setSharePassword] = useState(trip.sharePassword);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  }, [open, trip]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !startDate || !endDate) {
      setErrorMessage('title / start_date / end_date は必須です。');
      return;
    }

    if (startDate > endDate) {
      setErrorMessage('start_date は end_date 以前にしてください。');
      return;
    }

    const normalizedPassword = sharePassword.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalizedPassword)) {
      setErrorMessage('share_password は英数字6桁で入力してください。');
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
      setErrorMessage(result.error ?? '旅行情報の更新に失敗しました。');
      return;
    }

    onUpdated(result.data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Trip Info を編集</DialogTitle>
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
              label="is_share_protected"
            />

            <TextField
              label="Share password (6桁英数字)"
              value={sharePassword}
              onChange={(event) => setSharePassword(event.target.value.toUpperCase())}
              inputProps={{ maxLength: 6 }}
              required
              fullWidth
            />

            <TextField label="Share URL" value={shareUrl} fullWidth size="small" slotProps={{ input: { readOnly: true } }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
