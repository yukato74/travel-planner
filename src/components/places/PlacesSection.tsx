'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import AddIcon from '@mui/icons-material/Add';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import HotelIcon from '@mui/icons-material/Hotel';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PlaceItem } from '@/components/places/PlaceItem';
import { listFlightsByTripId } from '@/lib/flights/service';
import { listHotelsByTripId } from '@/lib/hotels/service';
import { addPlace, deletePlace, listPlacesByTripId, reorderPlaces, updatePlace } from '@/lib/places/service';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { getTripItineraryOrder, updateTripItineraryOrder } from '@/lib/trips/service';
import { Flight, Hotel, Place, PlaceOrderUpdate } from '@/lib/types/trip';

type ItineraryFlightItem = {
  id: string;
  flightId: string;
  visitDate: string;
  counterpartDate: string;
  kind: 'departure' | 'arrival';
  title: string;
  subtitle: string;
  dateTime: string;
  isOvernight: boolean;
};

function formatTimeOnly(value: string): string {
  const timePart = value.split('T')[1];
  return timePart ? timePart.slice(0, 5) : value;
}

function isOvernightDeparture(item?: ItineraryFlightItem): boolean {
  return Boolean(item && item.kind === 'departure' && item.counterpartDate > item.visitDate);
}

function isOvernightArrival(item?: ItineraryFlightItem): boolean {
  return Boolean(item && item.kind === 'arrival' && item.counterpartDate < item.visitDate);
}

function isBlockedBoundary(ids: string[], index: number, flightItemById: Map<string, ItineraryFlightItem>): boolean {
  if (ids.length === 0) {
    return false;
  }
  if (index <= 0) {
    return isOvernightArrival(flightItemById.get(ids[0]));
  }
  if (index >= ids.length) {
    return isOvernightDeparture(flightItemById.get(ids[ids.length - 1]));
  }
  const before = flightItemById.get(ids[index - 1]);
  const after = flightItemById.get(ids[index]);
  if (before?.kind === 'departure' && after?.kind === 'arrival' && before.flightId === after.flightId) {
    return true;
  }
  return false;
}

function normalizeFlightPairAdjacency(ids: string[], flightItemById: Map<string, ItineraryFlightItem>): string[] {
  const next = [...ids];
  for (let i = 0; i < next.length; i += 1) {
    const dep = flightItemById.get(next[i]);
    if (dep?.kind !== 'departure') {
      continue;
    }
    const arrivalIndex = next.findIndex((id, idx) => {
      if (idx <= i) {
        return false;
      }
      const candidate = flightItemById.get(id);
      return candidate?.kind === 'arrival' && candidate.flightId === dep.flightId;
    });
    if (arrivalIndex === -1 || arrivalIndex === i + 1) {
      continue;
    }
    const [arrivalId] = next.splice(arrivalIndex, 1);
    next.splice(i + 1, 0, arrivalId);
  }
  return next;
}

function adjustInsertIndexAwayFromFlightGap(ids: string[], index: number, flightItemById: Map<string, ItineraryFlightItem>): number {
  let adjusted = Math.max(0, Math.min(index, ids.length));
  let safety = 0;
  while (safety < ids.length + 2 && isBlockedBoundary(ids, adjusted, flightItemById)) {
    if (adjusted <= 0) {
      adjusted += 1;
    } else if (adjusted >= ids.length) {
      adjusted -= 1;
    } else {
      adjusted += 1;
    }
    safety += 1;
  }
  return Math.max(0, Math.min(adjusted, ids.length));
}

type PlacesSectionProps = {
  tripId: string;
  dateOptions: string[];
  canEdit?: boolean;
};

type DaySectionProps = {
  date: string;
  dayLabel: string;
  shortDate: string;
  places: Place[];
  flights: ItineraryFlightItem[];
  orderedItemIds: string[];
  saving: boolean;
  canEdit: boolean;
  onOpenAdd: (date: string) => void;
  onEdit: (place: Place) => void;
  onDelete: (place: Place) => void;
};

function FlightItem({
  item,
  connectedToNext,
  connectedToPrevDay,
  connectedToNextDay,
}: {
  item: ItineraryFlightItem;
  connectedToNext?: boolean;
  connectedToPrevDay?: boolean;
  connectedToNextDay?: boolean;
}) {
  const showTopConnector = Boolean(connectedToPrevDay);
  const showBottomConnector = Boolean(connectedToNextDay || connectedToNext);
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        mb: 0,
        position: 'relative',
        borderRadius: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderTopLeftRadius: showTopConnector ? 0.5 : 1,
        borderTopRightRadius: showTopConnector ? 0.5 : 1,
        borderBottomLeftRadius: showBottomConnector ? 0.5 : 1,
        borderBottomRightRadius: showBottomConnector ? 0.5 : 1,
        '&::before': showTopConnector
          ? {
              content: '""',
              position: 'absolute',
              left: 12,
              top: -10,
              width: 2,
              height: 10,
              bgcolor: 'primary.main',
              borderRadius: 2,
            }
          : undefined,
        '&::after': showBottomConnector
          ? {
              content: '""',
              position: 'absolute',
              left: 12,
              bottom: -10,
              width: 2,
              height: 10,
              bgcolor: 'primary.main',
              borderRadius: 2,
            }
          : undefined,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {item.kind === 'departure' ? <FlightTakeoffIcon fontSize="small" color="action" /> : <FlightLandIcon fontSize="small" color="action" />}
        <Stack spacing={0.25}>
          <Typography variant="body1" fontWeight={600}>
            {item.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.subtitle}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

function InsertDropZone({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        height: 8,
        my: 0.25,
        borderRadius: 999,
        bgcolor: isOver ? 'primary.main' : 'transparent',
        opacity: isOver ? 0.35 : 0,
        transition: 'opacity 120ms ease',
      }}
    />
  );
}

function NonDroppableGap() {
  return (
    <Box
      sx={{
        height: 8,
        my: 0.25,
      }}
    />
  );
}

function DaySection({
  date,
  dayLabel,
  shortDate,
  places,
  flights,
  orderedItemIds,
  saving,
  canEdit,
  onOpenAdd,
  onEdit,
  onDelete,
}: DaySectionProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: date,
    data: {
      type: 'day',
      visitDate: date,
    },
  });
  const flightItemById = useMemo(() => new Map(flights.map((item) => [item.id, item])), [flights]);
  const showStartInsert = !isBlockedBoundary(orderedItemIds, 0, flightItemById);

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={{
        p: 1.5,
        borderColor: isOver && canEdit ? 'primary.main' : 'divider',
        bgcolor: isOver && canEdit ? 'action.hover' : 'background.paper',
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="subtitle2" fontWeight={700} whiteSpace="nowrap">
              {dayLabel}
            </Typography>
            <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
              {shortDate}
            </Typography>
          </Stack>
          <Button size="small" startIcon={<AddIcon />} onClick={() => onOpenAdd(date)} disabled={saving || !canEdit}>
            Add place
          </Button>
        </Stack>

        <Divider />

        <SortableContext items={orderedItemIds.filter((id) => places.some((place) => place.id === id))} strategy={verticalListSortingStrategy}>
          <List disablePadding>
            {places.length === 0 && flights.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No places for this day yet.
              </Typography>
            ) : (
              <>
                {showStartInsert && <InsertDropZone id={`insert:${date}:0`} />}
                {orderedItemIds.map((id, index) => {
                  const nextId = orderedItemIds[index + 1];
                  const place = places.find((item) => item.id === id);
                  if (place) {
                    const showInsertAfter = !isBlockedBoundary(orderedItemIds, index + 1, flightItemById);
                    return (
                      <Box key={place.id}>
                        <PlaceItem
                          place={place}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          disabled={saving}
                          canEdit={canEdit}
                        />
                        {showInsertAfter ? <InsertDropZone id={`insert:${date}:${index + 1}`} /> : <NonDroppableGap />}
                      </Box>
                    );
                  }

                  const flight = flights.find((item) => item.id === id);
                  if (flight) {
                    const nextFlight = nextId ? flights.find((item) => item.id === nextId) : undefined;
                    const connectedToNext =
                      flight.kind === 'departure' &&
                      nextFlight?.kind === 'arrival' &&
                      nextFlight.flightId === flight.flightId;
                    const connectedToPrevDay = isOvernightArrival(flight);
                    const connectedToNextDay = isOvernightDeparture(flight);
                    const shouldShowInsertAfter = !isBlockedBoundary(orderedItemIds, index + 1, flightItemById);
                    return (
                      <Box key={flight.id}>
                        <FlightItem
                          item={flight}
                          connectedToNext={connectedToNext}
                          connectedToPrevDay={connectedToPrevDay}
                          connectedToNextDay={connectedToNextDay}
                        />
                        {shouldShowInsertAfter ? <InsertDropZone id={`insert:${date}:${index + 1}`} /> : <NonDroppableGap />}
                      </Box>
                    );
                  }

                  return null;
                })}
              </>
            )}
          </List>
        </SortableContext>
      </Stack>
    </Paper>
  );
}

export function PlacesSection({ tripId, dateOptions, canEdit = true }: PlacesSectionProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [addDate, setAddDate] = useState<string | null>(null);
  const [addName, setAddName] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addMemo, setAddMemo] = useState('');

  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [previewPlace, setPreviewPlace] = useState<Place | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editVisitDate, setEditVisitDate] = useState('');

  const [deletingPlace, setDeletingPlace] = useState<Place | null>(null);

  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [dayItemOrderByDay, setDayItemOrderByDay] = useState<Record<string, string[]>>({});
  const [sharedOrderLoaded, setSharedOrderLoaded] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const activePlace = useMemo(
    () => (activePlaceId ? places.find((place) => place.id === activePlaceId) ?? null : null),
    [activePlaceId, places],
  );

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

  const itineraryFlightItems = useMemo(() => {
    const daySet = new Set(dateOptions);
    const items: ItineraryFlightItem[] = [];
    for (const flight of flights) {
      const departureDate = flight.departureTime.slice(0, 10);
      const arrivalDate = flight.arrivalTime.slice(0, 10);
      const isOvernight = departureDate !== arrivalDate;
      if (daySet.has(departureDate)) {
        items.push({
          id: `flight:${flight.id}:departure`,
          flightId: flight.id,
          visitDate: departureDate,
          counterpartDate: arrivalDate,
          kind: 'departure',
          title: `${flight.airline} ${flight.flightNumber}`,
          subtitle: `${flight.departureAirport || '-'} at ${formatTimeOnly(flight.departureTime)}`,
          dateTime: flight.departureTime,
          isOvernight,
        });
      }
      if (daySet.has(arrivalDate)) {
        items.push({
          id: `flight:${flight.id}:arrival`,
          flightId: flight.id,
          visitDate: arrivalDate,
          counterpartDate: departureDate,
          kind: 'arrival',
          title: `${flight.airline} ${flight.flightNumber}`,
          subtitle: `${flight.arrivalAirport || '-'} at ${formatTimeOnly(flight.arrivalTime)}`,
          dateTime: flight.arrivalTime,
          isOvernight,
        });
      }
    }
    return items.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  }, [dateOptions, flights]);

  const groupedFlightItems = useMemo(() => {
    const groups = new Map<string, ItineraryFlightItem[]>();
    for (const day of dateOptions) {
      groups.set(day, itineraryFlightItems.filter((item) => item.visitDate === day));
    }
    return groups;
  }, [dateOptions, itineraryFlightItems]);
  const flightItemById = useMemo(() => new Map(itineraryFlightItems.map((item) => [item.id, item])), [itineraryFlightItems]);

  const defaultDayItemOrderByDay = useMemo(() => {
    const order: Record<string, string[]> = {};
    for (const day of dateOptions) {
      const dayFlights = groupedFlightItems.get(day) ?? [];
      const overnightArrivals = dayFlights
        .filter((item) => item.kind === 'arrival' && item.counterpartDate < item.visitDate)
        .map((item) => item.id);
      const departures = dayFlights.filter((item) => item.kind === 'departure').map((item) => item.id);
      const sameDayArrivals = dayFlights
        .filter((item) => item.kind === 'arrival' && item.counterpartDate >= item.visitDate)
        .map((item) => item.id);
      const placeIds = (groupedPlaces.get(day) ?? []).map((place) => place.id);
      order[day] = [...overnightArrivals, ...departures, ...placeIds, ...sameDayArrivals];
    }
    return order;
  }, [dateOptions, groupedFlightItems, groupedPlaces]);

  const hotelsByDay = useMemo(() => {
    const map = new Map<string, Hotel[]>();
    for (const day of dateOptions) {
      map.set(day, []);
    }
    for (const hotel of hotels) {
      for (const day of dateOptions) {
        if (day >= hotel.checkInDate && day <= hotel.checkOutDate) {
          map.get(day)!.push(hotel);
        }
      }
    }
    return map;
  }, [dateOptions, hotels]);

  const dayMeta = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });

    return dateOptions.map((date, index) => {
      const [year, month, day] = date.split('-').map(Number);
      const shortDate = formatter.format(new Date(Date.UTC(year, month - 1, day)));
      return {
        date,
        dayLabel: `Day ${index + 1}`,
        shortDate,
      };
    });
  }, [dateOptions]);

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    setSharedOrderLoaded(false);
    setErrorMessage(null);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      setLoading(false);
      return;
    }

    const [placesResult, flightsResult, hotelsResult, orderResult] = await Promise.all([
      listPlacesByTripId(client, tripId),
      listFlightsByTripId(client, tripId),
      listHotelsByTripId(client, tripId),
      getTripItineraryOrder(client, tripId),
    ]);
    setPlaces(placesResult.data);
    setFlights(flightsResult.data);
    setHotels(hotelsResult.data);
    setDayItemOrderByDay(orderResult.data);
    setSharedOrderLoaded(true);
    setErrorMessage([placesResult.error, flightsResult.error, hotelsResult.error, orderResult.error].filter(Boolean).join(' ') || null);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    void loadPlaces();
  }, [loadPlaces]);

  useEffect(() => {
    setDayItemOrderByDay((prev) => {
      const next: Record<string, string[]> = { ...prev };
      for (const day of dateOptions) {
        const defaultIds = defaultDayItemOrderByDay[day] ?? [];
        const current = next[day] ?? [];
        const kept = current.filter((id) => defaultIds.includes(id));
        const appended = defaultIds.filter((id) => !kept.includes(id));
        next[day] = normalizeFlightPairAdjacency([...kept, ...appended], flightItemById);
      }
      return next;
    });
  }, [dateOptions, defaultDayItemOrderByDay, flightItemById]);

  useEffect(() => {
    if (!sharedOrderLoaded) {
      return;
    }
    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      if (error) {
        setErrorMessage(error);
      }
      return;
    }
    void updateTripItineraryOrder(client, tripId, dayItemOrderByDay).then((result) => {
      if (result.error) {
        setErrorMessage(result.error);
      }
    });
  }, [dayItemOrderByDay, sharedOrderLoaded, tripId]);

  const persistReorder = async (updates: PlaceOrderUpdate[]) => {
    if (updates.length === 0) {
      return true;
    }

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return false;
    }

    const result = await reorderPlaces(client, updates);
    if (result.error) {
      setErrorMessage(result.error);
      await loadPlaces();
      return false;
    }

    return true;
  };

  const buildOrderedDay = (day: string, dayPlaces: Place[]): Place[] => {
    return dayPlaces.map((place, index) => ({
      ...place,
      visitDate: day,
      sortOrder: index + 1,
    }));
  };

  const handleSubmitAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) {
      return;
    }

    if (!addDate || !addName.trim()) {
      setErrorMessage('Please enter a place name.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setSaving(false);
      setErrorMessage(error);
      return;
    }

    const dayPlaces = groupedPlaces.get(addDate) ?? [];
    const nextSortOrder = dayPlaces.reduce((max, place) => Math.max(max, place.sortOrder), 0) + 1;

    const result = await addPlace(client, {
      tripId,
      visitDate: addDate,
      name: addName.trim(),
      address: addAddress.trim(),
      memo: addMemo.trim(),
      sortOrder: nextSortOrder,
    });

    setSaving(false);

    if (result.error || !result.data) {
      setErrorMessage(result.error ?? 'Failed to add place.');
      return;
    }

    setPlaces((prev) => [...prev, result.data!]);
    setAddName('');
    setAddAddress('');
    setAddMemo('');
    setAddDate(null);
  };

  const openEditDialog = (place: Place) => {
    if (!canEdit) {
      return;
    }

    setEditingPlace(place);
    setEditName(place.name);
    setEditAddress(place.address);
    setEditMemo(place.memo);
    setEditVisitDate(place.visitDate);
  };

  const handleSubmitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) {
      return;
    }

    if (!editingPlace || !editName.trim() || !dateOptions.includes(editVisitDate)) {
      setErrorMessage('Please check the form values.');
      return;
    }

    const oldDate = editingPlace.visitDate;
    const currentTargetPlaces = (groupedPlaces.get(editVisitDate) ?? []).filter((place) => place.id !== editingPlace.id);
    const sortOrderForUpdate = editVisitDate === oldDate ? editingPlace.sortOrder : currentTargetPlaces.length + 1;

    setSaving(true);
    setErrorMessage(null);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setSaving(false);
      setErrorMessage(error);
      return;
    }

    const updateResult = await updatePlace(client, {
      id: editingPlace.id,
      visitDate: editVisitDate,
      name: editName.trim(),
      address: editAddress.trim(),
      memo: editMemo.trim(),
      sortOrder: sortOrderForUpdate,
    });

    if (updateResult.error || !updateResult.data) {
      setSaving(false);
      setErrorMessage(updateResult.error ?? 'Failed to update place.');
      return;
    }

    let nextPlaces = places.map((place) => (place.id === editingPlace.id ? updateResult.data! : place));

    const affectedDates = oldDate === editVisitDate ? [oldDate] : [oldDate, editVisitDate];
    const reorderUpdates: PlaceOrderUpdate[] = [];

    for (const date of affectedDates) {
      const dayPlaces = nextPlaces
        .filter((place) => place.visitDate === date)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const ordered = buildOrderedDay(date, dayPlaces);

      nextPlaces = nextPlaces.map((place) => ordered.find((item) => item.id === place.id) ?? place);

      reorderUpdates.push(...ordered.map((place) => ({ id: place.id, visitDate: place.visitDate, sortOrder: place.sortOrder })));
    }

    setPlaces(nextPlaces);
    const success = await persistReorder(reorderUpdates);
    setSaving(false);

    if (!success) {
      return;
    }

    setEditingPlace(null);
  };

  const handleDelete = async () => {
    if (!canEdit || !deletingPlace) {
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setSaving(false);
      setErrorMessage(error);
      return;
    }

    const deleteResult = await deletePlace(client, deletingPlace.id);
    if (deleteResult.error) {
      setSaving(false);
      setErrorMessage(deleteResult.error);
      return;
    }

    const remaining = places.filter((place) => place.id !== deletingPlace.id);
    const dayPlaces = remaining
      .filter((place) => place.visitDate === deletingPlace.visitDate)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const ordered = buildOrderedDay(deletingPlace.visitDate, dayPlaces);

    const nextPlaces = remaining.map((place) => ordered.find((item) => item.id === place.id) ?? place);
    setPlaces(nextPlaces);

    const reorderUpdates = ordered.map((place) => ({
      id: place.id,
      visitDate: place.visitDate,
      sortOrder: place.sortOrder,
    }));

    const success = await persistReorder(reorderUpdates);
    setSaving(false);

    if (!success) {
      return;
    }

    setDeletingPlace(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (!canEdit) {
      return;
    }
    setActivePlaceId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canEdit) {
      setActivePlaceId(null);
      return;
    }

    const { active, over } = event;
    setActivePlaceId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = String(active.id);
    const activeItem = places.find((place) => place.id === activeId);
    if (!activeItem) {
      return;
    }

    const overId = String(over.id);
    const insertMatch = overId.match(/^insert:([^:]+):(\d+)$/);
    const overFlightItem = itineraryFlightItems.find((item) => item.id === overId);
    const overPlace = places.find((place) => place.id === overId);
    const sourceDate = activeItem.visitDate;
    const targetDate = insertMatch
      ? insertMatch[1]
      : dateOptions.includes(overId)
        ? overId
        : overPlace?.visitDate ?? overFlightItem?.visitDate;

    if (!targetDate) {
      return;
    }

    const nextDayItemOrderByDay: Record<string, string[]> = { ...dayItemOrderByDay };
    for (const day of dateOptions) {
      if (!nextDayItemOrderByDay[day]) {
        nextDayItemOrderByDay[day] = [...(defaultDayItemOrderByDay[day] ?? [])];
      }
    }

    nextDayItemOrderByDay[sourceDate] = nextDayItemOrderByDay[sourceDate].filter((id) => id !== activeId);
    const targetList = [...(nextDayItemOrderByDay[targetDate] ?? [])];
    let insertIndex = insertMatch
      ? Number(insertMatch[2])
      : overId === targetDate
        ? targetList.length
        : targetList.indexOf(overId);
    if (Number.isNaN(insertIndex) || insertIndex < 0) insertIndex = targetList.length;
    if (insertIndex > targetList.length) insertIndex = targetList.length;
    insertIndex = adjustInsertIndexAwayFromFlightGap(targetList, insertIndex, flightItemById);
    targetList.splice(insertIndex, 0, activeId);
    nextDayItemOrderByDay[targetDate] = normalizeFlightPairAdjacency(targetList, flightItemById);
    if (sourceDate !== targetDate) {
      nextDayItemOrderByDay[sourceDate] = normalizeFlightPairAdjacency(nextDayItemOrderByDay[sourceDate] ?? [], flightItemById);
    }
    setDayItemOrderByDay(nextDayItemOrderByDay);

    const updates: PlaceOrderUpdate[] = [];
    const placeMap = new Map(places.map((place) => [place.id, { ...place }]));
    const movedPlace = placeMap.get(activeId);
    if (!movedPlace) {
      return;
    }
    movedPlace.visitDate = targetDate;

    for (const day of dateOptions) {
      const orderedIds = nextDayItemOrderByDay[day] ?? [];
      let sortOrder = 1;
      for (const id of orderedIds) {
        const place = placeMap.get(id);
        if (!place || place.visitDate !== day) {
          continue;
        }
        place.sortOrder = sortOrder;
        updates.push({ id: place.id, visitDate: place.visitDate, sortOrder });
        sortOrder += 1;
      }
    }

    const nextPlaces = Array.from(placeMap.values());
    setPlaces(nextPlaces);
    setSaving(true);
    const success = await persistReorder(updates);
    setSaving(false);

    if (!success) {
      return;
    }
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
      {!canEdit && <Alert severity="info">Read-only mode.</Alert>}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Grid container spacing={1.5}>
          {dateOptions.map((date, index) => (
            <Grid key={date} size={{ xs: 12 }}>
              <DaySection
                date={date}
                places={groupedPlaces.get(date) ?? []}
                flights={groupedFlightItems.get(date) ?? []}
                orderedItemIds={dayItemOrderByDay[date] ?? defaultDayItemOrderByDay[date] ?? []}
                saving={saving}
                canEdit={canEdit}
                onOpenAdd={(selectedDate) => {
                  setAddDate(selectedDate);
                  setAddName('');
                  setAddAddress('');
                  setAddMemo('');
                }}
                dayLabel={dayMeta.find((item) => item.date === date)?.dayLabel ?? date}
                shortDate={dayMeta.find((item) => item.date === date)?.shortDate ?? date}
                onEdit={(place) => setPreviewPlace(place)}
                onDelete={(place) => setDeletingPlace(place)}
              />
              {index < dateOptions.length - 1 && (hotelsByDay.get(date)?.length ?? 0) > 0 && (
                <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={0.75} mt={1.25} px={0.5}>
                  {hotelsByDay.get(date)!.map((hotel) => (
                    <Chip
                      key={`${date}:${hotel.id}`}
                      icon={<HotelIcon fontSize="small" />}
                      label={hotel.name}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiChip-icon': { ml: 0.5 } }}
                    />
                  ))}
                </Stack>
              )}
            </Grid>
          ))}
        </Grid>

        <DragOverlay>
          {activePlace ? (
            <Paper variant="outlined" sx={{ p: 1, minWidth: 220 }}>
              <Typography variant="body2" fontWeight={700}>
                {activePlace.name}
              </Typography>
            </Paper>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={Boolean(previewPlace)} onClose={() => setPreviewPlace(null)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle>{previewPlace?.name ?? ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={0.5}>
            <Typography variant="body2" color="text.secondary">
              Visit date: {previewPlace?.visitDate}
            </Typography>
            {previewPlace?.address && <Typography variant="body2">{previewPlace.address}</Typography>}
            {previewPlace?.memo && (
              <>
                <Divider />
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {previewPlace.memo}
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewPlace(null)} color="inherit">
            Close
          </Button>
          {canEdit && previewPlace && (
            <Button
              variant="contained"
              onClick={() => {
                openEditDialog(previewPlace);
                setPreviewPlace(null);
              }}
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={canEdit && Boolean(addDate)} onClose={() => setAddDate(null)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <Box component="form" onSubmit={handleSubmitAdd}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add place</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} mt={0.5}>
              <TextField
                select
                label="visit_date"
                value={addDate ?? ''}
                onChange={(event) => setAddDate(event.target.value)}
                required
              >
                {dateOptions.map((date) => (
                  <MenuItem key={date} value={date}>
                    {date}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Place name"
                value={addName}
                onChange={(event) => setAddName(event.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Address (optional)"
                value={addAddress}
                onChange={(event) => setAddAddress(event.target.value)}
                fullWidth
              />
              <TextField
                label="Memo (optional)"
                value={addMemo}
                onChange={(event) => setAddMemo(event.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDate(null)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving || !addName.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={canEdit && Boolean(editingPlace)} onClose={() => setEditingPlace(null)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <Box component="form" onSubmit={handleSubmitEdit}>
          <DialogTitle sx={{ fontWeight: 700 }}>Edit place</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} mt={0.5}>
              <TextField label="Place name" value={editName} onChange={(event) => setEditName(event.target.value)} required />
              <TextField select label="visit_date" value={editVisitDate} onChange={(event) => setEditVisitDate(event.target.value)} required>
                {dateOptions.map((date) => (
                  <MenuItem key={date} value={date}>
                    {date}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Address (optional)" value={editAddress} onChange={(event) => setEditAddress(event.target.value)} />
              <TextField
                label="Memo (optional)"
                value={editMemo}
                onChange={(event) => setEditMemo(event.target.value)}
                multiline
                minRows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingPlace(null)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving || !editName.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={canEdit && Boolean(deletingPlace)} onClose={() => setDeletingPlace(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete place</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to delete this place?</Typography>
          <Typography variant="subtitle2" mt={1}>
            {deletingPlace?.name}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingPlace(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
