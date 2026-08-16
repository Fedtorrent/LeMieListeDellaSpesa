import React from 'react';
import { X, History, Sparkles, Database, Zap, Users, Layout } from 'lucide-react';

interface UpdateLogModalProps {
  onClose: () => void;
}

export const UpdateLogModal: React.FC<UpdateLogModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b dark:border-gray-800 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-xl flex items-center gap-3 uppercase tracking-tighter">
              <History size={24} /> Log Aggiornamenti
            </h3>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50 dark:bg-gray-950 no-scrollbar">

          {/* Versione 1.0.0 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-full uppercase">Attuale</span>
              <h4 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter">V.1.0.0 - Supabase Evolution</h4>
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h5 className="font-bold text-blue-600 flex items-center gap-2 mb-2 text-sm uppercase">
                  <Database size={16} /> Nuovo Motore Cloud
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Abbandonato Google Sheets in favore di <strong>Supabase (PostgreSQL)</strong>. La sincronizzazione ora è atomica, sicura e istantanea.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h5 className="font-bold text-indigo-600 flex items-center gap-2 mb-2 text-sm uppercase">
                  <Zap size={16} /> Realtime Collaborativo
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Introdotta la tecnologia <strong>Realtime Channels</strong>. Più persone possono usare la stessa lista contemporaneamente senza blocchi e vedendo le spunte altrui in meno di un secondo.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h5 className="font-bold text-purple-600 flex items-center gap-2 mb-2 text-sm uppercase">
                  <Users size={16} /> Accesso Familiare
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Nuovo sistema di login tramite <strong>Codice Famiglia e PIN</strong>. Isolamento totale dei dati tra diversi nuclei e gestione di un Catalogo Master condiviso.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h5 className="font-bold text-orange-600 flex items-center gap-2 mb-2 text-sm uppercase">
                  <Sparkles size={16} /> Fluidità Estrema
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Il sistema di trascinamento prodotti è stato completamente potenziato. Ora spostare gli elementi è un'operazione naturale, veloce e piacevole, senza rallentamenti anche nelle liste più lunghe.
                </p>
              </div>
            </div>
          </section>

          {/* Versione Beta */}
          <section className="opacity-60 grayscale">
            <h4 className="text-lg font-bold text-gray-400 flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-800 pb-1">
               Versione Beta - GSheet Era
            </h4>
            <div className="space-y-2 pl-2">
              <p className="text-xs text-gray-500">• Salvataggio lento tramite Google Apps Script (lag di 4-8 secondi).</p>
              <p className="text-xs text-gray-500">• Blocco "duro" delle liste: solo un utente alla volta poteva scrivere.</p>
              <p className="text-xs text-gray-500">• Mancanza di un vero database relazionale (rischio di dati duplicati).</p>
              <p className="text-xs text-gray-500">• Interfaccia legata a caricamenti manuali continui.</p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
