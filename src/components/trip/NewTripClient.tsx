'use client';

import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useOfflineStatus } from '@/components/providers/OfflineStatusProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { createTrip } from '@/lib/trips/service';

type NewTripClientProps = {
  userId: string;
};

export function NewTripClient({ userId }: NewTripClientProps) {
  const router = useRouter();
  const { isOffline } = useOfflineStatus();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isShareProtected, setIsShareProtected] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateTrip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (isOffline) {
      setErrorMessage('Trip creation is unavailable while offline.');
      return;
    }

    if (!title || !startDate || !endDate) {
      setErrorMessage('Please fill in title, start date, and end date.');
      return;
    }

    if (startDate > endDate) {
      setErrorMessage('Start date must be before or equal to end date.');
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    const result = await createTrip(client, {
      ownerUserId: userId,
      title,
      startDate,
      endDate,
      isShareProtected,
    });
    setSaving(false);

    if (result.error || !result.data) {
      setErrorMessage(result.error ?? 'Failed to create trip.');
      return;
    }

    router.push(`/trip/${result.data.id}`);
    router.refresh();
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        pt: { xs: 4, md: 6 },
        pb: { xs: 'calc(var(--new-trip-bottom-spacing) + env(safe-area-inset-bottom))', md: 6 },
      }}
    >
      <Stack spacing={3}>
        <Stack spacing={0.75}>
          <Typography variant="h4" fontSize={{ xs: '1.7rem', md: '2rem' }} fontWeight={700}>
            Create a new trip
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No trip found. Start by creating your first itinerary.
          </Typography>
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack component="form" spacing={2} onSubmit={handleCreateTrip}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Trip title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  fullWidth
                  required
                  disabled={saving || isOffline}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  label="Start date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                  required
                  disabled={saving || isOffline}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  label="End date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                  required
                  disabled={saving || isOffline}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isShareProtected}
                      onChange={(event) => setIsShareProtected(event.target.checked)}
                      disabled={saving || isOffline}
                    />
                  }
                  label="Protected"
                />
              </Grid>
            </Grid>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Stack direction="row" justifyContent="flex-end">
              <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={saving || isOffline}>
                {saving ? 'Saving...' : 'Save trip'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
