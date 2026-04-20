import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack spacing={2.5}>
          <Typography variant="h5" fontWeight={700}>
            ログイン
          </Typography>
          <Typography variant="body2" color="text.secondary">
            現段階は UI のみです。後続で Supabase Auth などに置き換える前提の仮実装です。
          </Typography>

          <TextField label="メールアドレス" type="email" fullWidth />
          <TextField label="パスワード" type="password" fullWidth />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
            <Button component={Link} href="/" variant="text">
              トップへ戻る
            </Button>
            <Button component={Link} href="/dashboard" variant="contained">
              ログイン (仮)
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
