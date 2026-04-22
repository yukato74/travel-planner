'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { useOfflineStatus } from '@/components/providers/OfflineStatusProvider';
import { PlacesSection } from '@/components/places/PlacesSection';
import { FlightsHotelsTab } from '@/components/trip/FlightsHotelsTab';
import { NotesTab } from '@/components/trip/NotesTab';
import { TripInfoDialog } from '@/components/trip/TripInfoDialog';
import { enumerateDateRange } from '@/lib/date';
import { getCachedTrip, getCachedTripList, isLikelyOfflineError, setCachedTrip, setLastOpenedTripId } from '@/lib/offline/cache';
import { getTripAccessStorageKey, requiresSharePassword, verifySharePassword } from '@/lib/share/access';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { addTripMember, buildTripShareUrl, getTripById, isInvitedTripMember, listTrips } from '@/lib/trips/service';
import { TripSummary } from '@/lib/types/trip';

type TripDetailViewProps = {
  tripId: string;
};

export function TripDetailView({ tripId }: TripDetailViewProps) {
  const router = useRouter();
  const { isOffline } = useOfflineStatus();
  const [trip, setTrip] = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [inputPassword, setInputPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockErrorMessage, setUnlockErrorMessage] = useState('');

  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [isInvited, setIsInvited] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const loadTripData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    setNotFound(false);

    if (isOffline) {
      const cachedTrip = getCachedTrip(tripId);
      if (cachedTrip) {
        setTrip(cachedTrip);
      } else {
        setNotFound(true);
      }
      setLoading(false);
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      setErrorMessage(error);
      return;
    }

    const tripResult = await getTripById(client, tripId);
    if (tripResult.error) {
      if (isLikelyOfflineError(tripResult.error)) {
        const cachedTrip = getCachedTrip(tripId);
        if (cachedTrip) {
          setTrip(cachedTrip);
          setLoading(false);
          return;
        }
      }
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
    setCachedTrip(tripResult.data);
    setLoading(false);
  }, [isOffline, tripId]);

  useEffect(() => {
    void loadTripData();
  }, [loadTripData]);

  useEffect(() => {
    const { client } = getSupabaseBrowserClient();
    if (!client) {
      return;
    }

    let mounted = true;

    const fetchUser = async () => {
      const result = await client.auth.getUser();
      if (mounted) {
        setViewerUserId(result.data.user?.id ?? null);
      }
    };

    void fetchUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setViewerUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const openInfoHandler = (event: Event) => {
      if (!trip) {
        return;
      }
      const customEvent = event as CustomEvent<{ tripId?: string }>;
      const targetTripId = customEvent.detail?.tripId;
      if (targetTripId && targetTripId !== trip.id) {
        return;
      }
      if (viewerUserId && (trip.ownerUserId === viewerUserId || isInvited)) {
        setIsInfoOpen(true);
      }
    };

    window.addEventListener('open-trip-info-dialog', openInfoHandler);
    return () => {
      window.removeEventListener('open-trip-info-dialog', openInfoHandler);
    };
  }, [trip, viewerUserId, isInvited]);

  useEffect(() => {
    if (!trip || !viewerUserId || (trip.ownerUserId !== viewerUserId && !isInvited)) {
      return;
    }

    const pendingTripId = sessionStorage.getItem('open-trip-info-id');
    if (pendingTripId === trip.id) {
      setIsInfoOpen(true);
      sessionStorage.removeItem('open-trip-info-id');
    }
  }, [trip, viewerUserId, isInvited]);

  useEffect(() => {
    const checkInvited = async () => {
      if (!trip || !viewerUserId || trip.ownerUserId === viewerUserId) {
        setIsInvited(false);
        return;
      }

      const { client, error } = getSupabaseBrowserClient();
      if (!client) {
        setErrorMessage(error);
        return;
      }

      const result = await isInvitedTripMember(client, trip.id, viewerUserId);
      if (result.error) {
        setErrorMessage(result.error);
        return;
      }
      setIsInvited(result.data);
    };

    void checkInvited();
  }, [trip, viewerUserId]);

  useEffect(() => {
    if (!trip) {
      return;
    }

    setLastOpenedTripId(trip.id);

    window.dispatchEvent(
      new CustomEvent('trip-context', {
        detail: { tripId: trip.id, title: trip.title },
      }),
    );
  }, [trip]);

  useEffect(() => {
    const syncUnlockedAccess = async () => {
      if (!trip) {
        return;
      }

      const isOwner = Boolean(viewerUserId && trip.ownerUserId === viewerUserId);
      if (isOwner) {
        setIsUnlocked(true);
        return;
      }

      if (!requiresSharePassword(trip)) {
        setIsUnlocked(true);
        return;
      }

      const accessKey = getTripAccessStorageKey(trip.id);
      const isGranted = localStorage.getItem(accessKey) === 'granted';
      setIsUnlocked(isGranted);

      if (!isGranted || !viewerUserId) {
        return;
      }

      const { client, error } = getSupabaseBrowserClient();
      if (!client) {
        setErrorMessage(error);
        return;
      }

      const saveResult = await addTripMember(client, trip.id, viewerUserId);
      if (saveResult.error) {
        setErrorMessage(saveResult.error);
        return;
      }
      setIsInvited(true);
    };

    void syncUnlockedAccess();
  }, [trip, viewerUserId]);

  const handleUnlock = async () => {
    if (!trip) {
      return;
    }
    if (isOffline) {
      setUnlockErrorMessage('Unlock is unavailable while offline.');
      return;
    }

    if (verifySharePassword(trip, inputPassword)) {
      setIsUnlocked(true);
      setUnlockErrorMessage('');
      localStorage.setItem(getTripAccessStorageKey(trip.id), 'granted');

      if (viewerUserId && trip.ownerUserId !== viewerUserId) {
        const { client, error } = getSupabaseBrowserClient();
        if (!client) {
          setErrorMessage(error);
          return;
        }

        const saveResult = await addTripMember(client, trip.id, viewerUserId);
        if (saveResult.error) {
          setErrorMessage(saveResult.error);
          return;
        }

        setIsInvited(true);
      }

      return;
    }

    setUnlockErrorMessage('Incorrect password. Please try again.');
  };

  const handleDeletedTrip = async (deletedTripId: string) => {
    if (isOffline) {
      router.push('/dashboard');
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      router.push('/dashboard');
      return;
    }

    if (!viewerUserId) {
      router.push('/dashboard');
      return;
    }

    const result = await listTrips(client, viewerUserId);
    if (result.error) {
      if (isLikelyOfflineError(result.error)) {
        const cachedTrips = getCachedTripList(viewerUserId);
        const nextCachedTrip = cachedTrips.find((item) => item.id !== deletedTripId) ?? null;
        if (nextCachedTrip) {
          router.push(`/trip/${nextCachedTrip.id}`);
          return;
        }
      }
      setErrorMessage(result.error);
      router.push('/dashboard');
      return;
    }

    const nextTrip = result.data.find((item) => item.id !== deletedTripId) ?? null;
    if (nextTrip) {
      router.push(`/trip/${nextTrip.id}`);
      return;
    }

    router.push('/dashboard');
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
            Trip not found
          </Typography>
          <Typography color="text.secondary">Check the URL or choose another trip from the menu.</Typography>
          <Button component={Link} href="/dashboard" variant="contained">
            Back to dashboard
          </Button>
        </Stack>
      </Container>
    );
  }

  if (!trip) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error">Failed to load trip.</Alert>
      </Container>
    );
  }

  const needsPassword = requiresSharePassword(trip);
  const dateOptions = enumerateDateRange(trip.startDate, trip.endDate);
  const isOwner = Boolean(viewerUserId && trip.ownerUserId === viewerUserId);
  const needsPasswordGate = needsPassword && !isOwner;
  const canEdit = !isOffline && (isOwner || isInvited || (needsPassword && isUnlocked));
  const shareUrl = buildTripShareUrl(trip.id);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {needsPasswordGate && !isUnlocked ? (
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2} maxWidth={420}>
              <Typography variant="h6" fontWeight={700}>
                Enter share password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This trip is protected. Enter the 6-character password to continue.
              </Typography>
              <TextField
                label="Share password"
                value={inputPassword}
                onChange={(event) => setInputPassword(event.target.value.toUpperCase())}
                inputProps={{ maxLength: 6 }}
                error={Boolean(unlockErrorMessage)}
                helperText={unlockErrorMessage || 'Use 6 alphanumeric characters'}
              />
              <Button variant="contained" onClick={handleUnlock} disabled={isOffline}>
                Unlock
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 42 }}
            >
              <Tab label="Itinerary" sx={{ minHeight: 42, py: 0.5 }} />
              <Tab label="Bookings" sx={{ minHeight: 42, py: 0.5 }} />
              <Tab label="Notes" sx={{ minHeight: 42, py: 0.5 }} />
            </Tabs>

            <Stack sx={{ pb: 0.5 }}>
              <Stack sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
                <PlacesSection tripId={trip.id} dateOptions={dateOptions} canEdit={canEdit} isOffline={isOffline} />
              </Stack>
              <Stack sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
                <FlightsHotelsTab
                  tripId={trip.id}
                  tripStartDate={trip.startDate}
                  tripEndDate={trip.endDate}
                  canEdit={canEdit}
                  isOffline={isOffline}
                />
              </Stack>
              {activeTab === 2 && <NotesTab tripId={trip.id} canEdit={canEdit} isOffline={isOffline} />}
            </Stack>
          </Stack>
        )}

        <TripInfoDialog
          open={isInfoOpen}
          trip={trip}
          shareUrl={shareUrl}
          showShareInfo={isOwner}
          viewerUserId={viewerUserId}
          canDeleteTrip={!isOffline && isOwner}
          canLeaveTrip={!isOffline && isInvited}
          canEdit={!isOffline && isOwner}
          onClose={() => setIsInfoOpen(false)}
          onUpdated={(updatedTrip) => {
            setTrip(updatedTrip);
            setCachedTrip(updatedTrip);
          }}
          onRemoved={handleDeletedTrip}
        />
      </Stack>
    </Container>
  );
}
