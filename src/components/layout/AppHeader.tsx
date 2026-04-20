'use client';

import MenuIcon from '@mui/icons-material/Menu';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { listTrips } from '@/lib/trips/service';
import { TripSummary } from '@/lib/types/trip';

function getCurrentTripId(pathname: string): string | null {
  const match = pathname.match(/^\/trip\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

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

  const loadTrips = async (ownerId: string) => {
    const { client } = getSupabaseBrowserClient();
    if (!client) {
      return;
    }

    setLoadingTrips(true);
    const result = await listTrips(client, ownerId);
    setTrips(result.data);
    setLoadingTrips(false);
  };

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
  }, []);

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

  const openInfoDialog = () => {
    window.dispatchEvent(new Event('open-trip-info-dialog'));
    setDrawerOpen(false);
  };

  return (
    <>
      <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          <IconButton aria-label="Open menu" edge="start" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ ml: 1, flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} noWrap>
              {currentTitle}
            </Typography>
          </Box>

          {userId ? (
            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>
              {userEmail}
            </Typography>
          ) : (
            <Button href="/login" startIcon={<LoginIcon />} size="small">
              Login
            </Button>
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
                  <ListItemButton
                    key={trip.id}
                    selected={trip.id === currentTripId}
                    onClick={() => {
                      setDrawerOpen(false);
                      router.push(`/trip/${trip.id}`);
                    }}
                  >
                    <ListItemText
                      primary={trip.title}
                      secondary={`${trip.startDate} - ${trip.endDate}`}
                    />
                  </ListItemButton>
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
              variant="outlined"
              startIcon={<InfoOutlinedIcon />}
              disabled={!currentTrip || !userId}
              onClick={openInfoDialog}
            >
              Info
            </Button>

            {userId ? (
              <Button variant="contained" color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Button href="/login" variant="contained" startIcon={<LoginIcon />} onClick={() => setDrawerOpen(false)}>
                Login
              </Button>
            )}
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
}
