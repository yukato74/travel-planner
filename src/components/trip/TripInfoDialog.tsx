'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import { FormEvent, useEffect, useState } from 'react';
import { deleteTrip, leaveTrip, updateTrip } from '@/lib/trips/service';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { TripSummary } from '@/lib/types/trip';

type TripInfoDialogProps = {
  open: boolean;
  trip: TripSummary;
  shareUrl: string;
  showShareInfo?: boolean;
  viewerUserId: string | null;
  canDeleteTrip: boolean;
  canLeaveTrip: boolean;
  onClose: () => void;
  onUpdated: (trip: TripSummary) => void;
  onRemoved: (tripId: string) => void;
};

export function TripInfoDialog({
  open,
  trip,
  shareUrl,
  showShareInfo = false,
  viewerUserId,
  canDeleteTrip,
  canLeaveTrip,
  onClose,
  onUpdated,
  onRemoved,
}: TripInfoDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const mobileFormBoxSx = isMobile
    ? {
        minHeight: '100%',
        mt: 'env(safe-area-inset-top)',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }
    : undefined;
  const mobileFormDialogContentSx = isMobile ? { flex: 1, pb: 'calc(96px + env(safe-area-inset-bottom))' } : undefined;
  const mobileFormDialogActionsSx = isMobile
    ? {
        position: 'sticky',
        bottom: 0,
        zIndex: 1,
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: 2,
        pt: 1.25,
        pb: 'calc(12px + env(safe-area-inset-bottom))',
      }
    : undefined;
  const modalNeutralIconButtonSx = {
    color: 'text.secondary',
    bgcolor: 'action.hover',
    '&:hover': { bgcolor: 'action.selected' },
    '&:active': { bgcolor: 'action.focus' },
  };
  const modalDeleteIconButtonSx = {
    color: 'error.main',
    bgcolor: (muiTheme: any) => alpha(muiTheme.palette.error.main, 0.12),
    '&:hover': { bgcolor: (muiTheme: any) => alpha(muiTheme.palette.error.main, 0.18) },
    '&:active': { bgcolor: (muiTheme: any) => alpha(muiTheme.palette.error.main, 0.24) },
  };
  const [title, setTitle] = useState(trip.title);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [isShareProtected, setIsShareProtected] = useState(trip.isShareProtected);
  const [sharePassword, setSharePassword] = useState(trip.sharePassword);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [confirmActionOpen, setConfirmActionOpen] = useState(false);

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
    setCopiedMessage(null);
    setConfirmActionOpen(false);
  }, [open, trip]);

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedMessage(`${label} copied.`);
    } catch {
      setErrorMessage(`Failed to copy ${label.toLowerCase()}.`);
    }
  };

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
    if (!viewerUserId) {
      setErrorMessage('Failed to identify the current user.');
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const result = await deleteTrip(client, trip.id, viewerUserId);
    setSaving(false);

    if (result.error) {
      setErrorMessage(result.error);
      setConfirmActionOpen(false);
      return;
    }

    setConfirmActionOpen(false);
    onClose();
    onRemoved(trip.id);
  };

  const handleLeaveTrip = async () => {
    if (!viewerUserId) {
      setErrorMessage('Failed to identify the current user.');
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const result = await leaveTrip(client, trip.id, viewerUserId);
    setSaving(false);

    if (result.error) {
      setErrorMessage(result.error);
      setConfirmActionOpen(false);
      return;
    }

    setConfirmActionOpen(false);
    onClose();
    onRemoved(trip.id);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <Box component="form" onSubmit={handleSubmit} sx={mobileFormBoxSx}>
        <DialogTitle sx={{ position: 'relative' }}>
          Edit trip info
          <Stack direction="row" sx={{ position: 'absolute', top: 8, right: 'calc(8px + env(safe-area-inset-right))', gap: 1.5 }}>
            {(canDeleteTrip || canLeaveTrip) && (
              <IconButton
                aria-label={canDeleteTrip ? 'Delete trip' : 'Leave trip'}
                color="inherit"
                sx={modalDeleteIconButtonSx}
                onClick={() => setConfirmActionOpen(true)}
                disabled={saving}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton aria-label="Close" onClick={onClose} color="inherit" sx={modalNeutralIconButtonSx} disabled={saving}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={mobileFormDialogContentSx}>
          <Stack spacing={1.5} mt={0.5}>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {copiedMessage && <Alert severity="success">{copiedMessage}</Alert>}

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
                  inputProps={{ maxLength: 6 }}
                  slotProps={{
                    input: {
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton edge="end" aria-label="Copy code" onClick={() => void handleCopy(sharePassword, 'Code')}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  helperText="6 alphanumeric characters"
                  required
                  fullWidth
                />

                <TextField
                  label="Share URL"
                  value={shareUrl}
                  fullWidth
                  size="small"
                  slotProps={{
                    input: {
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton edge="end" aria-label="Copy URL" onClick={() => void handleCopy(shareUrl, 'URL')}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ ...mobileFormDialogActionsSx, justifyContent: 'center' }}>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Box>

      <Dialog open={confirmActionOpen} onClose={() => setConfirmActionOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{canDeleteTrip ? 'Delete trip' : 'Leave trip'}</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {canDeleteTrip ? (
              <>
                <Typography variant="body2">Are you sure you want to delete this trip?</Typography>
                <Typography variant="body2" color="text.secondary">
                  This will also remove related places, flights, hotels, and notes.
                </Typography>
              </>
            ) : (
              <Typography variant="body2">Are you sure you want to leave this trip?</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmActionOpen(false)} color="inherit" disabled={saving}>
            Cancel
          </Button>
          {canDeleteTrip ? (
            <Button onClick={handleDeleteTrip} color="error" variant="contained" disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          ) : (
            <Button onClick={handleLeaveTrip} color="error" variant="contained" disabled={saving}>
              {saving ? 'Leaving...' : 'Leave'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
