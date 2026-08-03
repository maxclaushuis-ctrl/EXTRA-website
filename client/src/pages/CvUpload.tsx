import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Upload, AlertCircle, Loader2, FileText, X } from 'lucide-react';
import { fetchJson } from '@/lib/queryClient';

type State = 'loading' | 'ready' | 'uploading' | 'success' | 'already_uploaded' | 'invalid' | 'error';

export default function CvUpload() {
  const [state, setState] = useState<State>('loading');
  const [firstName, setFirstName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    document.title = 'Upload je cv | EXTRA';
    if (!token) { setState('invalid'); return; }
    // Een serverfout is iets anders dan een ongeldige link. Met het oude
    // `.then(r => r.json())` kwam een HTTP 500 binnen als een gewoon object
    // zonder `valid`, en kreeg de kandidaat "Ongeldige of verlopen link" te
    // zien terwijl zijn link prima was — die stuurt hem definitief weg.
    // fetchJson gooit bij een foutstatus, zodat we dat onderscheid kunnen maken.
    fetchJson<{ valid?: boolean; firstName?: string }>(
      `/api/cv-upload-token?token=${encodeURIComponent(token)}`,
    )
      .then(data => {
        if (data.valid === false) { setState('already_uploaded'); }
        else if (data.valid) { setFirstName(data.firstName || ''); setState('ready'); }
        else { setState('invalid'); }
      })
      .catch(() => setState('error'));
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
      setFile(null);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg('Je bestand is te groot. Maximaal 10 MB toegestaan.');
      setFile(null);
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f3ff', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #170926 50%, #2d1060 100%)' }}>
        <div className="max-w-lg mx-auto px-6 py-6 flex items-center justify-center">
          <span className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>
            EXTRA
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">

          {/* Loading */}
          {state === 'loading' && (
            <div className="bg-white rounded-3xl p-10 text-center shadow-xl shadow-purple-100">
              <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" style={{ color: '#7c3aed' }} />
              <p className="text-gray-500 text-sm">Bezig met laden…</p>
            </div>
          )}

          {/* Invalid token */}
          {state === 'invalid' && (
            <div className="bg-white rounded-3xl p-8 text-center shadow-xl shadow-purple-100">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h1 className="text-xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Ongeldige of verlopen link
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Deze uploadlink is al gebruikt of niet meer geldig. Heb je nog geen cv geüpload? App ons even.
              </p>
              <a
                href="https://wa.me/31851305915"
                className="inline-flex items-center gap-2 font-bold text-white px-6 py-3 rounded-2xl text-sm transition-all active:scale-95"
                style={{ background: '#25d366' }}
              >
                App ons op WhatsApp
              </a>
            </div>
          )}

          {/* Serverfout bij het controleren van de link — de link zelf kan
              prima zijn, dus geen "ongeldige link" tonen maar vragen om het
              opnieuw te proberen. */}
          {state === 'error' && (
            <div className="bg-white rounded-3xl p-8 text-center shadow-xl shadow-purple-100">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className="text-xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Even niet bereikbaar
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                We konden je link nu niet controleren. Probeer het zo nog een
                keer — je link blijft gewoon geldig.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 font-bold text-white px-6 py-3 rounded-2xl text-sm transition-all active:scale-95"
                style={{ background: '#7c3aed' }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {/* Already uploaded */}
          {state === 'already_uploaded' && (
            <div className="bg-white rounded-3xl p-8 text-center shadow-xl shadow-purple-100">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                CV al ontvangen
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                We hebben je cv al goed ontvangen. Je hoort van ons zodra we je aanmelding bekeken hebben.
              </p>
            </div>
          )}

          {/* Ready / Uploading */}
          {(state === 'ready' || state === 'uploading') && (
            <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 overflow-hidden">

              {/* Card header */}
              <div className="px-6 pt-7 pb-5 border-b border-gray-100">
                <h1 className="text-2xl font-black text-gray-900 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {firstName ? `Hi ${firstName},` : 'Upload je cv'}
                </h1>
                {firstName && (
                  <p className="text-base font-bold text-gray-900 mt-0.5">upload je cv</p>
                )}
                <p className="text-gray-500 text-sm leading-relaxed mt-2">
                  Zodra we je cv hebben ontvangen, bekijken we je aanmelding en hoor je snel van ons.
                </p>
              </div>

              <div className="p-6 space-y-4">

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  capture={undefined}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={state === 'uploading'}
                />

                {/* File area — big tap target on mobile */}
                {!file ? (
                  <button
                    type="button"
                    onClick={() => state !== 'uploading' && fileInputRef.current?.click()}
                    disabled={state === 'uploading'}
                    className="w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all active:scale-[0.98] focus:outline-none"
                    style={{ borderColor: '#d8b4fe', backgroundColor: '#faf5ff' }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#ede9fe' }}>
                      <Upload className="w-7 h-7" style={{ color: '#7c3aed' }} />
                    </div>
                    <p className="font-bold text-gray-800 text-base mb-1">Kies je cv</p>
                    <p className="text-xs text-gray-400">PDF, DOC of DOCX · max. 10 MB</p>
                    <p className="text-xs mt-2 font-semibold" style={{ color: '#7c3aed' }}>
                      Tik hier om een bestand te kiezen
                    </p>
                  </button>
                ) : (
                  <div className="rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#dcfce7' }}>
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-green-800 text-sm truncate">{file.name}</p>
                      <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFile(null); setErrorMsg(''); }}
                      disabled={state === 'uploading'}
                      className="p-1.5 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <X className="w-4 h-4 text-green-700" />
                    </button>
                  </div>
                )}

                {/* Error */}
                {errorMsg && (
                  <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Upload button */}
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || state === 'uploading'}
                  className="w-full h-14 rounded-2xl text-white font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: file ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : '#9ca3af', boxShadow: file ? '0 8px 24px rgba(124,58,237,0.3)' : 'none' }}
                >
                  {state === 'uploading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Bezig met uploaden…
                    </>
                  ) : (
                    'CV uploaden'
                  )}
                </button>

                {/* Change file link when file selected */}
                {file && state !== 'uploading' && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-center text-xs text-gray-400 underline underline-offset-2 hover:text-purple-600 transition-colors"
                  >
                    Ander bestand kiezen
                  </button>
                )}

                <p className="text-xs text-gray-400 text-center pt-1">
                  Vragen?{' '}
                  <a href="https://wa.me/31851305915" className="underline underline-offset-2" style={{ color: '#7c3aed' }}>
                    App ons op WhatsApp
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Success */}
          {state === 'success' && (
            <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 overflow-hidden">
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  CV ontvangen!
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {firstName ? `Goed bezig, ${firstName}!` : 'Goed bezig!'} We hebben je cv ontvangen en gaan er snel mee aan de slag.
                </p>
              </div>

              <div className="mx-6 mb-6 rounded-2xl border border-purple-100 p-5" style={{ backgroundColor: '#faf5ff' }}>
                <p className="text-xs font-bold mb-3" style={{ color: '#6d28d9' }}>WAT GEBEURT ER NU?</p>
                <ol className="space-y-3">
                  {[
                    'Ons team bekijkt je aanmelding en cv — meestal binnen 1 tot 2 werkdagen.',
                    'Als je profiel past, sturen we je een uitnodiging voor een gesprek.',
                    'Na het gesprek hoor je snel of je welkom bent bij EXTRA!',
                  ].map((t, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-xs" style={{ backgroundColor: '#7c3aed' }}>
                        {i + 1}
                      </span>
                      {t}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="px-6 pb-6 text-center">
                <a
                  href="https://www.instagram.com/doehetextra/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-purple-600 transition-colors underline underline-offset-2"
                >
                  Volg ons op Instagram @doehetextra
                </a>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Footer ── */}
      <div className="text-center py-6 text-xs text-gray-400">
        EXTRA · Herengracht 372 · Amsterdam
      </div>
    </div>
  );
}
