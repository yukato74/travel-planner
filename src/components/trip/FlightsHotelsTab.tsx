'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { createFlight, deleteFlight, listFlightsByTripId, updateFlight } from '@/lib/flights/service';
import { createHotel, deleteHotel, listHotelsByTripId, updateHotel } from '@/lib/hotels/service';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Flight, Hotel } from '@/lib/types/trip';

type FlightsHotelsTabProps = {
  tripId: string;
  canEdit?: boolean;
};

export function FlightsHotelsTab({ tripId, canEdit = true }: FlightsHotelsTabProps) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [addFlight, setAddFlight] = useState({
    airline: '',
    flightNumber: '',
    departureAirport: '',
    arrivalAirport: '',
    departureTime: '',
    arrivalTime: '',
    memo: '',
  });

  const [addHotel, setAddHotel] = useState({
    name: '',
    address: '',
    checkInDate: '',
    checkOutDate: '',
    memo: '',
  });

  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [deletingFlight, setDeletingFlight] = useState<Flight | null>(null);
  const [deletingHotel, setDeletingHotel] = useState<Hotel | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      setLoading(false);
      return;
    }

    const [flightResult, hotelResult] = await Promise.all([
      listFlightsByTripId(client, tripId),
      listHotelsByTripId(client, tripId),
    ]);

    setFlights(flightResult.data);
    setHotels(hotelResult.data);
    setLoading(false);

    const errors = [flightResult.error, hotelResult.error].filter(Boolean);
    setErrorMessage(errors.length > 0 ? errors.join(' ') : null);
  }, [tripId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAddFlight = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!addFlight.airline || !addFlight.flightNumber || !addFlight.departureTime || !addFlight.arrivalTime) {
      setErrorMessage('Please fill in the required flight fields.');
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const result = await createFlight(client, {
      tripId,
      airline: addFlight.airline.trim(),
      flightNumber: addFlight.flightNumber.trim(),
      departureAirport: addFlight.departureAirport.trim(),
      arrivalAirport: addFlight.arrivalAirport.trim(),
      departureTime: addFlight.departureTime,
      arrivalTime: addFlight.arrivalTime,
      memo: addFlight.memo.trim(),
    });

    setSaving(false);
    if (result.error || !result.data) {
      setErrorMessage(result.error ?? 'Failed to add flight.');
      return;
    }

    setFlights((prev) => [...prev, result.data!].sort((a, b) => a.departureTime.localeCompare(b.departureTime)));
    setAddFlight({
      airline: '',
      flightNumber: '',
      departureAirport: '',
      arrivalAirport: '',
      departureTime: '',
      arrivalTime: '',
      memo: '',
    });
  };

  const handleSaveFlight = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingFlight) {
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const result = await updateFlight(client, {
      id: editingFlight.id,
      airline: editingFlight.airline.trim(),
      flightNumber: editingFlight.flightNumber.trim(),
      departureAirport: editingFlight.departureAirport.trim(),
      arrivalAirport: editingFlight.arrivalAirport.trim(),
      departureTime: editingFlight.departureTime,
      arrivalTime: editingFlight.arrivalTime,
      memo: editingFlight.memo.trim(),
    });

    setSaving(false);
    if (result.error || !result.data) {
      setErrorMessage(result.error ?? 'Failed to update flight.');
      return;
    }

    setFlights((prev) => prev.map((item) => (item.id === result.data!.id ? result.data! : item)));
    setEditingFlight(null);
  };

  const handleDeleteFlight = async () => {
    if (!deletingFlight) {
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    const result = await deleteFlight(client, deletingFlight.id);
    setSaving(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setFlights((prev) => prev.filter((item) => item.id !== deletingFlight.id));
    setDeletingFlight(null);
  };

  const handleAddHotel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!addHotel.name || !addHotel.checkInDate || !addHotel.checkOutDate) {
      setErrorMessage('Please fill in the required hotel fields.');
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const result = await createHotel(client, {
      tripId,
      name: addHotel.name.trim(),
      address: addHotel.address.trim(),
      checkInDate: addHotel.checkInDate,
      checkOutDate: addHotel.checkOutDate,
      memo: addHotel.memo.trim(),
    });

    setSaving(false);
    if (result.error || !result.data) {
      setErrorMessage(result.error ?? 'Failed to add hotel.');
      return;
    }

    setHotels((prev) => [...prev, result.data!].sort((a, b) => a.checkInDate.localeCompare(b.checkInDate)));
    setAddHotel({ name: '', address: '', checkInDate: '', checkOutDate: '', memo: '' });
  };

  const handleSaveHotel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingHotel) {
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const result = await updateHotel(client, {
      id: editingHotel.id,
      name: editingHotel.name.trim(),
      address: editingHotel.address.trim(),
      checkInDate: editingHotel.checkInDate,
      checkOutDate: editingHotel.checkOutDate,
      memo: editingHotel.memo.trim(),
    });

    setSaving(false);
    if (result.error || !result.data) {
      setErrorMessage(result.error ?? 'Failed to update hotel.');
      return;
    }

    setHotels((prev) => prev.map((item) => (item.id === result.data!.id ? result.data! : item)));
    setEditingHotel(null);
  };

  const handleDeleteHotel = async () => {
    if (!deletingHotel) {
      return;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setSaving(true);
    const result = await deleteHotel(client, deletingHotel.id);
    setSaving(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setHotels((prev) => prev.filter((item) => item.id !== deletingHotel.id));
    setDeletingHotel(null);
  };

  if (loading) {
    return (
      <Stack alignItems="center" py={4}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {!canEdit && <Alert severity="info">Read-only mode. Log in as the owner to edit.</Alert>}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>
            Flights
          </Typography>

          {canEdit && (
          <Box component="form" onSubmit={handleAddFlight}>
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Airline" value={addFlight.airline} onChange={(e) => setAddFlight((prev) => ({ ...prev, airline: e.target.value }))} fullWidth required size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Flight number" value={addFlight.flightNumber} onChange={(e) => setAddFlight((prev) => ({ ...prev, flightNumber: e.target.value }))} fullWidth required size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Departure airport" value={addFlight.departureAirport} onChange={(e) => setAddFlight((prev) => ({ ...prev, departureAirport: e.target.value }))} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Arrival airport" value={addFlight.arrivalAirport} onChange={(e) => setAddFlight((prev) => ({ ...prev, arrivalAirport: e.target.value }))} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField type="datetime-local" label="Departure time" value={addFlight.departureTime} onChange={(e) => setAddFlight((prev) => ({ ...prev, departureTime: e.target.value }))} fullWidth required size="small" slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField type="datetime-local" label="Arrival time" value={addFlight.arrivalTime} onChange={(e) => setAddFlight((prev) => ({ ...prev, arrivalTime: e.target.value }))} fullWidth required size="small" slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Memo" value={addFlight.memo} onChange={(e) => setAddFlight((prev) => ({ ...prev, memo: e.target.value }))} fullWidth size="small" multiline minRows={2} />
              </Grid>
            </Grid>
            <Stack direction="row" justifyContent="flex-end" mt={1.25}>
              <Button type="submit" size="small" variant="contained" disabled={saving}>
                {saving ? 'Saving...' : 'Add flight'}
              </Button>
            </Stack>
          </Box>
          )}

          <Divider />

          {flights.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No flights yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {flights.map((flight) => (
                <Paper key={flight.id} variant="outlined" sx={{ p: 1.25 }}>
                  <Stack spacing={0.6}>
                    <Typography fontWeight={700}>{flight.airline} {flight.flightNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {flight.departureAirport || '-'} → {flight.arrivalAirport || '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {flight.departureTime} - {flight.arrivalTime}
                    </Typography>
                    {flight.memo && <Typography variant="body2">{flight.memo}</Typography>}
                    {canEdit && (
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Button size="small" onClick={() => setEditingFlight(flight)}>Edit</Button>
                        <Button size="small" color="error" onClick={() => setDeletingFlight(flight)}>Delete</Button>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>
            Hotels
          </Typography>

          {canEdit && (
          <Box component="form" onSubmit={handleAddHotel}>
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Name" value={addHotel.name} onChange={(e) => setAddHotel((prev) => ({ ...prev, name: e.target.value }))} fullWidth required size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Address" value={addHotel.address} onChange={(e) => setAddHotel((prev) => ({ ...prev, address: e.target.value }))} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField type="date" label="Check-in" value={addHotel.checkInDate} onChange={(e) => setAddHotel((prev) => ({ ...prev, checkInDate: e.target.value }))} fullWidth required size="small" slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField type="date" label="Check-out" value={addHotel.checkOutDate} onChange={(e) => setAddHotel((prev) => ({ ...prev, checkOutDate: e.target.value }))} fullWidth required size="small" slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Memo" value={addHotel.memo} onChange={(e) => setAddHotel((prev) => ({ ...prev, memo: e.target.value }))} fullWidth size="small" multiline minRows={2} />
              </Grid>
            </Grid>
            <Stack direction="row" justifyContent="flex-end" mt={1.25}>
              <Button type="submit" size="small" variant="contained" disabled={saving}>
                {saving ? 'Saving...' : 'Add hotel'}
              </Button>
            </Stack>
          </Box>
          )}

          <Divider />

          {hotels.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No hotels yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {hotels.map((hotel) => (
                <Paper key={hotel.id} variant="outlined" sx={{ p: 1.25 }}>
                  <Stack spacing={0.6}>
                    <Typography fontWeight={700}>{hotel.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {hotel.checkInDate} - {hotel.checkOutDate}
                    </Typography>
                    {hotel.address && <Typography variant="body2" color="text.secondary">{hotel.address}</Typography>}
                    {hotel.memo && <Typography variant="body2">{hotel.memo}</Typography>}
                    {canEdit && (
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Button size="small" onClick={() => setEditingHotel(hotel)}>Edit</Button>
                        <Button size="small" color="error" onClick={() => setDeletingHotel(hotel)}>Delete</Button>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Dialog open={canEdit && Boolean(editingFlight)} onClose={() => setEditingFlight(null)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSaveFlight}>
          <DialogTitle>Edit flight</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} mt={0.5}>
              <TextField label="Airline" value={editingFlight?.airline ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, airline: e.target.value } : prev))} required />
              <TextField label="Flight number" value={editingFlight?.flightNumber ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, flightNumber: e.target.value } : prev))} required />
              <TextField label="Departure airport" value={editingFlight?.departureAirport ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, departureAirport: e.target.value } : prev))} />
              <TextField label="Arrival airport" value={editingFlight?.arrivalAirport ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, arrivalAirport: e.target.value } : prev))} />
              <TextField type="datetime-local" label="Departure time" value={editingFlight?.departureTime ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, departureTime: e.target.value } : prev))} required slotProps={{ inputLabel: { shrink: true } }} />
              <TextField type="datetime-local" label="Arrival time" value={editingFlight?.arrivalTime ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, arrivalTime: e.target.value } : prev))} required slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Memo" value={editingFlight?.memo ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, memo: e.target.value } : prev))} multiline minRows={2} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingFlight(null)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={canEdit && Boolean(deletingFlight)} onClose={() => setDeletingFlight(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete flight</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to delete this flight?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingFlight(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteFlight} color="error" variant="contained" disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={canEdit && Boolean(editingHotel)} onClose={() => setEditingHotel(null)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSaveHotel}>
          <DialogTitle>Edit hotel</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} mt={0.5}>
              <TextField label="Name" value={editingHotel?.name ?? ''} onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, name: e.target.value } : prev))} required />
              <TextField label="Address" value={editingHotel?.address ?? ''} onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, address: e.target.value } : prev))} />
              <TextField type="date" label="Check-in" value={editingHotel?.checkInDate ?? ''} onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, checkInDate: e.target.value } : prev))} required slotProps={{ inputLabel: { shrink: true } }} />
              <TextField type="date" label="Check-out" value={editingHotel?.checkOutDate ?? ''} onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, checkOutDate: e.target.value } : prev))} required slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Memo" value={editingHotel?.memo ?? ''} onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, memo: e.target.value } : prev))} multiline minRows={2} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingHotel(null)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={canEdit && Boolean(deletingHotel)} onClose={() => setDeletingHotel(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete hotel</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to delete this hotel?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingHotel(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteHotel} color="error" variant="contained" disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
