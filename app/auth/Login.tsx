import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('Error logging in:', error);
      toast.error('Failed to log in');
    } else {
      toast.success('Logged in successfully');
    }
    setIsLoading(false);
  };

  const handleSSOLogin = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
      },
    });

    if (error) {
      console.error('Error logging in:', error);
      toast.error('Failed to log in');
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button onClick={handleEmailSignIn} disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in with Email'}
      </Button>
      <Button onClick={() => handleSSOLogin('google')}>Login with Google</Button>
      <Button onClick={() => handleSSOLogin('github')}>Login with GitHub</Button>
    </div>
  );
};

export default Login; 