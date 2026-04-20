import { redirect } from 'next/navigation';
import Container from '@mui/material/Container';
import { LoginForm } from '@/components/auth/LoginForm';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith('/') ? params.next : '/dashboard';

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(nextPath);
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <LoginForm nextPath={nextPath} />
    </Container>
  );
}
