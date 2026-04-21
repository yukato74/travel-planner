'use client';

import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
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
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  departureLabel: string;
  arrivalLabel: string;
  flightInfo: string;
  departureTime: string;
};

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

function formatAirportCode(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '-';
  }
  const nameAndCode = trimmed.split(' · ')[0]?.trim() ?? trimmed;
  const match = nameAndCode.match(/^(.*?)\s*\(([A-Za-z0-9]{3,4})\)\s*$/);
  if (match) {
    const name = match[1]?.trim() ?? '';
    const code = (match[2] ?? '').toUpperCase();
    return code || name || trimmed;
  }
  return nameAndCode;
}

function formatFlightLine(place: string, dateTime: string): string {
  return `${formatAirportCode(place)} · ${formatMonthDayTime(dateTime)}`;
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function isBlockedBoundary(ids: string[], index: number, flightItemById: Map<string, ItineraryFlightItem>): boolean {
  void ids;
  void index;
  void flightItemById;
  return false;
}

function normalizeFlightPairAdjacency(ids: string[], flightItemById: Map<string, ItineraryFlightItem>): string[] {
  void flightItemById;
  return [...ids];
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
}: {
  item: ItineraryFlightItem;
}) {
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
      }}
    >
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FlightTakeoffIcon fontSize="small" color="action" />
          <Typography variant="body1" fontWeight={600}>
            {item.departureLabel}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'left' }}>
          {item.flightInfo}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <FlightLandIcon fontSize="small" color="action" />
          <Typography variant="body1" fontWeight={600}>
            {item.arrivalLabel}
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
        height: 12,
        my: 0,
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
        height: 12,
        my: 0,
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
      <Stack spacing={0}>
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
                    const shouldShowInsertAfter = !isBlockedBoundary(orderedItemIds, index + 1, flightItemById);
                    return (
                      <Box key={flight.id}>
                        <FlightItem item={flight} />
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
  const previewPlaceHistoryPushedRef = useRef(false);
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
    useSensor(MouseSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 6 } }),
  );
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const activeId = String(args.active.id);
    const pointerCollisions = pointerWithin(args).filter((collision) => String(collision.id) !== activeId);
    const insertCollisions = pointerCollisions.filter((collision) => String(collision.id).startsWith('insert:'));
    if (insertCollisions.length > 0) {
      return insertCollisions;
    }
    const nonDayCollisions = pointerCollisions.filter((collision) => !dateOptions.includes(String(collision.id)));
    if (nonDayCollisions.length > 0) {
      return nonDayCollisions;
    }
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return rectIntersection(args);
  }, [dateOptions]);

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
      if (daySet.has(departureDate)) {
        items.push({
          id: `flight:${flight.id}`,
          flightId: flight.id,
          visitDate: departureDate,
          departureLabel: formatFlightLine(flight.departureAirport, flight.departureTime),
          arrivalLabel: formatFlightLine(flight.arrivalAirport, flight.arrivalTime),
          flightInfo: `${flight.airline} ${flight.flightNumber}`.trim(),
          departureTime: flight.departureTime,
        });
      }
    }
    return items.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
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
      const flightIds = dayFlights.map((item) => item.id);
      const placeIds = (groupedPlaces.get(day) ?? []).map((place) => place.id);
      order[day] = [...flightIds, ...placeIds];
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
        if (day >= hotel.checkInDate && day < hotel.checkOutDate) {
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

  const openPreviewPlace = (place: Place) => {
    setPreviewPlace(place);
    if (typeof window !== 'undefined') {
      window.history.pushState({ ...window.history.state, previewModal: 'place' }, '');
      previewPlaceHistoryPushedRef.current = true;
    }
  };

  const closePreviewPlace = useCallback(() => {
    if (previewPlaceHistoryPushedRef.current && typeof window !== 'undefined') {
      previewPlaceHistoryPushedRef.current = false;
      window.history.back();
      return;
    }
    setPreviewPlace(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handlePopState = () => {
      if (previewPlaceHistoryPushedRef.current || previewPlace) {
        previewPlaceHistoryPushedRef.current = false;
        setPreviewPlace(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [previewPlace]);

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
    const overIndex = targetList.indexOf(overId);
    let insertIndex = insertMatch
      ? Number(insertMatch[2])
      : overId === targetDate
        ? (() => {
            const translated = active.rect.current.translated;
            if (!translated) return targetList.length;
            const activeCenterY = translated.top + translated.height / 2;
            const overMidY = over.rect.top + over.rect.height / 2;
            return activeCenterY <= overMidY ? 0 : targetList.length;
          })()
        : (() => {
            if (overIndex < 0) return targetList.length;
            const translated = active.rect.current.translated;
            if (!translated) return overIndex;
            const activeCenterY = translated.top + translated.height / 2;
            const overMidY = over.rect.top + over.rect.height / 2;
            return activeCenterY <= overMidY ? overIndex : overIndex + 1;
          })();
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

      <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                onEdit={openPreviewPlace}
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

      <Dialog
        open={Boolean(previewPlace)}
        onClose={closePreviewPlace}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        sx={{ '& .MuiDialog-paperFullScreen': { bgcolor: 'background.paper' } }}
      >
        <Box sx={{ minHeight: '100%', mt: 'env(safe-area-inset-top)', bgcolor: 'background.paper' }}>
        <DialogTitle sx={{ pb: 1, bgcolor: 'transparent' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <IconButton onClick={closePreviewPlace} color="inherit" aria-label="Back">
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            {canEdit && previewPlace && (
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  previewPlaceHistoryPushedRef.current = false;
                  openEditDialog(previewPlace);
                  setPreviewPlace(null);
                }}
              >
                Edit
              </Button>
            )}
          </Stack>
          <Typography variant="h5" fontWeight={700} mt={0.5}>
            {previewPlace?.name ?? ''}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={0.5}>
            <Typography variant="body1" color="text.secondary">
              Visit date: {previewPlace?.visitDate}
            </Typography>
            {previewPlace?.address && (
              isHttpUrl(previewPlace.address) ? (
                <Typography
                  variant="body1"
                  component="a"
                  href={previewPlace.address}
                  target="_blank"
                  rel="noreferrer noopener"
                  sx={{ textDecoration: 'underline' }}
                >
                  {previewPlace.address}
                </Typography>
              ) : (
                <Typography variant="body1">{previewPlace.address}</Typography>
              )
            )}
            {previewPlace?.memo && (
              <>
                <Divider />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                  {previewPlace.memo}
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>
        </Box>
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

      <Dialog
        open={canEdit && Boolean(editingPlace)}
        onClose={() => setEditingPlace(null)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        sx={{ '& .MuiDialog-paperFullScreen': { bgcolor: 'background.paper' } }}
      >
        <Box component="form" onSubmit={handleSubmitEdit} sx={{ minHeight: '100%', mt: 'env(safe-area-inset-top)', bgcolor: 'background.paper' }}>
          <DialogTitle sx={{ fontWeight: 700, bgcolor: 'transparent' }}>Edit place</DialogTitle>
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
