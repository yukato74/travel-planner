'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Place } from '@/lib/types/trip';

type PlaceItemProps = {
  place: Place;
  onEdit: (place: Place) => void;
  onDelete: (place: Place) => void;
  disabled?: boolean;
};

export function PlaceItem({ place, onEdit, onDelete, disabled = false }: PlaceItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: place.id,
    data: {
      type: 'place',
      visitDate: place.visitDate,
    },
    disabled,
  });

  return (
    <ListItem
      ref={setNodeRef}
      disablePadding
      onClick={() => {
        if (!disabled) {
          onEdit(place);
        }
      }}
      sx={{
        p: 1,
        mb: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        opacity: isDragging ? 0.6 : 1,
        transform: CSS.Translate.toString(transform),
        transition,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <Stack direction="row" spacing={1} width="100%" alignItems="flex-start">
        <IconButton
          size="small"
          edge="start"
          aria-label="Drag handle"
          {...attributes}
          {...listeners}
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
          sx={{ mt: 0.2, touchAction: 'none' }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" fontWeight={600}>
            {place.name}
          </Typography>
          {place.address && (
            <Typography variant="body2" color="text.secondary">
              {place.address}
            </Typography>
          )}
          {place.memo && <Typography variant="body2" color="text.secondary">{place.memo}</Typography>}
        </Box>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(place);
            }}
            disabled={disabled}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </ListItem>
  );
}
