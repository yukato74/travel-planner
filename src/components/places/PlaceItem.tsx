'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
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
      }}
    >
      <Stack direction="row" spacing={1} width="100%" alignItems="flex-start">
        <IconButton
          size="small"
          edge="start"
          aria-label="ドラッグハンドル"
          {...attributes}
          {...listeners}
          disabled={disabled}
          sx={{ mt: 0.2 }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" fontWeight={600}>
            {place.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {place.address || '住所未設定'}
            {place.memo ? ` | ${place.memo}` : ''}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" aria-label="編集" onClick={() => onEdit(place)} disabled={disabled}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="削除" onClick={() => onDelete(place)} disabled={disabled}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </ListItem>
  );
}
