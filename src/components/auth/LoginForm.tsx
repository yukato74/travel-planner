'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      setErrorMessage(error);
      return;
    }

    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error: signInError } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setLoading(false);

    if (signInError) {
      setErrorMessage(`Magic Link の送信に失敗しました: ${signInError.message}`);
      return;
    }

    setSuccessMessage('Magic Link を送信しました。メール内のリンクからログインしてください。');
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
        <Typography variant="h5" fontWeight={700}>
          ログイン
        </Typography>
        <Typography variant="body2" color="text.secondary">
          メールアドレスへ Magic Link を送信します。
        </Typography>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <TextField
          label="メールアドレス"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          fullWidth
          required
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
          <Button component={Link} href="/" variant="text">
            トップへ戻る
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? '送信中...' : 'Magic Link を送信'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
