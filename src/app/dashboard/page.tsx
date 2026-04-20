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
import { FormEvent, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { createTrip, listTrips } from '@/lib/trips/service';
import { TripSummary } from '@/lib/types/trip';

export default function DashboardPage() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isShareProtected, setIsShareProtected] = useState(true);

  const loadTrips = async () => {
    setLoading(true);
    setErrorMessage(null);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      setErrorMessage(error);
      return;
    }

    const result = await listTrips(client);
    setTrips(result.data);
    setErrorMessage(result.error);
    setLoading(false);
  };

  useEffect(() => {
    void loadTrips();
  }, []);

  const handleCreateTrip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!title || !startDate || !endDate) {
      setErrorMessage('タイトル・開始日・終了日を入力してください。');
      return;
    }

    if (startDate > endDate) {
      setErrorMessage('開始日は終了日以前にしてください。');
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    const result = await createTrip(client, {
      title,
      startDate,
      endDate,
      isShareProtected,
    });
    setSaving(false);

    if (result.error || !result.data) {
      setErrorMessage(result.error ?? '旅行の作成に失敗しました。');
      return;
    }

    setTrips((prev) => [result.data!, ...prev]);
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
            自分の旅行一覧
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supabase から trips を取得しています。新規旅行作成時に共有パスワード(6桁)を自動生成します。
          </Typography>
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack component="form" spacing={2} onSubmit={handleCreateTrip}>
            <Typography variant="h6" fontWeight={700}>
              新しい旅行を作成
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="旅行タイトル"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  label="開始日"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  label="終了日"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isShareProtected}
                      onChange={(event) => setIsShareProtected(event.target.checked)}
                    />
                  }
                  label="共有保護"
                />
              </Grid>
            </Grid>

            <Stack direction="row" justifyContent="flex-end">
              <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={saving}>
                {saving ? '保存中...' : '保存する'}
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
                        {trip.startDate} - {trip.endDate}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          icon={trip.isShareProtected ? <LockIcon /> : <PublicIcon />}
                          label={trip.isShareProtected ? '共有保護あり' : '公開共有'}
                          size="small"
                          color={trip.isShareProtected ? 'warning' : 'success'}
                        />
                        <Chip label={`PW: ${trip.sharePassword}`} size="small" variant="outlined" />
                      </Stack>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button component={Link} href={`/trip/${trip.id}`} variant="outlined" size="small">
                      詳細を見る
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
