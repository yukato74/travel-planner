'use client';

import FlightLandIcon from '@mui/icons-material/FlightLand';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Flight } from '@/lib/types/trip';

type FlightPreviewContentProps = {
  flight: Flight;
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

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateLabel(value: string): string {
  const [datePart] = value.split('T');
  const [, month, day] = datePart.split('-');
  if (!month || !day) {
    return value;
  }
  const monthLabel = MONTH_LABELS[Number(month) - 1] ?? month;
  return `${monthLabel} ${Number(day)}`;
}

function formatTime(value: string): string {
  const [, timePart = ''] = value.split('T');
  const hhmm = timePart.slice(0, 5);
  return hhmm || '-';
}

export function FlightPreviewContent({ flight }: FlightPreviewContentProps) {
  return (
    <Stack spacing={2.5} mt={0.5}>
      <Divider />
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <FlightTakeoffIcon color="action" sx={{ fontSize: 18 }} />
          <Typography variant="body1" color="text.secondary">
            {formatAirportDisplayName(flight.departureAirport)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.25} alignItems="baseline">
          <Typography variant="h4" fontWeight={700} lineHeight={1.15}>
            {formatTime(flight.departureTime)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDateLabel(flight.departureTime)}
          </Typography>
        </Stack>
      </Stack>

      <Stack spacing={0.75}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <FlightLandIcon color="action" sx={{ fontSize: 18 }} />
          <Typography variant="body1" color="text.secondary">
            {formatAirportDisplayName(flight.arrivalAirport)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.25} alignItems="baseline">
          <Typography variant="h4" fontWeight={700} lineHeight={1.15}>
            {formatTime(flight.arrivalTime)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDateLabel(flight.arrivalTime)}
          </Typography>
        </Stack>
      </Stack>

      {flight.memo && (
        <>
          <Divider />
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
            {flight.memo}
          </Typography>
        </>
      )}
    </Stack>
  );
}
