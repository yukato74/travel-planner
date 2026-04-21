'use client';

import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
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

  const [addFlightOpen, setAddFlightOpen] = useState(false);
  const [addHotelOpen, setAddHotelOpen] = useState(false);

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
  const [previewFlight, setPreviewFlight] = useState<Flight | null>(null);
  const [previewHotel, setPreviewHotel] = useState<Hotel | null>(null);
  const [deletingFlight, setDeletingFlight] = useState<Flight | null>(null);
  const [deletingHotel, setDeletingHotel] = useState<Hotel | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      setLoading(false);
      return;
    }

    const [flightResult, hotelResult] = await Promise.all([listFlightsByTripId(client, tripId), listHotelsByTripId(client, tripId)]);

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
    setAddFlightOpen(false);
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
    setAddHotelOpen(false);
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
    <Stack spacing={1.5}>
      {!canEdit && <Alert severity="info">Read-only mode.</Alert>}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
        Bookings
      </Typography>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Typography variant="h6" fontWeight={700}>
              Flights
            </Typography>
            {canEdit && (
              <Button size="small" startIcon={<AddIcon />} onClick={() => setAddFlightOpen(true)}>
                Add flight
              </Button>
            )}
          </Stack>
          <Divider />

          {flights.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No flights yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {flights.map((flight) => (
                <Paper
                  key={flight.id}
                  variant="outlined"
                  onClick={() => {
                    setPreviewFlight(flight);
                  }}
                  sx={{ p: 1.25, cursor: 'pointer' }}
                >
                  <Stack spacing={0.6}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <Typography fontWeight={700}>{flight.airline} {flight.flightNumber}</Typography>
                      {canEdit && (
                        <IconButton
                          size="small"
                          aria-label="Delete"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeletingFlight(flight);
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {flight.departureAirport || '-'} {'→'} {flight.arrivalAirport || '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {flight.departureTime} - {flight.arrivalTime}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Typography variant="h6" fontWeight={700}>
              Hotels
            </Typography>
            {canEdit && (
              <Button size="small" startIcon={<AddIcon />} onClick={() => setAddHotelOpen(true)}>
                Add hotel
              </Button>
            )}
          </Stack>
          <Divider />

          {hotels.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No hotels yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {hotels.map((hotel) => (
                <Paper
                  key={hotel.id}
                  variant="outlined"
                  onClick={() => {
                    setPreviewHotel(hotel);
                  }}
                  sx={{ p: 1.25, cursor: 'pointer' }}
                >
                  <Stack spacing={0.6}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <Typography fontWeight={700}>{hotel.name}</Typography>
                      {canEdit && (
                        <IconButton
                          size="small"
                          aria-label="Delete"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeletingHotel(hotel);
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {hotel.checkInDate} - {hotel.checkOutDate}
                    </Typography>
                    {hotel.address && <Typography variant="body2" color="text.secondary">{hotel.address}</Typography>}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Dialog open={Boolean(previewFlight)} onClose={() => setPreviewFlight(null)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle>{previewFlight ? `${previewFlight.airline} ${previewFlight.flightNumber}` : ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={0.5}>
            <Typography variant="body2" color="text.secondary">
              {previewFlight?.departureAirport || '-'} {'→'} {previewFlight?.arrivalAirport || '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {previewFlight?.departureTime} - {previewFlight?.arrivalTime}
            </Typography>
            {previewFlight?.memo && (
              <>
                <Divider />
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {previewFlight.memo}
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewFlight(null)} color="inherit">
            Close
          </Button>
          {canEdit && previewFlight && (
            <Button
              variant="contained"
              onClick={() => {
                setEditingFlight(previewFlight);
                setPreviewFlight(null);
              }}
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(previewHotel)} onClose={() => setPreviewHotel(null)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle>{previewHotel?.name ?? ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={0.5}>
            <Typography variant="body2" color="text.secondary">
              {previewHotel?.checkInDate} - {previewHotel?.checkOutDate}
            </Typography>
            {previewHotel?.address && <Typography variant="body2">{previewHotel.address}</Typography>}
            {previewHotel?.memo && (
              <>
                <Divider />
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {previewHotel.memo}
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewHotel(null)} color="inherit">
            Close
          </Button>
          {canEdit && previewHotel && (
            <Button
              variant="contained"
              onClick={() => {
                setEditingHotel(previewHotel);
                setPreviewHotel(null);
              }}
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={canEdit && addFlightOpen} onClose={() => setAddFlightOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <Box component="form" onSubmit={handleAddFlight}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add flight</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} mt={0.5}>
              <TextField label="Airline" value={addFlight.airline} onChange={(e) => setAddFlight((prev) => ({ ...prev, airline: e.target.value }))} required />
              <TextField label="Flight number" value={addFlight.flightNumber} onChange={(e) => setAddFlight((prev) => ({ ...prev, flightNumber: e.target.value }))} required />
              <TextField label="Departure airport" value={addFlight.departureAirport} onChange={(e) => setAddFlight((prev) => ({ ...prev, departureAirport: e.target.value }))} />
              <TextField label="Arrival airport" value={addFlight.arrivalAirport} onChange={(e) => setAddFlight((prev) => ({ ...prev, arrivalAirport: e.target.value }))} />
              <TextField
                type="datetime-local"
                label="Departure time (local)"
                value={addFlight.departureTime}
                onChange={(e) => setAddFlight((prev) => ({ ...prev, departureTime: e.target.value }))}
                required
                helperText="Local time at departure location"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                type="datetime-local"
                label="Arrival time (local)"
                value={addFlight.arrivalTime}
                onChange={(e) => setAddFlight((prev) => ({ ...prev, arrivalTime: e.target.value }))}
                required
                helperText="Local time at arrival location"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField label="Memo" value={addFlight.memo} onChange={(e) => setAddFlight((prev) => ({ ...prev, memo: e.target.value }))} multiline minRows={3} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddFlightOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Add flight'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={canEdit && Boolean(editingFlight)} onClose={() => setEditingFlight(null)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <Box component="form" onSubmit={handleSaveFlight}>
          <DialogTitle sx={{ fontWeight: 700 }}>Edit flight</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} mt={0.5}>
              <TextField label="Airline" value={editingFlight?.airline ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, airline: e.target.value } : prev))} required />
              <TextField label="Flight number" value={editingFlight?.flightNumber ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, flightNumber: e.target.value } : prev))} required />
              <TextField label="Departure airport" value={editingFlight?.departureAirport ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, departureAirport: e.target.value } : prev))} />
              <TextField label="Arrival airport" value={editingFlight?.arrivalAirport ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, arrivalAirport: e.target.value } : prev))} />
              <TextField
                type="datetime-local"
                label="Departure time (local)"
                value={editingFlight?.departureTime ?? ''}
                onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, departureTime: e.target.value } : prev))}
                required
                helperText="Local time at departure location"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                type="datetime-local"
                label="Arrival time (local)"
                value={editingFlight?.arrivalTime ?? ''}
                onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, arrivalTime: e.target.value } : prev))}
                required
                helperText="Local time at arrival location"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField label="Memo" value={editingFlight?.memo ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, memo: e.target.value } : prev))} multiline minRows={3} />
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

      <Dialog open={canEdit && addHotelOpen} onClose={() => setAddHotelOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <Box component="form" onSubmit={handleAddHotel}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add hotel</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} mt={0.5}>
              <TextField label="Name" value={addHotel.name} onChange={(e) => setAddHotel((prev) => ({ ...prev, name: e.target.value }))} required />
              <TextField label="Address" value={addHotel.address} onChange={(e) => setAddHotel((prev) => ({ ...prev, address: e.target.value }))} />
              <TextField type="date" label="Check-in" value={addHotel.checkInDate} onChange={(e) => setAddHotel((prev) => ({ ...prev, checkInDate: e.target.value }))} required slotProps={{ inputLabel: { shrink: true } }} />
              <TextField type="date" label="Check-out" value={addHotel.checkOutDate} onChange={(e) => setAddHotel((prev) => ({ ...prev, checkOutDate: e.target.value }))} required slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Memo" value={addHotel.memo} onChange={(e) => setAddHotel((prev) => ({ ...prev, memo: e.target.value }))} multiline minRows={3} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddHotelOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Add hotel'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={canEdit && Boolean(editingHotel)} onClose={() => setEditingHotel(null)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <Box component="form" onSubmit={handleSaveHotel}>
          <DialogTitle sx={{ fontWeight: 700 }}>Edit hotel</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} mt={0.5}>
              <TextField label="Name" value={editingHotel?.name ?? ''} onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, name: e.target.value } : prev))} required />
              <TextField label="Address" value={editingHotel?.address ?? ''} onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, address: e.target.value } : prev))} />
              <TextField type="date" label="Check-in" value={editingHotel?.checkInDate ?? ''} onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, checkInDate: e.target.value } : prev))} required slotProps={{ inputLabel: { shrink: true } }} />
              <TextField type="date" label="Check-out" value={editingHotel?.checkOutDate ?? ''} onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, checkOutDate: e.target.value } : prev))} required slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Memo" value={editingHotel?.memo ?? ''} onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, memo: e.target.value } : prev))} multiline minRows={3} />
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
