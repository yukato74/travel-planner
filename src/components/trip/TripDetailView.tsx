'use client';

import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { TripSectionCard } from '@/components/trip/TripSectionCard';
import { getTripAccessStorageKey, requiresSharePassword, verifySharePassword } from '@/lib/share/access';
import { Trip } from '@/lib/types/trip';

type TripDetailViewProps = {
  trip: Trip;
  shareUrl: string;
};

export function TripDetailView({ trip, shareUrl }: TripDetailViewProps) {
  const needsPassword = useMemo(() => requiresSharePassword(trip), [trip]);
  const [inputPassword, setInputPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(!needsPassword);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!needsPassword) {
      return;
    }

    const accessKey = getTripAccessStorageKey(trip.id);
    const isGranted = sessionStorage.getItem(accessKey) === 'granted';
    if (isGranted) {
      setIsUnlocked(true);
    }
  }, [needsPassword, trip.id]);

  const handleUnlock = () => {
    if (verifySharePassword(trip, inputPassword)) {
      setIsUnlocked(true);
      setErrorMessage('');
      sessionStorage.setItem(getTripAccessStorageKey(trip.id), 'granted');
      return;
    }

    setErrorMessage('パスワードが一致しません。もう一度入力してください。');
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
              <Typography variant="h4" fontSize={{ xs: '1.6rem', md: '2rem' }} fontWeight={700}>
                {trip.title}
              </Typography>
              <Chip label={needsPassword ? '共有保護あり' : '共有保護なし'} color={needsPassword ? 'warning' : 'success'} />
            </Stack>

            <Typography variant="body1" color="text.secondary">
              旅行期間: {trip.startDate} - {trip.endDate}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trip.summary}
            </Typography>

            <Divider />

            <Stack spacing={1.5}>
              <TextField
                label="共有URL"
                value={shareUrl}
                fullWidth
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />

              {needsPassword && (
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <TextField
                    label="共有パスワード (6桁)"
                    value={showPassword ? trip.share.password ?? '' : '••••••'}
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
                error={Boolean(errorMessage)}
                helperText={errorMessage || '英数字6桁'}
              />
              <Button variant="contained" onClick={handleUnlock}>
                閲覧する
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TripSectionCard title="Itinerary" description="日程ごとの行動予定">
                <List disablePadding>
                  {trip.itinerary.map((item) => (
                    <ListItem key={item.id} disablePadding sx={{ pb: 1.25 }}>
                      <ListItemText primary={`${item.date} | ${item.title}`} secondary={item.description} />
                    </ListItem>
                  ))}
                </List>
              </TripSectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TripSectionCard title="Flights" description="フライト情報">
                <List disablePadding>
                  {trip.flights.map((flight) => (
                    <ListItem key={flight.id} disablePadding sx={{ pb: 1.25 }}>
                      <ListItemText
                        primary={`${flight.direction === 'outbound' ? '往路' : '復路'} | ${flight.airline} ${flight.flightNumber}`}
                        secondary={`${flight.departure} -> ${flight.arrival}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </TripSectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TripSectionCard title="Hotels" description="宿泊情報">
                <List disablePadding>
                  {trip.hotels.map((hotel) => (
                    <ListItem key={hotel.id} disablePadding sx={{ pb: 1.25 }}>
                      <ListItemText
                        primary={hotel.name}
                        secondary={`${hotel.checkIn} - ${hotel.checkOut} | ${hotel.address}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </TripSectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TripSectionCard
                title="Places"
                description="行きたい場所 (今後 dnd-kit で並び替え実装しやすいリスト構造)"
              >
                <List disablePadding>
                  {trip.places.map((place) => (
                    <ListItem
                      key={place.id}
                      disablePadding
                      sx={{
                        pb: 1,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                      }}
                    >
                      <IconButton size="small" edge="start" aria-label="並び替えハンドル" sx={{ mt: 0.25 }}>
                        <DragIndicatorIcon fontSize="small" />
                      </IconButton>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {place.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {place.area}
                          {place.memo ? ` | ${place.memo}` : ''}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </TripSectionCard>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TripSectionCard title="Notes" description="共通メモ">
                <List disablePadding>
                  {trip.notes.map((note) => (
                    <ListItem key={note.id} disablePadding sx={{ pb: 1.25 }}>
                      <ListItemText primary={note.content} />
                    </ListItem>
                  ))}
                </List>
              </TripSectionCard>
            </Grid>
          </Grid>
        )}

        <Alert severity="info">
          現在はダミーデータで表示しています。保存処理と Supabase 連携は後続ステップで置き換え可能です。
        </Alert>
      </Stack>
    </Container>
  );
}
