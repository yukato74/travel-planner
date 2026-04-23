import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={2}>
        <Typography variant="h4" fontWeight={700}>
          Page not found
        </Typography>
        <Typography color="text.secondary">Check the URL or choose a trip from the menu.</Typography>
        <Button component={Link} href="/" variant="contained">
          Back to home
        </Button>
      </Stack>
    </Container>
  );
}
