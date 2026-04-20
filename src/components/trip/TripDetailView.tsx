'use client';

import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { TripSectionCard } from '@/components/trip/TripSectionCard';
import { enumerateDateRange } from '@/lib/date';
import { createNote, listNotesByTripId } from '@/lib/notes/service';
import { createPlace, listPlacesByTripId } from '@/lib/places/service';
import { getTripAccessStorageKey, requiresSharePassword, verifySharePassword } from '@/lib/share/access';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { buildTripShareUrl, getTripById } from '@/lib/trips/service';
import { Note, Place, TripSummary } from '@/lib/types/trip';

type TripDetailViewProps = {
  tripId: string;
};

export function TripDetailView({ tripId }: TripDetailViewProps) {
  const [trip, setTrip] = useState<TripSummary | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [inputPassword, setInputPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockErrorMessage, setUnlockErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [placeName, setPlaceName] = useState('');
  const [placeAddress, setPlaceAddress] = useState('');
  const [placeMemo, setPlaceMemo] = useState('');
  const [placeVisitDate, setPlaceVisitDate] = useState('');
  const [placeSaving, setPlaceSaving] = useState(false);

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  const dateOptions = useMemo(() => {
    if (!trip) {
      return [];
    }

    return enumerateDateRange(trip.startDate, trip.endDate);
  }, [trip]);

  const groupedPlaces = useMemo(() => {
    const groups = new Map<string, Place[]>();

    for (const day of dateOptions) {
      groups.set(day, []);
    }

    for (const place of places) {
      if (!groups.has(place.visitDate)) {
        continue;
      }
      groups.get(place.visitDate)!.push(place);
    }

    for (const day of dateOptions) {
      groups.get(day)!.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return groups;
  }, [dateOptions, places]);

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

    const [placesResult, notesResult] = await Promise.all([
      listPlacesByTripId(client, tripId),
      listNotesByTripId(client, tripId),
    ]);

    setTrip(tripResult.data);
    setPlaces(placesResult.data);
    setNotes(notesResult.data);

    const errors = [placesResult.error, notesResult.error].filter(Boolean);
    setErrorMessage(errors.length > 0 ? errors.join(' ') : null);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    void loadTripData();
  }, [loadTripData]);

  useEffect(() => {
    if (dateOptions.length > 0 && !placeVisitDate) {
      setPlaceVisitDate(dateOptions[0]);
    }
  }, [dateOptions, placeVisitDate]);

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

  const handleAddPlace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trip) {
      return;
    }

    if (!placeName || !placeVisitDate) {
      setErrorMessage('場所追加には visit_date と name が必要です。');
      return;
    }

    if (!dateOptions.includes(placeVisitDate)) {
      setErrorMessage('visit_date は旅行期間内の日付を選択してください。');
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setPlaceSaving(true);
    setErrorMessage(null);

    const currentMaxSortOrder = places
      .filter((place) => place.visitDate === placeVisitDate)
      .reduce((max, place) => Math.max(max, place.sortOrder), 0);

    const result = await createPlace(client, {
      tripId: trip.id,
      visitDate: placeVisitDate,
      name: placeName,
      address: placeAddress,
      memo: placeMemo,
      sortOrder: currentMaxSortOrder + 1,
    });

    setPlaceSaving(false);

    if (result.error || !result.data) {
      setErrorMessage(result.error ?? '場所の追加に失敗しました。');
      return;
    }

    setPlaces((prev) => [...prev, result.data!]);
    setPlaceName('');
    setPlaceAddress('');
    setPlaceMemo('');
  };

  const handleAddNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trip) {
      return;
    }

    if (!noteTitle || !noteContent) {
      setErrorMessage('メモ追加には title と content が必要です。');
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setNoteSaving(true);
    setErrorMessage(null);

    const result = await createNote(client, {
      tripId: trip.id,
      title: noteTitle,
      content: noteContent,
    });

    setNoteSaving(false);

    if (result.error || !result.data) {
      setErrorMessage(result.error ?? 'メモの追加に失敗しました。');
      return;
    }

    setNotes((prev) => [...prev, result.data!]);
    setNoteTitle('');
    setNoteContent('');
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

            <Divider />

            <Stack spacing={1.5}>
              <TextField
                label="共有URL"
                value={buildTripShareUrl(trip.id)}
                fullWidth
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />

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
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TripSectionCard title="Itinerary" description="日程ごとの行動予定">
                <EmptyState title="未実装" description="次のステップで itinerary テーブル連携を追加できます。" />
              </TripSectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TripSectionCard title="Flights" description="フライト情報">
                <EmptyState title="未実装" description="次のステップで flights テーブル連携を追加できます。" />
              </TripSectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TripSectionCard title="Hotels" description="宿泊情報">
                <EmptyState title="未実装" description="次のステップで hotels テーブル連携を追加できます。" />
              </TripSectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TripSectionCard
                title="Places"
                description="日付ごとに表示。今後 dnd-kit で並び替えしやすいハンドル付き構造"
              >
                <Stack spacing={2} component="form" onSubmit={handleAddPlace}>
                  <Grid container spacing={1.25}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="名前"
                        value={placeName}
                        onChange={(event) => setPlaceName(event.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        label="visit_date"
                        value={placeVisitDate}
                        onChange={(event) => setPlaceVisitDate(event.target.value)}
                        fullWidth
                        required
                      >
                        {dateOptions.map((date) => (
                          <MenuItem key={date} value={date}>
                            {date}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="住所"
                        value={placeAddress}
                        onChange={(event) => setPlaceAddress(event.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="メモ"
                        value={placeMemo}
                        onChange={(event) => setPlaceMemo(event.target.value)}
                        fullWidth
                        multiline
                        minRows={2}
                      />
                    </Grid>
                  </Grid>
                  <Stack direction="row" justifyContent="flex-end">
                    <Button type="submit" size="small" variant="contained" disabled={placeSaving}>
                      {placeSaving ? '追加中...' : '場所を追加'}
                    </Button>
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    {dateOptions.map((day) => {
                      const dayPlaces = groupedPlaces.get(day) ?? [];
                      return (
                        <Paper key={day} variant="outlined" sx={{ p: 1.5 }}>
                          <Stack spacing={1}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {day}
                            </Typography>
                            {dayPlaces.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                この日の場所はまだありません。
                              </Typography>
                            ) : (
                              <List disablePadding>
                                {dayPlaces.map((place) => (
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
                                        {place.address || '住所未設定'}
                                        {place.memo ? ` | ${place.memo}` : ''}
                                      </Typography>
                                    </Box>
                                  </ListItem>
                                ))}
                              </List>
                            )}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Stack>
              </TripSectionCard>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TripSectionCard title="Notes" description="共通メモ">
                <Stack spacing={2} component="form" onSubmit={handleAddNote}>
                  <TextField
                    label="タイトル"
                    value={noteTitle}
                    onChange={(event) => setNoteTitle(event.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="内容"
                    value={noteContent}
                    onChange={(event) => setNoteContent(event.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                    required
                  />
                  <Stack direction="row" justifyContent="flex-end">
                    <Button type="submit" size="small" variant="contained" disabled={noteSaving}>
                      {noteSaving ? '追加中...' : 'メモを追加'}
                    </Button>
                  </Stack>

                  <Divider />

                  {notes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      まだメモがありません。
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {notes.map((note) => (
                        <ListItem key={note.id} disablePadding sx={{ pb: 1.5 }}>
                          <ListItemText primary={note.title} secondary={note.content} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Stack>
              </TripSectionCard>
            </Grid>
          </Grid>
        )}

        <Alert severity="info">
          今回は trips / places / notes の一覧・追加まで実装済みです。編集・削除と DnD 本体は次ステップで追加できます。
        </Alert>
      </Stack>
    </Container>
  );
}
