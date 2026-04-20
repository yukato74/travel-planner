import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

const links = [
  { href: '/', label: 'Top' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/login', label: 'Login' },
];

export function AppHeader() {
  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap={2}>
            <Typography component={Link} href="/" variant="h6" fontWeight={700} color="text.primary" sx={{ textDecoration: 'none' }}>
              Travel Planner
            </Typography>

            <Box display="flex" flexWrap="wrap" gap={1}>
              {links.map((item) => (
                <Button key={item.href} component={Link} href={item.href} color="inherit" size="small">
                  {item.label}
                </Button>
              ))}
            </Box>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
