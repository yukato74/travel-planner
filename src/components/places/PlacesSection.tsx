'use client';

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
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
import List from '@mui/material/List';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PlaceItem } from '@/components/places/PlaceItem';
import { addPlace, deletePlace, listPlacesByTripId, reorderPlaces, updatePlace } from '@/lib/places/service';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { Place, PlaceOrderUpdate } from '@/lib/types/trip';

type PlacesSectionProps = {
  tripId: string;
  dateOptions: string[];
  canEdit?: boolean;
};

type DaySectionProps = {
  date: string;
  places: Place[];
  isAddOpen: boolean;
  addName: string;
  addAddress: string;
  addMemo: string;
  saving: boolean;
  canEdit: boolean;
  onOpenAdd: (date: string) => void;
  onCloseAdd: () => void;
  onChangeAddName: (value: string) => void;
  onChangeAddAddress: (value: string) => void;
  onChangeAddMemo: (value: string) => void;
  onSubmitAdd: (event: FormEvent<HTMLFormElement>) => void;
  onEdit: (place: Place) => void;
  onDelete: (place: Place) => void;
};

function DaySection({
  date,
  places,
  isAddOpen,
  addName,
  addAddress,
  addMemo,
  saving,
  canEdit,
  onOpenAdd,
  onCloseAdd,
  onChangeAddName,
  onChangeAddAddress,
  onChangeAddMemo,
  onSubmitAdd,
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
          <Typography variant="subtitle2" fontWeight={700}>
            {date}
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={() => onOpenAdd(date)} disabled={saving || !canEdit}>
            Add place
          </Button>
        </Stack>

        {canEdit && isAddOpen && (
          <Box component="form" onSubmit={onSubmitAdd}>
            <Stack spacing={1}>
              <TextField
                label="Place name"
                value={addName}
                onChange={(event) => onChangeAddName(event.target.value)}
                fullWidth
                required
                size="small"
              />
              <TextField
                label="Address (optional)"
                value={addAddress}
                onChange={(event) => onChangeAddAddress(event.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Memo (optional)"
                value={addMemo}
                onChange={(event) => onChangeAddMemo(event.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={2}
              />
              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Button type="button" size="small" color="inherit" onClick={onCloseAdd} startIcon={<CloseIcon />}>
                  Cancel
                </Button>
                <Button type="submit" size="small" variant="contained" disabled={saving || !addName.trim()}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}

        <Divider />

        <SortableContext items={places.map((place) => place.id)} strategy={verticalListSortingStrategy}>
          <List disablePadding>
            {places.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No places for this day yet.
              </Typography>
            ) : (
              places.map((place) => (
                <PlaceItem key={place.id} place={place} onEdit={onEdit} onDelete={onDelete} disabled={saving || !canEdit} />
              ))
            )}
          </List>
        </SortableContext>
      </Stack>
    </Paper>
  );
}

export function PlacesSection({ tripId, dateOptions, canEdit = true }: PlacesSectionProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [addDate, setAddDate] = useState<string | null>(null);
  const [addName, setAddName] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addMemo, setAddMemo] = useState('');

  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editVisitDate, setEditVisitDate] = useState('');

  const [deletingPlace, setDeletingPlace] = useState<Place | null>(null);

  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
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

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      setLoading(false);
      return;
    }

    const result = await listPlacesByTripId(client, tripId);
    setPlaces(result.data);
    setErrorMessage(result.error);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    void loadPlaces();
  }, [loadPlaces]);

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
    const overPlace = places.find((place) => place.id === overId);
    const sourceDate = activeItem.visitDate;
    const targetDate = dateOptions.includes(overId) ? overId : overPlace?.visitDate;

    if (!targetDate) {
      return;
    }

    const dayMap = new Map<string, Place[]>();
    for (const day of dateOptions) {
      dayMap.set(day, (groupedPlaces.get(day) ?? []).map((place) => ({ ...place })));
    }

    const sourceItems = dayMap.get(sourceDate) ?? [];
    const oldIndex = sourceItems.findIndex((place) => place.id === activeItem.id);
    if (oldIndex < 0) {
      return;
    }

    if (sourceDate === targetDate) {
      const targetItems = dayMap.get(targetDate) ?? [];
      const overIndex = overPlace ? targetItems.findIndex((place) => place.id === overPlace.id) : targetItems.length - 1;
      const normalizedTargetIndex = overId === targetDate ? targetItems.length - 1 : overIndex;
      const moved = arrayMove(targetItems, oldIndex, Math.max(0, normalizedTargetIndex));
      dayMap.set(targetDate, moved);
    } else {
      const targetItems = dayMap.get(targetDate) ?? [];
      const withoutActive = sourceItems.filter((place) => place.id !== activeItem.id);
      const movedItem = { ...activeItem, visitDate: targetDate };

      const insertIndex = overPlace ? targetItems.findIndex((place) => place.id === overPlace.id) : targetItems.length;
      const safeIndex = insertIndex < 0 ? targetItems.length : insertIndex;

      const nextTarget = [...targetItems];
      nextTarget.splice(safeIndex, 0, movedItem);

      dayMap.set(sourceDate, withoutActive);
      dayMap.set(targetDate, nextTarget);
    }

    const updates: PlaceOrderUpdate[] = [];
    const nextPlaces: Place[] = [];

    for (const day of dateOptions) {
      const ordered = buildOrderedDay(day, dayMap.get(day) ?? []);
      for (const place of ordered) {
        updates.push({ id: place.id, visitDate: place.visitDate, sortOrder: place.sortOrder });
        nextPlaces.push(place);
      }
    }

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
      {!canEdit && <Alert severity="info">Read-only mode. Log in as the owner to edit.</Alert>}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Grid container spacing={1.5}>
          {dateOptions.map((date) => (
            <Grid key={date} size={{ xs: 12 }}>
              <DaySection
                date={date}
                places={groupedPlaces.get(date) ?? []}
                isAddOpen={addDate === date}
                addName={addName}
                addAddress={addAddress}
                addMemo={addMemo}
                saving={saving}
                canEdit={canEdit}
                onOpenAdd={(selectedDate) => {
                  setAddDate(selectedDate);
                  setAddName('');
                  setAddAddress('');
                  setAddMemo('');
                }}
                onCloseAdd={() => setAddDate(null)}
                onChangeAddName={setAddName}
                onChangeAddAddress={setAddAddress}
                onChangeAddMemo={setAddMemo}
                onSubmitAdd={handleSubmitAdd}
                onEdit={openEditDialog}
                onDelete={(place) => setDeletingPlace(place)}
              />
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

      <Dialog open={canEdit && Boolean(editingPlace)} onClose={() => setEditingPlace(null)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSubmitEdit}>
          <DialogTitle>Edit place</DialogTitle>
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
