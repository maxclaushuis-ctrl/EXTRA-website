import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileHeader } from '@/components/employee/MobileHeader';
import { PointsHeader } from '@/components/employee/PointsHeader';
import { RewardTabs } from '@/components/employee/RewardTabs';

function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError('Inloggen mislukt. Controleer je e-mailadres en wachtwoord.');
      }
    } catch {
      setError('Er ging iets mis bij het inloggen. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">EXTRAATJE</h1>
          <p className="text-white/60 text-sm mt-2">Log in om je punten en beloningen te bekijken</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="jij@voorbeeld.nl"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-2.5 transition-colors"
          >
            {submitting ? 'Bezig met inloggen...' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (!isLoading) setBootstrapped(true);
  }, [isLoading]);

  if (!bootstrapped) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="animate-pulse text-[#00AAFF]">Laden...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  return (
    <div className="employee-dashboard flex flex-col min-h-screen">
      <MobileHeader title="EXTRAATJE" showBackButton={false} />

      <div className="flex-1">
        <PointsHeader />

        <main className="px-4">
          <RewardTabs />
        </main>
      </div>
    </div>
  );
}
