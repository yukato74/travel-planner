'use client';

import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useOfflineStatus } from '@/components/providers/OfflineStatusProvider';
import { formatDisplayDateRange } from '@/lib/date';
import { getCachedTripList, isLikelyOfflineError, setCachedTripList } from '@/lib/offline/cache';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { createTrip, listTrips } from '@/lib/trips/service';
import { TripSummary } from '@/lib/types/trip';

type DashboardClientProps = {
  userId: string;
};

export function DashboardClient({ userId }: DashboardClientProps) {
  const { isOffline } = useOfflineStatus();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isShareProtected, setIsShareProtected] = useState(true);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    if (isOffline) {
      setTrips(getCachedTripList(userId));
      setLoading(false);
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      setErrorMessage(error);
      return;
    }

    const result = await listTrips(client, userId);

    if (!result.error) {
      setTrips(result.data);
      setCachedTripList(userId, result.data);
      setLoading(false);
      return;
    }

    if (isLikelyOfflineError(result.error)) {
      setTrips(getCachedTripList(userId));
      setErrorMessage(null);
      setLoading(false);
      return;
    }

    setTrips(result.data);
    setErrorMessage(result.error);
    setLoading(false);
  }, [isOffline, userId]);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const handleCreateTrip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (isOffline) {
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

    setTrips((prev) => {
      const next = [result.data!, ...prev];
      setCachedTripList(userId, next);
      return next;
    });
    setTitle('');
    setStartDate('');
    setEndDate('');
    setIsShareProtected(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={0.75}>
          <Typography variant="h4" fontSize={{ xs: '1.7rem', md: '2rem' }} fontWeight={700}>
            My trips
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Trips you own and shared trips you joined are listed here.
          </Typography>
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack component="form" spacing={2} onSubmit={handleCreateTrip}>
            <Typography variant="h6" fontWeight={700}>
              Create a new trip
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Trip title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  fullWidth
                  required
                  disabled={isOffline}
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
                  disabled={isOffline}
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
                  disabled={isOffline}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isShareProtected}
                      onChange={(event) => setIsShareProtected(event.target.checked)}
                      disabled={isOffline}
                    />
                  }
                  label="Protected"
                />
              </Grid>
            </Grid>

            <Stack direction="row" justifyContent="flex-end">
              <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={saving || isOffline}>
                {saving ? 'Saving...' : 'Save trip'}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {loading ? (
          <Stack alignItems="center" py={6}>
            <CircularProgress />
          </Stack>
        ) : (
          <Grid container spacing={2}>
            {trips.map((trip) => (
              <Grid key={trip.id} size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Typography variant="h6" fontWeight={700}>
                        {trip.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDisplayDateRange(trip.startDate, trip.endDate)}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          icon={trip.isShareProtected ? <LockIcon /> : <PublicIcon />}
                          label={trip.isShareProtected ? 'Protected share' : 'Public share'}
                          size="small"
                          color={trip.isShareProtected ? 'warning' : 'success'}
                        />
                        <Chip label={`PW: ${trip.sharePassword}`} size="small" variant="outlined" />
                      </Stack>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button component={Link} href={`/trip/${trip.id}`} variant="outlined" size="small">
                      Open trip
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
