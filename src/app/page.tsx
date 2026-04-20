import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

export default async function HomePage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack alignItems="center">
        <Button href="/login" variant="contained" size="large">
          Login
        </Button>
      </Stack>
    </Container>
  );
}
