import React from 'react';
import { X, CloudLightning, RefreshCw, Moon, Sun, Settings, ChevronRight, BookOpen, LogOut, Edit3, BookHeart, Volume2, VolumeX, Trash2, HelpCircle, ShieldCheck, Users, History } from 'lucide-react';

interface SidebarProps {
   isOpen: boolean;
   onClose: () => void;
   isCloudActive: boolean;
   isConnectionValid?: boolean;
   isMasterUser?: boolean;
   deviceId?: string;
   theme: 'light' | 'dark';
   onToggleTheme: () => void;
   isSoundEnabled: boolean;
   onToggleSound: () => void;
   onOpenCloudSettings: () => void;
   onDisconnectCloud: () => void;
   onOpenUsageGuide: () => void;
   onOpenUpdateLog: () => void;
   onFactoryReset: () => void;
   onOpenCatalog: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
   isOpen,
   onClose,
   isCloudActive,
   isConnectionValid = true,
   isMasterUser = false,
   deviceId,
   theme,
   onToggleTheme,
   isSoundEnabled,
   onToggleSound,
   onOpenCloudSettings,
   onDisconnectCloud,
   onOpenUsageGuide,
   onOpenUpdateLog,
   onFactoryReset,
   onOpenCatalog
}) => {

   let statusText = 'Non configurato';
   let statusColor = 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
   let statusTextColor = 'text-gray-500';

   if (isCloudActive) {
      if (isConnectionValid) {
         statusText = isMasterUser ? 'Supabase Admin Attivo' : 'Supabase Connesso';
         statusColor = isMasterUser ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
         statusTextColor = isMasterUser ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-green-600 dark:text-green-400 font-medium';
      } else {
         statusText = 'Errore Supabase';
         statusColor = 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
         statusTextColor = 'text-red-600 dark:text-red-400 font-bold';
      }
   }

   return (
      <>
         {isOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity" onClick={onClose} />
         )}

         <div className={`fixed top-0 right-0 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

            {/* HEADER */}
            <div className="m-3 p-5 bg-gradient-to-br from-blue-600 to-indigo-700 shrink-0 rounded-[2rem] shadow-lg shadow-blue-500/20">
               <div className="flex flex-row-reverse justify-between items-center mb-2">
                  <h2 className="text-lg font-bold flex flex-row-reverse items-center gap-2.5 text-white">
                     <Settings size={22} className="text-white/80" />
                     Impostazioni
                  </h2>
                  <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white">
                     <ChevronRight size={18} />
                  </button>
               </div>
               <div className="flex items-center gap-3 mt-1 bg-white/10 p-3 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                     <Users size={20} className="text-blue-100" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="text-[9px] text-blue-100 font-bold uppercase tracking-[0.15em] mb-0.5">Famiglia attiva</div>
                     <div className="text-base font-black text-white truncate leading-tight">{localStorage.getItem('FAMILY_CODE') || 'Non configurata'}</div>
                  </div>
               </div>
            </div>

            {/* SETTINGS CONTENT */}
            <div className="flex-1 overflow-y-auto p-2.5 bg-white dark:bg-gray-900 no-scrollbar">
               <div className="space-y-2">

                  {/* Appearance & Sound */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700 shadow-sm">
                     <button onClick={onToggleTheme} className="w-full p-2 flex items-center gap-3.5 text-left hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all group border-b border-gray-100 dark:border-gray-700 mb-0.5">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                           {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </div>
                        <div className="flex-1">
                           <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">Tema Scuro</div>
                           <div className="text-[10px] text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Attivo' : 'Disattivato'}</div>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                           <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                     </button>
                     
                     <button onClick={onToggleSound} className="w-full p-2 flex items-center gap-3.5 text-left hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all group">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                           {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </div>
                        <div className="flex-1">
                           <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">Suoni Notifiche</div>
                           <div className="text-[10px] text-gray-500 dark:text-gray-400">{isSoundEnabled ? 'Attivi' : 'Disattivati'}</div>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${isSoundEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                           <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out ${isSoundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                     </button>
                  </div>

                  {/* Product Catalog Button */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700 shadow-sm">
                     <button
                        onClick={() => { onOpenCatalog(); onClose(); }}
                        className="w-full p-2 flex items-center gap-3.5 text-left hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all group"
                     >
                        <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                           <BookHeart size={18} />
                        </div>
                        <div>
                           <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">Catalogo Prodotti</div>
                           <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              Gestisci il database dei tuoi prodotti
                           </div>
                        </div>
                     </button>
                  </div>

                  {/* Cloud Sync Section */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2 border border-gray-100 dark:border-gray-700 shadow-sm">
                     <div className="flex items-center gap-3.5 mb-2 p-1">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${statusColor}`}>
                           <CloudLightning size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">Supabase Sync</div>
                           <div className={`text-[10px] truncate ${statusTextColor}`}>
                              {statusText}
                           </div>
                        </div>
                     </div>

                     {isCloudActive && (
                        <button
                           onClick={onDisconnectCloud}
                           className="w-full py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors mt-1"
                        >
                           <LogOut size={16} /> Esci dalla Famiglia
                        </button>
                     )}
                  </div>

                  {/* Avanzate (Tutorial & Reset) */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700 mt-1 shadow-sm">
                     <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 px-2 pt-1 opacity-60">Avanzate</h3>

                     <button onClick={onOpenUsageGuide} className="w-full p-2 flex items-center gap-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all group mt-0.5">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                           <HelpCircle size={18} />
                        </div>
                        <div>
                           <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">Guida all'Uso</div>
                           <div className="text-[10px] text-gray-500 dark:text-gray-400">Come usare l'app</div>
                        </div>
                     </button>

                     <button onClick={onOpenUpdateLog} className="w-full p-2 flex items-center gap-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all group mt-0.5">
                        <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                           <History size={18} />
                        </div>
                        <div>
                           <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">Log Aggiornamenti</div>
                           <div className="text-[10px] text-gray-500 dark:text-gray-400">Novità della V.1.0.0</div>
                        </div>
                     </button>

                     <button onClick={onFactoryReset} className="w-full p-2 flex items-center gap-3.5 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all group mt-0.5">
                        <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                           <RefreshCw size={18} />
                        </div>
                        <div>
                           <div className="font-bold text-red-700 dark:text-red-400 text-sm">Ripristino App</div>
                           <div className="text-[10px] text-red-500 dark:text-red-400/70">Elimina tutti i dati locali</div>
                        </div>
                     </button>
                  </div>

               </div>
            </div>

            {/* FOOTER LOGO */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-center shrink-0">
               <div className="flex flex-col justify-center items-center gap-3 opacity-90">
                   <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                       Sviluppato da
                   </div>
                   <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm transition-transform active:scale-95">
                      <img src="/IconaPersonale.png" className="w-full h-full object-contain p-1" alt="FP" />
                   </div>
                   <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                       V.1.0.0
                   </div>
                </div>
            </div>
         </div>
      </>
   );
};