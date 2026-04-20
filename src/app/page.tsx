import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack spacing={3}>
        <Typography variant="h3" fontSize={{ xs: '2rem', md: '2.5rem' }} fontWeight={700}>
          Travel Planner
        </Typography>
        <Typography variant="body1" color="text.secondary">
          旅行の行程・フライト・ホテル・行きたい場所・メモをまとめて管理するための、実用重視のシンプルなWebアプリです。
        </Typography>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                はじめる
              </Typography>
              <Typography variant="body2" color="text.secondary">
                仮のログイン画面に進むか、ダッシュボードでダミーデータの旅行プランを確認できます。
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button component={Link} href="/login" variant="outlined" endIcon={<ArrowForwardIcon />}>
                  ログインページへ
                </Button>
                <Button component={Link} href="/dashboard" variant="contained" endIcon={<ArrowForwardIcon />}>
                  ダッシュボードへ
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
