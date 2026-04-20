import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ReactNode } from 'react';

type TripSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function TripSectionCard({ title, description, children }: TripSectionCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack gap={0.5} mb={2}>
          <Typography variant="h6" fontSize="1.05rem" fontWeight={700}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Stack>
        {children}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <Button size="small" startIcon={<AddIcon fontSize="small" />}>
          Add
        </Button>
        <Button size="small" startIcon={<EditIcon fontSize="small" />}>
          Edit
        </Button>
      </CardActions>
    </Card>
  );
}
