'use client';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlightIcon from '@mui/icons-material/Flight';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { enumerateDateRange } from '@/lib/date';
import { createFlight, deleteFlight, listFlightsByTripId, updateFlight } from '@/lib/flights/service';
import { createHotel, deleteHotel, listHotelsByTripId, updateHotel } from '@/lib/hotels/service';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Flight, Hotel } from '@/lib/types/trip';

type FlightsHotelsTabProps = {
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  canEdit?: boolean;
};

type AirportOption = {
  id: string;
  label: string;
  value: string;
};

function parseAirportLabel(label: string): { name: string; code: string } {
  const trimmed = label.trim();
  const nameAndCode = trimmed.split(' · ')[0]?.trim() ?? trimmed;
  const match = nameAndCode.match(/^(.*?)\s*\(([A-Za-z0-9]{3,4})\)\s*$/);
  if (match) {
    return {
      name: match[1]?.trim() ?? '',
      code: (match[2] ?? '').toUpperCase(),
    };
  }
  return {
    name: nameAndCode,
    code: '',
  };
}

function formatAirportDisplayName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '-';
  }
  const { name, code } = parseAirportLabel(trimmed);
  if (code && name) {
    return `${code} · ${name}`;
  }
  return name || trimmed;
}

function formatAirportCode(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '-';
  }
  const { name, code } = parseAirportLabel(trimmed);
  return code || name || trimmed;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonthDayTime(value: string): string {
  const [datePart, timePart = ''] = value.split('T');
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) {
    return value;
  }
  const monthLabel = MONTH_LABELS[Number(month) - 1] ?? month;
  const dayNum = Number(day);
  const hhmm = timePart.slice(0, 5);
  return hhmm ? `${monthLabel} ${Number.isNaN(dayNum) ? day : dayNum} ${hhmm}` : `${monthLabel} ${Number.isNaN(dayNum) ? day : dayNum}`;
}

function normalizeDateTimeLocal(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);
  if (match) {
    return `${match[1]}T${match[2]}`;
  }
  return trimmed;
}

function splitDateTimeLocal(value: string): { date: string; time: string } {
  const normalized = normalizeDateTimeLocal(value);
  const [datePart = '', timePart = ''] = normalized.split('T');
  return {
    date: datePart,
    time: timePart.slice(0, 5) || '00:00',
  };
}

function combineDateTimeLocal(date: string, time: string): string {
  const normalizedDate = date.trim();
  if (!normalizedDate) {
    return '';
  }
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? time : '00:00';
  return `${normalizedDate}T${normalizedTime}`;
}

function getDayDiff(start: string, end: string): number {
  const startDate = start.slice(0, 10);
  const endDate = end.slice(0, 10);
  if (!startDate || !endDate) {
    return 0;
  }
  const startMs = Date.parse(`${startDate}T00:00:00Z`);
  const endMs = Date.parse(`${endDate}T00:00:00Z`);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return 0;
  }
  return Math.max(0, Math.round((endMs - startMs) / (24 * 60 * 60 * 1000)));
}

function AirportAutocompleteField({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<AirportOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputValue(value);
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      void fetch(`/api/airports/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch airport candidates');
          }
          const data = (await response.json()) as { options?: AirportOption[] };
          setOptions(data.options ?? []);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setOptions([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const selectedValue = useMemo(() => {
    if (!value) {
      return null;
    }
    const matched = options.find((option) => option.value === value);
    if (matched) {
      return matched;
    }
    return {
      id: `manual:${value}`,
      label: value,
      value,
    };
  }, [options, value]);

  return (
    <Autocomplete<AirportOption, false, false, false>
      options={options}
      value={selectedValue}
      inputValue={inputValue}
      onInputChange={(_, nextInputValue, reason) => {
        setInputValue(nextInputValue);
        setQuery(nextInputValue);
        if (reason === 'clear') {
          onValueChange('');
        }
      }}
      onChange={(_, option) => {
        onValueChange(option?.value ?? '');
      }}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      filterOptions={(candidateOptions) => candidateOptions}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          {formatAirportDisplayName(option.label)}
        </li>
      )}
      loading={loading}
      noOptionsText={inputValue.trim().length < 2 ? 'Type at least 2 characters' : 'No airports found'}
      loadingText="Searching airports..."
      fullWidth
      autoHighlight
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

function DateTimePickerField({
  label,
  value,
  onChange,
  dateOptions,
  helperText,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  dateOptions: string[];
  helperText?: string;
  required?: boolean;
}) {
  const { date, time } = splitDateTimeLocal(value);
  const safeDate = dateOptions.includes(date) ? date : '';
  const safeTime = /^\d{2}:\d{2}$/.test(time) ? time : '';

  return (
    <Stack spacing={0.75}>
      <Typography variant="body2">{label}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          select
          label="Date"
          value={safeDate}
          onChange={(event) => onChange(combineDateTimeLocal(event.target.value, safeTime))}
          required={required}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        >
          <MenuItem value="" disabled>
            Select date
          </MenuItem>
          {dateOptions.map((dateOption) => (
            <MenuItem key={dateOption} value={dateOption}>
              {dateOption}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="time"
          label="Time"
          value={safeTime}
          onChange={(event) => onChange(combineDateTimeLocal(safeDate, event.target.value))}
          required={required}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>
      {helperText ? (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      ) : null}
    </Stack>
  );
}

export function FlightsHotelsTab({ tripId, tripStartDate, tripEndDate, canEdit = true }: FlightsHotelsTabProps) {
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
  const [addFlightArrivalTouched, setAddFlightArrivalTouched] = useState(false);

  const [addHotel, setAddHotel] = useState({
    name: '',
    address: '',
    checkInDate: '',
    checkOutDate: '',
    memo: '',
  });

  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [editFlightArrivalTouched, setEditFlightArrivalTouched] = useState(true);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [previewFlight, setPreviewFlight] = useState<Flight | null>(null);
  const [previewHotel, setPreviewHotel] = useState<Hotel | null>(null);
  const previewHistoryPushedRef = useRef(false);
  const [deletingFlight, setDeletingFlight] = useState<Flight | null>(null);
  const [deletingHotel, setDeletingHotel] = useState<Hotel | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const previewFlightDayDiff = previewFlight ? getDayDiff(previewFlight.departureTime, previewFlight.arrivalTime) : 0;
  const flightDateOptions = useMemo(() => enumerateDateRange(tripStartDate, tripEndDate), [tripStartDate, tripEndDate]);

  const handleAddFlightDepartureChange = (value: string) => {
    setAddFlight((prev) => {
      const next = { ...prev, departureTime: value };
      if (!addFlightArrivalTouched || !prev.arrivalTime) {
        next.arrivalTime = value;
      }
      return next;
    });
  };

  const openEditFlight = (flight: Flight) => {
    const departureTime = normalizeDateTimeLocal(flight.departureTime);
    const arrivalTime = normalizeDateTimeLocal(flight.arrivalTime);
    setEditingFlight({
      ...flight,
      departureTime,
      arrivalTime,
    });
    setEditFlightArrivalTouched(Boolean(arrivalTime));
  };

  const handleEditFlightDepartureChange = (value: string) => {
    setEditingFlight((prev) => {
      if (!prev) {
        return prev;
      }
      const next = { ...prev, departureTime: value };
      if (!editFlightArrivalTouched || !prev.arrivalTime) {
        next.arrivalTime = value;
      }
      return next;
    });
  };

  const openPreviewFlight = (flight: Flight) => {
    setPreviewFlight(flight);
    if (typeof window !== 'undefined') {
      window.history.pushState({ ...window.history.state, previewModal: 'flight' }, '');
      previewHistoryPushedRef.current = true;
    }
  };

  const openPreviewHotel = (hotel: Hotel) => {
    setPreviewHotel(hotel);
    if (typeof window !== 'undefined') {
      window.history.pushState({ ...window.history.state, previewModal: 'hotel' }, '');
      previewHistoryPushedRef.current = true;
    }
  };

  const closePreview = useCallback(() => {
    if (previewHistoryPushedRef.current && typeof window !== 'undefined') {
      previewHistoryPushedRef.current = false;
      window.history.back();
      return;
    }
    setPreviewFlight(null);
    setPreviewHotel(null);
  }, []);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handlePopState = () => {
      if (previewHistoryPushedRef.current || previewFlight || previewHotel) {
        previewHistoryPushedRef.current = false;
        setPreviewFlight(null);
        setPreviewHotel(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [previewFlight, previewHotel]);

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
    setAddFlightArrivalTouched(false);
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
    setEditFlightArrivalTouched(true);
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
              {flights.map((flight) => {
                return (
                <Paper
                  key={flight.id}
                  variant="outlined"
                  onClick={() => {
                    openPreviewFlight(flight);
                  }}
                  sx={{ p: 1, cursor: 'pointer' }}
                >
                  <Stack spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <Stack direction="row" spacing={1} alignItems="baseline" minWidth={0}>
                        <Typography variant="body1" fontWeight={600} noWrap sx={{ width: '5ch', flexShrink: 0 }}>
                          {formatAirportCode(flight.departureAirport)}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" noWrap>
                          {formatMonthDayTime(flight.departureTime)}
                        </Typography>
                      </Stack>
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
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <FlightIcon color="action" sx={{ fontSize: 16, transform: 'rotate(90deg)' }} />
                      <Typography variant="body2" color="text.secondary">
                        {flight.airline} {flight.flightNumber}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="baseline">
                      <Typography variant="body1" fontWeight={600} noWrap sx={{ width: '5ch', flexShrink: 0 }}>
                        {formatAirportCode(flight.arrivalAirport)}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" noWrap>
                        {formatMonthDayTime(flight.arrivalTime)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
                );
              })}
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
                    openPreviewHotel(hotel);
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

      <Dialog
        open={Boolean(previewFlight)}
        onClose={closePreview}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        sx={{ '& .MuiDialog-paperFullScreen': { bgcolor: 'background.paper' } }}
      >
        <Box sx={{ minHeight: '100%', mt: 'env(safe-area-inset-top)', bgcolor: 'background.paper' }}>
        <DialogTitle sx={{ py: 1.5, bgcolor: 'transparent' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <IconButton onClick={closePreview} color="inherit" aria-label="Close">
              <CloseIcon fontSize="small" />
            </IconButton>
            {canEdit && previewFlight && (
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  previewHistoryPushedRef.current = false;
                  openEditFlight(previewFlight);
                  setPreviewFlight(null);
                }}
              >
                Edit
              </Button>
            )}
          </Stack>
          <Typography variant="h5" fontWeight={700} mt={1}>
            {previewFlight ? `${previewFlight.airline} ${previewFlight.flightNumber}` : ''}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {previewFlight && (
          <Stack spacing={1} mt={0.5}>
            <Typography variant="body1" color="text.secondary">
              {formatAirportDisplayName(previewFlight?.departureAirport ?? '')} {'→'} {formatAirportDisplayName(previewFlight?.arrivalAirport ?? '')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {previewFlight ? `${formatMonthDayTime(previewFlight.departureTime)} - ${formatMonthDayTime(previewFlight.arrivalTime)}` : ''}
            </Typography>
            {previewFlightDayDiff > 0 && (
              <Typography variant="body2" color="text.secondary">
                Overnight / multi-day flight (+{previewFlightDayDiff} day{previewFlightDayDiff > 1 ? 's' : ''})
              </Typography>
            )}
            {previewFlight?.memo && (
              <>
                <Divider />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                  {previewFlight.memo}
                </Typography>
              </>
            )}
          </Stack>
          )}
        </DialogContent>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(previewHotel)}
        onClose={closePreview}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        sx={{ '& .MuiDialog-paperFullScreen': { bgcolor: 'background.paper' } }}
      >
        <Box sx={{ minHeight: '100%', mt: 'env(safe-area-inset-top)', bgcolor: 'background.paper' }}>
        <DialogTitle sx={{ py: 1.5, bgcolor: 'transparent' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <IconButton onClick={closePreview} color="inherit" aria-label="Close">
              <CloseIcon fontSize="small" />
            </IconButton>
            {canEdit && previewHotel && (
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  previewHistoryPushedRef.current = false;
                  setEditingHotel(previewHotel);
                  setPreviewHotel(null);
                }}
              >
                Edit
              </Button>
            )}
          </Stack>
          <Typography variant="h5" fontWeight={700} mt={1}>
            {previewHotel?.name ?? ''}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={0.5}>
            <Typography variant="body1" color="text.secondary">
              {previewHotel?.checkInDate} - {previewHotel?.checkOutDate}
            </Typography>
            {previewHotel?.address && <Typography variant="body1">{previewHotel.address}</Typography>}
            {previewHotel?.memo && (
              <>
                <Divider />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                  {previewHotel.memo}
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>
        </Box>
      </Dialog>

      <Dialog
        open={canEdit && addFlightOpen}
        onClose={() => {
          setAddFlightOpen(false);
          setAddFlightArrivalTouched(false);
        }}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <Box component="form" onSubmit={handleAddFlight}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add flight</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} mt={0.5}>
              <TextField label="Airline" value={addFlight.airline} onChange={(e) => setAddFlight((prev) => ({ ...prev, airline: e.target.value }))} required />
              <TextField label="Flight number" value={addFlight.flightNumber} onChange={(e) => setAddFlight((prev) => ({ ...prev, flightNumber: e.target.value }))} required />
              <AirportAutocompleteField
                label="Departure airport"
                value={addFlight.departureAirport}
                onValueChange={(value) => setAddFlight((prev) => ({ ...prev, departureAirport: value }))}
              />
              <AirportAutocompleteField
                label="Arrival airport"
                value={addFlight.arrivalAirport}
                onValueChange={(value) => setAddFlight((prev) => ({ ...prev, arrivalAirport: value }))}
              />
              <DateTimePickerField
                label="Departure time (local)"
                value={addFlight.departureTime}
                onChange={handleAddFlightDepartureChange}
                dateOptions={flightDateOptions}
                required={true}
                helperText="Local time at departure location"
              />
              <DateTimePickerField
                label="Arrival time (local)"
                value={addFlight.arrivalTime}
                onChange={(value) => {
                  setAddFlightArrivalTouched(true);
                  setAddFlight((prev) => ({ ...prev, arrivalTime: value }));
                }}
                dateOptions={flightDateOptions}
                required={true}
                helperText="Local time at arrival location"
              />
              <TextField label="Memo" value={addFlight.memo} onChange={(e) => setAddFlight((prev) => ({ ...prev, memo: e.target.value }))} multiline minRows={3} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setAddFlightOpen(false);
                setAddFlightArrivalTouched(false);
              }}
              color="inherit"
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Add flight'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={canEdit && Boolean(editingFlight)}
        onClose={() => {
          setEditingFlight(null);
          setEditFlightArrivalTouched(true);
        }}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        sx={{ '& .MuiDialog-paperFullScreen': { bgcolor: 'background.paper' } }}
      >
        <Box component="form" onSubmit={handleSaveFlight} sx={{ minHeight: '100%', mt: 'env(safe-area-inset-top)', bgcolor: 'background.paper' }}>
          <DialogTitle sx={{ fontWeight: 700, bgcolor: 'transparent' }}>Edit flight</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} mt={0.5}>
              <TextField label="Airline" value={editingFlight?.airline ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, airline: e.target.value } : prev))} required />
              <TextField label="Flight number" value={editingFlight?.flightNumber ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, flightNumber: e.target.value } : prev))} required />
              <AirportAutocompleteField
                label="Departure airport"
                value={editingFlight?.departureAirport ?? ''}
                onValueChange={(value) => setEditingFlight((prev) => (prev ? { ...prev, departureAirport: value } : prev))}
              />
              <AirportAutocompleteField
                label="Arrival airport"
                value={editingFlight?.arrivalAirport ?? ''}
                onValueChange={(value) => setEditingFlight((prev) => (prev ? { ...prev, arrivalAirport: value } : prev))}
              />
              <DateTimePickerField
                label="Departure time (local)"
                value={editingFlight?.departureTime ?? ''}
                onChange={handleEditFlightDepartureChange}
                dateOptions={flightDateOptions}
                required={true}
                helperText="Local time at departure location"
              />
              <DateTimePickerField
                label="Arrival time (local)"
                value={editingFlight?.arrivalTime ?? ''}
                onChange={(value) => {
                  setEditFlightArrivalTouched(true);
                  setEditingFlight((prev) => (prev ? { ...prev, arrivalTime: value } : prev));
                }}
                dateOptions={flightDateOptions}
                required={true}
                helperText="Local time at arrival location"
              />
              <TextField label="Memo" value={editingFlight?.memo ?? ''} onChange={(e) => setEditingFlight((prev) => (prev ? { ...prev, memo: e.target.value } : prev))} multiline minRows={3} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEditingFlight(null);
                setEditFlightArrivalTouched(true);
              }}
              color="inherit"
            >
              Cancel
            </Button>
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
              <TextField
                select
                label="Check-in"
                value={addHotel.checkInDate}
                onChange={(e) => setAddHotel((prev) => ({ ...prev, checkInDate: e.target.value }))}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              >
                <MenuItem value="" disabled>
                  Select date
                </MenuItem>
                {flightDateOptions.map((dateOption) => (
                  <MenuItem key={`add-checkin-${dateOption}`} value={dateOption}>
                    {dateOption}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Check-out"
                value={addHotel.checkOutDate}
                onChange={(e) => setAddHotel((prev) => ({ ...prev, checkOutDate: e.target.value }))}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              >
                <MenuItem value="" disabled>
                  Select date
                </MenuItem>
                {flightDateOptions.map((dateOption) => (
                  <MenuItem key={`add-checkout-${dateOption}`} value={dateOption}>
                    {dateOption}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Memo" value={addHotel.memo} onChange={(e) => setAddHotel((prev) => ({ ...prev, memo: e.target.value }))} multiline minRows={3} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddHotelOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Add hotel'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={canEdit && Boolean(editingHotel)}
        onClose={() => setEditingHotel(null)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        sx={{ '& .MuiDialog-paperFullScreen': { bgcolor: 'background.paper' } }}
      >
        <Box component="form" onSubmit={handleSaveHotel} sx={{ minHeight: '100%', mt: 'env(safe-area-inset-top)', bgcolor: 'background.paper' }}>
          <DialogTitle sx={{ fontWeight: 700, bgcolor: 'transparent' }}>Edit hotel</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} mt={0.5}>
              <TextField label="Name" value={editingHotel?.name ?? ''} onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, name: e.target.value } : prev))} required />
              <TextField label="Address" value={editingHotel?.address ?? ''} onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, address: e.target.value } : prev))} />
              <TextField
                select
                label="Check-in"
                value={editingHotel?.checkInDate ?? ''}
                onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, checkInDate: e.target.value } : prev))}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              >
                <MenuItem value="" disabled>
                  Select date
                </MenuItem>
                {flightDateOptions.map((dateOption) => (
                  <MenuItem key={`edit-checkin-${dateOption}`} value={dateOption}>
                    {dateOption}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Check-out"
                value={editingHotel?.checkOutDate ?? ''}
                onChange={(e) => setEditingHotel((prev) => (prev ? { ...prev, checkOutDate: e.target.value } : prev))}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              >
                <MenuItem value="" disabled>
                  Select date
                </MenuItem>
                {flightDateOptions.map((dateOption) => (
                  <MenuItem key={`edit-checkout-${dateOption}`} value={dateOption}>
                    {dateOption}
                  </MenuItem>
                ))}
              </TextField>
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
