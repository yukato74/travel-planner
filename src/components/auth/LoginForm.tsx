'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { FormEvent, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const actionButtonSx = { minHeight: 40 };

  const sendOtpCode = async () => {
    const requestId = ++requestIdRef.current;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsRedirecting(false);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      if (requestId === requestIdRef.current) {
        setErrorMessage(error);
      }
      return false;
    }

    setLoading(true);

    const { error: signInError } = await client.auth.signInWithOtp({
      email: email.trim(),
    });

    if (requestId !== requestIdRef.current) {
      return false;
    }

    setLoading(false);

    if (signInError) {
      setErrorMessage(`Failed to send verification code: ${signInError.message}`);
      return false;
    }

    setIsOtpStep(true);
    setOtpCode('');
    setSuccessMessage('Verification code sent. Enter the 6-digit code from your email.');
    return true;
  };

  const handleSendOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendOtpCode();
  };

  const handleResendClick = () => {
    void sendOtpCode();
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requestId = ++requestIdRef.current;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsRedirecting(false);

    const { client, error } = getSupabaseBrowserClient();
    if (!client) {
      if (requestId === requestIdRef.current) {
        setErrorMessage(error);
      }
      return;
    }

    setLoading(true);

    const { error: verifyError } = await client.auth.verifyOtp({
      email: email.trim(),
      token: otpCode.trim(),
      type: 'email',
    });

    if (requestId !== requestIdRef.current) {
      return;
    }

    setLoading(false);

    if (verifyError) {
      setErrorMessage(`Failed to verify code: ${verifyError.message}`);
      return;
    }

    setIsRedirecting(true);
    setSuccessMessage('Signed in successfully.');
    router.replace(nextPath);
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Stack component="form" spacing={2.5} onSubmit={isOtpStep ? handleVerifyOtp : handleSendOtpSubmit}>
        <Typography variant="h5" fontWeight={700}>
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isOtpStep ? 'Enter the 6-digit verification code sent to your email.' : 'Enter your email to receive a 6-digit verification code.'}
        </Typography>

        {errorMessage && !isRedirecting && <Alert severity="error">{errorMessage}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          fullWidth
          required
          disabled={isOtpStep || loading}
        />

        {isOtpStep && (
          <TextField
            label="Verification code"
            type="text"
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]{6}', autoComplete: 'one-time-code' }}
            fullWidth
            required
          />
        )}

        <Stack spacing={1.25}>
          {isOtpStep && (
            <Button type="button" variant="outlined" fullWidth sx={actionButtonSx} disabled={loading || isRedirecting} onClick={handleResendClick}>
              Resend code
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={actionButtonSx}
            disabled={loading || isRedirecting || (isOtpStep && otpCode.length !== 6)}
          >
            {loading ? (isOtpStep ? 'Verifying...' : 'Sending...') : isOtpStep ? 'Verify Code' : 'Send Code'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
