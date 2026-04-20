import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { listTrips } from '@/lib/trips/service';

export default function DashboardPage() {
  const trips = listTrips();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          gap={2}
        >
          <Stack spacing={0.75}>
            <Typography variant="h4" fontSize={{ xs: '1.7rem', md: '2rem' }} fontWeight={700}>
              自分の旅行一覧
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ダミーデータで表示中。後続でユーザーごとの取得ロジックに置き換え可能です。
            </Typography>
          </Stack>
          <Button variant="contained" startIcon={<AddIcon />}>
            新しい旅行を作成
          </Button>
        </Stack>

        <Grid container spacing={2}>
          {trips.map((trip) => {
            const isProtected = trip.share.enabled && trip.share.requiresPassword;
            return (
              <Grid key={trip.id} size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Typography variant="h6" fontWeight={700}>
                        {trip.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {trip.startDate} - {trip.endDate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {trip.summary}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          icon={isProtected ? <LockIcon /> : <PublicIcon />}
                          label={isProtected ? '共有保護あり' : '公開共有'}
                          size="small"
                          color={isProtected ? 'warning' : 'success'}
                        />
                      </Stack>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button component={Link} href={`/trip/${trip.id}`} variant="outlined" size="small">
                      詳細を見る
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Stack>
    </Container>
  );
}
