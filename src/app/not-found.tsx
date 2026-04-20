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
          ページが見つかりません
        </Typography>
        <Typography color="text.secondary">URLを確認するか、ダッシュボードから旅行を選択してください。</Typography>
        <Button component={Link} href="/dashboard" variant="contained">
          ダッシュボードへ戻る
        </Button>
      </Stack>
    </Container>
  );
}
