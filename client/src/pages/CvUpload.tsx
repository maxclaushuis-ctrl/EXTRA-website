import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type State = 'loading' | 'ready' | 'uploading' | 'success' | 'already_uploaded' | 'invalid' | 'error';

export default function CvUpload() {
  const [state, setState] = useState<State>('loading');
  const [firstName, setFirstName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }
    fetch(`/api/cv-upload-token?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid === false) {
          setState('already_uploaded');
        } else if (data.valid) {
          setFirstName(data.firstName || '');
          setState('ready');
        } else {
          setState('invalid');
        }
      })
      .catch(() => setState('invalid'));
  }, [token]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(f.type)) {
      setErrorMsg('Alleen PDF, DOC of DOCX bestanden zijn toegestaan.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg('Maximaal 10 MB toegestaan.');
      return;
    }
    setErrorMsg('');
    setFile(f);
  }

  async function handleUpload() {
    if (!file || !token) return;
    setState('uploading');
    try {
      const fd = new FormData();
      fd.append('cv', file);
      fd.append('token', token);
      const res = await fetch('/api/cv-upload-token', { method: 'POST', body: fd });
      if (res.ok) {
        setState('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || 'Er is iets misgegaan. Probeer het opnieuw.');
        setState('ready');
      }
    } catch {
      setErrorMsg('Verbindingsfout. Controleer je internet en probeer opnieuw.');
      setState('ready');
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0310' }}>
      {/* Banner */}
      <div className="w-full" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #5b21b6 100%)', padding: '0' }}>
        <div className="max-w-xl mx-auto px-6 py-8 text-center">
          <div className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            EXTRA
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-10">

        {/* Loading */}
        {state === 'loading' && (
          <div className="bg-white rounded-2xl p-10 text-center shadow-2xl">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Bezig met laden...</p>
          </div>
        )}

        {/* Invalid token */}
        {state === 'invalid' && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Ongeldige of verlopen link
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Deze uploadlink is ongeldig of al gebruikt. Heb je vragen? Stuur ons een bericht via WhatsApp.
            </p>
            <a
              href="https://wa.me/31851305915"
              className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              App ons op WhatsApp
            </a>
          </div>
        )}

        {/* Already uploaded */}
        {state === 'already_uploaded' && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              CV al ontvangen
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              We hebben je cv al ontvangen. Je hoort van ons zodra we je aanmelding bekeken hebben.
            </p>
          </div>
        )}

        {/* Ready to upload */}
        {(state === 'ready' || state === 'uploading') && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl">
            <h1 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Upload je cv{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Zodra we je cv hebben ontvangen, bekijken we je aanmelding. Als er een goede match is, sturen we je snel een uitnodiging voor een gesprek.
            </p>

            {/* Drop zone */}
            <div
              onClick={() => state !== 'uploading' && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                file
                  ? 'border-green-400 bg-green-50/50'
                  : 'border-gray-200 bg-gray-50/50 hover:border-purple-400 hover:bg-purple-50/50'
              } ${state === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                disabled={state === 'uploading'}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                  <p className="text-sm font-bold text-green-700">{file.name}</p>
                  <p className="text-xs text-green-600">
                    {(file.size / 1024 / 1024).toFixed(1)} MB ·{' '}
                    <span className="underline">Ander bestand kiezen</span>
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <p className="text-sm font-bold text-gray-700">Kies bestand</p>
                  <p className="text-xs text-gray-400">PDF, DOC of DOCX (max. 10 MB)</p>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="mt-3 flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || state === 'uploading'}
              className="w-full mt-6 h-14 text-base font-bold rounded-xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state === 'uploading' ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Bezig met uploaden...
                </span>
              ) : (
                'Cv uploaden'
              )}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Heb je vragen?{' '}
              <a href="https://wa.me/31851305915" className="text-purple-600 underline">
                App ons op WhatsApp
              </a>
            </p>
          </div>
        )}

        {/* Success */}
        {state === 'success' && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-500/20">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              CV ontvangen!
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Super, we hebben je cv goed ontvangen{firstName ? `, ${firstName}` : ''}. Ons team bekijkt je aanmelding en je hoort van ons zodra er een match is.
            </p>
            <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-5 text-left mb-6">
              <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                <span>📬</span> Wat gebeurt er nu?
              </h3>
              <ol className="space-y-2.5">
                {[
                  'Ons team bekijkt je aanmelding en cv — dit duurt meestal 1 tot 2 werkdagen.',
                  'Als je profiel past, sturen we je een uitnodiging voor een gesprek.',
                  'Na het gesprek hoor je snel of je welkom bent bij EXTRA!',
                ].map((t, i) => (
                  <li key={i} className="flex gap-3 text-sm text-purple-800">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
            <a
              href="https://www.instagram.com/doehetextra/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
            >
              Volg ons op Instagram @doehetextra
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
