'use client';

import MenuIcon from '@mui/icons-material/Menu';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOfflineStatus } from '@/components/providers/OfflineStatusProvider';
import { formatDisplayDateRange } from '@/lib/date';
import { getCachedTripList, isLikelyOfflineError, setCachedTripList } from '@/lib/offline/cache';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { listTrips } from '@/lib/trips/service';
import { TripSummary } from '@/lib/types/trip';

function getCurrentTripId(pathname: string): string | null {
  const match = pathname.match(/^\/trip\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export function AppHeader() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { isOffline } = useOfflineStatus();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [viewingTripTitle, setViewingTripTitle] = useState<string | null>(null);
  const [viewingTripId, setViewingTripId] = useState<string | null>(null);

  const currentTripId = useMemo(() => getCurrentTripId(pathname), [pathname]);
  const currentTrip = useMemo(() => trips.find((trip) => trip.id === currentTripId) ?? null, [trips, currentTripId]);
  const currentTitle = currentTrip?.title ?? (currentTripId === viewingTripId ? viewingTripTitle : null) ?? 'Travel Planner';

  const loadTrips = useCallback(async (ownerId: string) => {
    if (isOffline) {
      setTrips(getCachedTripList(ownerId));
      return;
    }

    const { client } = getSupabaseBrowserClient();
    if (!client) {
      return;
    }

    setLoadingTrips(true);
    const result = await listTrips(client, ownerId);
    if (!result.error) {
      setTrips(result.data);
      setCachedTripList(ownerId, result.data);
      setLoadingTrips(false);
      return;
    }

    if (isLikelyOfflineError(result.error)) {
      setTrips(getCachedTripList(ownerId));
    } else {
      setTrips(result.data);
    }
    setLoadingTrips(false);
  }, [isOffline]);

  useEffect(() => {
    const { client } = getSupabaseBrowserClient();
    if (!client) {
      return;
    }

    let mounted = true;

    const init = async () => {
      const result = await client.auth.getUser();
      if (!mounted) {
        return;
      }

      const user = result.data.user;
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);

      if (user) {
        await loadTrips(user.id);
      } else {
        setTrips([]);
      }
    };

    void init();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);

      if (user) {
        void loadTrips(user.id);
      } else {
        setTrips([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadTrips]);

  useEffect(() => {
    const handleTripContext = (event: Event) => {
      const customEvent = event as CustomEvent<{ tripId: string; title: string }>;
      setViewingTripId(customEvent.detail.tripId);
      setViewingTripTitle(customEvent.detail.title);
    };

    window.addEventListener('trip-context', handleTripContext);
    return () => {
      window.removeEventListener('trip-context', handleTripContext);
    };
  }, []);

  const handleLogout = async () => {
    const { client } = getSupabaseBrowserClient();
    if (!client) {
      return;
    }

    await client.auth.signOut();
    setDrawerOpen(false);
    router.push('/login');
    router.refresh();
  };

  const openInfoDialogForTrip = (tripId: string) => {
    if (currentTripId === tripId) {
      window.dispatchEvent(
        new CustomEvent('open-trip-info-dialog', {
          detail: { tripId },
        }),
      );
    } else {
      sessionStorage.setItem('open-trip-info-id', tripId);
      router.push(`/trip/${tripId}`);
    }
    setDrawerOpen(false);
  };

  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          top: 0,
          zIndex: theme.zIndex.appBar,
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.24),
          bgcolor: '#fff',
          backgroundImage: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <IconButton aria-label="Open menu" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} noWrap>
              {currentTitle}
            </Typography>
          </Box>

          {isOffline && (
            <Chip
              label="Offline"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ mr: 0 }}
            />
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Stack sx={{ width: 300, height: '100%' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              Trips
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userEmail ?? 'Guest user'}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {loadingTrips ? (
              <Stack alignItems="center" py={4}>
                <CircularProgress size={24} />
              </Stack>
            ) : (
              <List disablePadding>
                {trips.map((trip) => (
                  <ListItem key={trip.id} disablePadding secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label={`Info for ${trip.title}`}
                      onClick={() => openInfoDialogForTrip(trip.id)}
                    >
                      <InfoOutlinedIcon />
                    </IconButton>
                  }>
                    <ListItemButton
                      selected={trip.id === currentTripId}
                      onClick={() => {
                        setDrawerOpen(false);
                        router.push(`/trip/${trip.id}`);
                      }}
                    >
                      <ListItemText
                        primary={trip.title}
                        secondary={formatDisplayDateRange(trip.startDate, trip.endDate)}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}

                {userId && trips.length === 0 && (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No trips yet. Create one from Dashboard.
                    </Typography>
                  </Box>
                )}
              </List>
            )}
          </Box>

          <Divider />

          <Stack spacing={1} sx={{ p: 2 }}>
            <Button
              component={Link}
              href="/trip/new"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setDrawerOpen(false)}
              disabled={isOffline}
            >
              New Trip
            </Button>

            {userId ? (
              <Button
                variant="text"
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ justifyContent: 'center', color: 'text.secondary' }}
              >
                Logout
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
}
