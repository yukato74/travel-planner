'use client';

import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { PlacesSection } from '@/components/places/PlacesSection';
import { FlightsHotelsTab } from '@/components/trip/FlightsHotelsTab';
import { NotesTab } from '@/components/trip/NotesTab';
import { TripInfoDialog } from '@/components/trip/TripInfoDialog';
import { enumerateDateRange } from '@/lib/date';
import { getTripAccessStorageKey, requiresSharePassword, verifySharePassword } from '@/lib/share/access';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { buildTripShareUrl, getTripById } from '@/lib/trips/service';
import { TripSummary } from '@/lib/types/trip';

type TripDetailViewProps = {
  tripId: string;
};

export function TripDetailView({ tripId }: TripDetailViewProps) {
  const [trip, setTrip] = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [inputPassword, setInputPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockErrorMessage, setUnlockErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const [activeTab, setActiveTab] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const loadTripData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    setNotFound(false);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      setErrorMessage(error);
      return;
    }

    const tripResult = await getTripById(client, tripId);
    if (tripResult.error) {
      setLoading(false);
      setErrorMessage(tripResult.error);
      return;
    }

    if (!tripResult.data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setTrip(tripResult.data);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    void loadTripData();
  }, [loadTripData]);

  useEffect(() => {
    const { client } = getSupabaseBrowserClient();
    if (!client) {
      setCanEdit(false);
      return;
    }

    let mounted = true;

    const fetchUser = async () => {
      const result = await client.auth.getUser();
      if (mounted) {
        setCanEdit(Boolean(result.data.user));
      }
    };

    void fetchUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setCanEdit(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!trip) {
      return;
    }

    if (!requiresSharePassword(trip)) {
      setIsUnlocked(true);
      return;
    }

    const accessKey = getTripAccessStorageKey(trip.id);
    const isGranted = sessionStorage.getItem(accessKey) === 'granted';
    setIsUnlocked(isGranted);
  }, [trip]);

  const handleUnlock = () => {
    if (!trip) {
      return;
    }

    if (verifySharePassword(trip, inputPassword)) {
      setIsUnlocked(true);
      setUnlockErrorMessage('');
      sessionStorage.setItem(getTripAccessStorageKey(trip.id), 'granted');
      return;
    }

    setUnlockErrorMessage('パスワードが一致しません。もう一度入力してください。');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack alignItems="center" py={6}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>
            指定された旅行が見つかりません
          </Typography>
          <Typography color="text.secondary">URLを確認するか、ダッシュボードから旅行を選択してください。</Typography>
          <Button component={Link} href="/dashboard" variant="contained">
            ダッシュボードへ戻る
          </Button>
        </Stack>
      </Container>
    );
  }

  if (!trip) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error">旅行データを読み込めませんでした。</Alert>
      </Container>
    );
  }

  const needsPassword = requiresSharePassword(trip);
  const dateOptions = enumerateDateRange(trip.startDate, trip.endDate);
  const shareUrl = buildTripShareUrl(trip.id);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={1}>
              <Typography variant="h4" fontSize={{ xs: '1.6rem', md: '2rem' }} fontWeight={700}>
                {trip.title}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip label={needsPassword ? '共有保護あり' : '共有保護なし'} color={needsPassword ? 'warning' : 'success'} />
                <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => setIsInfoOpen(true)} disabled={!canEdit}>
                  Info
                </Button>
              </Stack>
            </Stack>

            <Typography variant="body1" color="text.secondary">
              旅行期間: {trip.startDate} - {trip.endDate}
            </Typography>

            <Divider />

            <Stack spacing={1.5}>
              <TextField label="共有URL" value={shareUrl} fullWidth size="small" slotProps={{ input: { readOnly: true } }} />

              {needsPassword && (
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <TextField
                    label="共有パスワード (6桁)"
                    value={showPassword ? trip.sharePassword : '••••••'}
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ maxWidth: 280 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowPassword((prev) => !prev)}
                    startIcon={showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  >
                    {showPassword ? '非表示にする' : '表示する'}
                  </Button>
                </Stack>
              )}
            </Stack>
          </Stack>
        </Paper>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {needsPassword && !isUnlocked ? (
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2} maxWidth={420}>
              <Typography variant="h6" fontWeight={700}>
                共有パスワードの入力
              </Typography>
              <Typography variant="body2" color="text.secondary">
                この旅行プランは保護されています。URL発行者から受け取った6桁パスワードを入力してください。
              </Typography>
              <TextField
                label="6桁パスワード"
                value={inputPassword}
                onChange={(event) => setInputPassword(event.target.value.toUpperCase())}
                inputProps={{ maxLength: 6 }}
                error={Boolean(unlockErrorMessage)}
                helperText={unlockErrorMessage || '英数字6桁'}
              />
              <Button variant="contained" onClick={handleUnlock}>
                閲覧する
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Tab label="Itinerary" />
              <Tab label="Flights & Hotels" />
              <Tab label="Notes" />
            </Tabs>

            <Stack sx={{ p: { xs: 1.5, md: 2 } }}>
              {activeTab === 0 && <PlacesSection tripId={trip.id} dateOptions={dateOptions} canEdit={canEdit} />}
              {activeTab === 1 && <FlightsHotelsTab tripId={trip.id} canEdit={canEdit} />}
              {activeTab === 2 && <NotesTab tripId={trip.id} canEdit={canEdit} />}
            </Stack>
          </Paper>
        )}

        <TripInfoDialog
          open={isInfoOpen}
          trip={trip}
          shareUrl={shareUrl}
          onClose={() => setIsInfoOpen(false)}
          onUpdated={(updatedTrip) => setTrip(updatedTrip)}
        />
      </Stack>
    </Container>
  );
}
