import React, { useState } from 'react';
import { ShoppingCart, Users, ShieldCheck, ArrowRight, Loader2, Info } from 'lucide-react';
import { getFamilyData, createFamily, setFamilyCode } from '../services/supabaseService';

interface WelcomeScreenProps {
  onConfigured: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onConfigured }) => {
  const [familyCode, setFamilyCodeInput] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'create'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyCode.trim() || pin.length < 4) {
      setError('Inserisci un codice valido e un PIN di almeno 4 cifre.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const family = await getFamilyData(familyCode);

      if (mode === 'login') {
        if (!family.exists) {
          setError('Codice famiglia non trovato.');
        } else if (family.pin !== pin) {
          setError('PIN errato.');
        } else {
          setFamilyCode(familyCode);
          onConfigured();
        }
      } else {
        if (family.exists) {
          setError('Questo codice famiglia è già in uso.');
        } else {
          await createFamily(familyCode, pin);
          setFamilyCode(familyCode);
          onConfigured();
        }
      }
    } catch (err: any) {
      setError('Errore di connessione.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 z-[999] flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3 shadow-blue-500/20">
             <ShoppingCart size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">La Mia Spesa</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Sincronizzazione familiare in tempo reale</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => { setMode('create'); setError(null); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'create' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}
            >
              Crea Nuova
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-1 mb-1.5 block tracking-widest">Codice Famiglia</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  autoFocus
                  value={familyCode}
                  onChange={e => setFamilyCodeInput(e.target.value.toUpperCase())}
                  className="w-full p-4 pl-12 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-600 dark:focus:border-blue-500 rounded-2xl outline-none transition-all font-bold text-gray-800 dark:text-white"
                  placeholder="Es: ROSSI2024"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-1 mb-1.5 block tracking-widest">PIN Segreto</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-4 pl-12 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-600 dark:focus:border-blue-500 rounded-2xl outline-none transition-all font-bold tracking-widest text-gray-800 dark:text-white"
                  placeholder="••••"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-start gap-3 border border-red-100 dark:border-red-900/30">
              <Info size={18} className="shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                {mode === 'login' ? 'Entra nel Nucleo' : 'Crea Famiglia'}
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-gray-400 font-medium px-4 leading-relaxed">
            I dati delle tue liste saranno accessibili solo ai membri della tua famiglia che conoscono il Codice e il PIN.
          </p>
        </form>
      </div>
    </div>
  );
};
