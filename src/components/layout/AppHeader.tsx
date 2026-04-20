import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { signOutAction } from '@/app/auth/actions';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

const baseLinks = [
  { href: '/', label: 'Top' },
  { href: '/dashboard', label: 'Dashboard' },
];

export async function AppHeader() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap={2}>
            <Typography component={Link} href="/" variant="h6" fontWeight={700} color="text.primary" sx={{ textDecoration: 'none' }}>
              Travel Planner
            </Typography>

            <Box display="flex" flexWrap="wrap" alignItems="center" gap={1}>
              {baseLinks.map((item) => (
                <Button key={item.href} component={Link} href={item.href} color="inherit" size="small">
                  {item.label}
                </Button>
              ))}

              {user ? (
                <>
                  <Chip label={user.email ?? 'Logged in'} size="small" color="primary" variant="outlined" />
                  <form action={signOutAction}>
                    <Button type="submit" color="inherit" size="small" variant="outlined">
                      Logout
                    </Button>
                  </form>
                </>
              ) : (
                <Button component={Link} href="/login" color="inherit" size="small">
                  Login
                </Button>
              )}
            </Box>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
