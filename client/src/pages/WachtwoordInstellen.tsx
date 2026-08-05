/**
 * Wachtwoord instellen via de eenmalige link uit de e-mail
 * (/wachtwoord-instellen?token=…). Eisen: min. 12 tekens, letters én cijfers.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import extraLogo from '@assets/extra-logo-zwart.svg';

export default function WachtwoordInstellen() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);
  const [klaar, setKlaar] = useState(false);

  const sterkGenoeg = pw1.length >= 12 && /[a-zA-Z]/.test(pw1) && /[0-9]/.test(pw1);

  const opslaan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFout('');
    if (!sterkGenoeg) { setFout('Minimaal 12 tekens, met minstens één letter en één cijfer.'); return; }
    if (pw1 !== pw2) { setFout('De wachtwoorden komen niet overeen.'); return; }
    setBezig(true);
    try {
      await apiRequest('POST', '/api/auth/wachtwoord-instellen', { token, password: pw1 });
      setKlaar(true);
    } catch (err: any) {
      setFout(err?.data?.message || err?.message || 'Er ging iets mis');
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <img src={extraLogo} alt="EXTRA" className="h-8 w-auto mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Wachtwoord instellen</h1>
          <p className="text-gray-500 mt-1 text-sm">Kies een sterk wachtwoord voor je admin-account.</p>
        </div>
        {klaar ? (
          <div className="text-center space-y-4">
            <p className="text-green-600 font-medium">Je wachtwoord is ingesteld ✓</p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => { window.location.href = '/dashboard'; }}>
              Naar het dashboard
            </Button>
          </div>
        ) : !token ? (
          <p className="text-red-500 text-sm text-center">Deze link is ongeldig. Vraag op de loginpagina een nieuwe aan via "Wachtwoord vergeten?".</p>
        ) : (
          <form onSubmit={opslaan} className="space-y-4">
            {/*
              autoComplete="new-password" op beide velden: zonder deze hint gokt
              de wachtwoordmanager van de browser zelf bij welk account dit nieuwe
              wachtwoord hoort (meestal het laatst-gebruikte opgeslagen account op
              dit domein) — dat leidde tot een "wachtwoord bijgewerkt voor account
              X" melding die niets met het daadwerkelijke, token-gebonden account
              op de server te maken had. Deze pagina toont bewust geen e-mailadres
              (dat zou verklappen bij welk account de link hoort vóór het token is
              gevalideerd), dus een "echt" username-veld kan hier niet.
            */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nieuw wachtwoord</label>
              <Input type="password" value={pw1} onChange={e => setPw1(e.target.value)} autoComplete="new-password" autoFocus required />
              <p className={`text-xs mt-1 ${sterkGenoeg ? 'text-green-600' : 'text-gray-400'}`}>
                Minimaal 12 tekens, met minstens één letter en één cijfer.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Herhaal wachtwoord</label>
              <Input type="password" value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" required />
            </div>
            {fout && <p className="text-red-500 text-sm">{fout}</p>}
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={bezig}>
              {bezig ? 'Bezig…' : 'Wachtwoord opslaan'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
