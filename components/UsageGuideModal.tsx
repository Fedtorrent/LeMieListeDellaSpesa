import React from 'react';
import { X, Info, Home, List, Settings, Cloud, GripVertical, Check, Trash2, ArrowUpDown, Users } from 'lucide-react';

interface UsageGuideModalProps {
  onClose: () => void;
}

export const UsageGuideModal: React.FC<UsageGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-blue-600 text-white shrink-0">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <Info size={24} /> Guida all'Uso
          </h3>
          <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50 dark:bg-gray-950 no-scrollbar">

          <section className="space-y-3">
            <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b dark:border-gray-800 pb-1">
              <Home size={20} /> Pagina Principale
            </h4>
            <div className="grid gap-4">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border-2 border-blue-500">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">Lista Locale (Bordo Blu)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Lista salvata solo sul tuo telefono. Puoi aggiungere prodotti, spuntarli e trascinarli liberamente.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border-2 border-orange-500">
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400 mb-1">Lista Cloud (Bordo Arancio)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Lista condivisa con la famiglia. Le modifiche sono istantanee per tutti i componenti del gruppo.
                </p>
              </div>
            </div>
          </section>

          {/* Sezione Lista */}
          <section className="space-y-3">
            <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b dark:border-gray-800 pb-1">
              <List size={20} /> Gestione Prodotti
            </h4>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg h-fit text-blue-600"><ArrowUpDown size={18} /></div>
                <div className="flex-1">
                  <p className="text-sm font-bold dark:text-gray-100">Ordinamento</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cambia l'ordine: Alfabetico, Categoria o Manuale.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg h-fit text-blue-600"><GripVertical size={18} /></div>
                <div className="flex-1">
                  <p className="text-sm font-bold dark:text-gray-100">Trascinamento (Solo liste locali)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">In modalità "Manuale", usa la maniglia blu a destra per spostare i prodotti. Nelle liste Cloud l'ordine è bloccato per evitare conflitti.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg h-fit text-blue-600"><Users size={18} /></div>
                <div className="flex-1">
                  <p className="text-sm font-bold dark:text-gray-100">Collaborazione Reale</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Puoi modificare una lista Cloud anche se un altro familiare la sta usando. I cambiamenti appariranno in tempo reale su tutti i dispositivi.</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Sezione Sidebar */}
          <section className="space-y-3">
            <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b dark:border-gray-800 pb-1">
              <Settings size={20} /> Sidebar (Menu)
            </h4>
            <div className="space-y-3 pl-2">
              <div>
                <p className="text-sm font-bold dark:text-gray-100">🌓 Tema Scuro/Chiaro</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cambia l'aspetto grafico dell'intera applicazione.</p>
              </div>
              <div>
                <p className="text-sm font-bold dark:text-gray-100">🔊 Suoni Notifiche</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Attiva o disattiva il feedback sonoro al tocco dei prodotti.</p>
              </div>
              <div>
                <p className="text-sm font-bold dark:text-gray-100">📖 Catalogo Prodotti</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gestisci i prodotti predefiniti (Master) e quelli creati dalla tua famiglia.</p>
              </div>
              <div>
                <p className="text-sm font-bold dark:text-gray-100">🔄 Ripristino App</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-red-600 font-bold">CANCELLA TUTTI I DATI LOCALI (Uscita dalla famiglia e reset preferenze).</p>
              </div>
            </div>
          </section>

          {/* Logica Cloud */}
          <section className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
            <h4 className="font-bold text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2 mb-2 uppercase">
              <Cloud size={18} /> Supabase Realtime
            </h4>
            <p className="text-xs text-orange-800/80 dark:text-orange-300/80 leading-relaxed italic">
              Grazie alla tecnologia Cloud, ogni spunta o prodotto aggiunto da un familiare apparirà istantaneamente sul tuo schermo. La sincronizzazione è automatica e invisibile.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="p-5 border-t dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-4 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            Ho capito
          </button>
        </div>

      </div>
    </div>
  );
};
