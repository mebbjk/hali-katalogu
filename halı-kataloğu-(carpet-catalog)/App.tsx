import React, { useState, useMemo, useCallback, useRef, ReactNode } from 'react';
// FIX: Import `Variants` and `Transition` types from framer-motion to resolve type inference issues.
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion';

// Hooks
import { useCarpets } from './hooks/useCarpets';
import { useSettings } from './hooks/useSettings';
import { useToast } from './hooks/useToast';

// Components & Icons
import {
  HomeIcon,
  HeartIcon,
  SearchIcon,
  Cog6ToothIcon,
  PlusIcon,
  XMarkIcon,
  WandSparkles,
  CameraIcon,
  Spinner,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
} from './components/icons';

// Types
import type { Carpet } from './types';

type Page = 'home' | 'favorites' | 'match' | 'settings';
type Modal = 'add' | 'detail' | 'delete' | 'match-result' | null;

// --- Animation Variants ---
// FIX: Explicitly type animation variants with `Variants` to ensure TypeScript correctly infers transition properties.
const modalBackdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

// FIX: Explicitly type animation variants with `Variants` to ensure TypeScript correctly infers transition properties. This resolves the error on line 65.
const modalContentVariants: Variants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 200 } },
    exit: { opacity: 0, y: 50, scale: 0.95, transition: { duration: 0.2 } },
};

// FIX: Explicitly type `pageTransition` with `Transition` to fix type compatibility error on line 376.
const pageTransition: Transition = { type: 'tween', ease: 'anticipate', duration: 0.5 };
const pageVariants: Variants = {
  initial: { opacity: 0, x: -50 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 50 },
};


// --- Reusable Components ---

const ModalComponent: React.FC<{ children: ReactNode; onClose: () => void; title: string }> = ({ children, onClose, title }) => (
    <motion.div
        className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalBackdropVariants}
        onClick={onClose}
    >
        <motion.div
            className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
        >
            <header className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center flex-shrink-0">
                <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">{title}</h2>
                <button onClick={onClose} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </header>
            <div className="p-6 overflow-y-auto">
                {children}
            </div>
        </motion.div>
    </motion.div>
);

const Button: React.FC<{ onClick?: () => void; children: ReactNode; className?: string; type?: 'button' | 'submit' | 'reset'; disabled?: boolean; }> = 
({ onClick, children, className = '', type = 'button', disabled = false }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-4 ${
            disabled 
                ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed' 
                : 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-300 dark:focus:ring-amber-800'
        } ${className}`}
    >
        {children}
    </button>
);


const CarpetCard: React.FC<{ carpet: Carpet; onSelect: (carpet: Carpet) => void; onToggleFavorite: (id: string) => void; }> = ({ carpet, onSelect, onToggleFavorite }) => {
    return (
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1" onClick={() => onSelect(carpet)}>
            <div className="relative">
                <img src={carpet.imageUrl} alt={carpet.name} className="w-full h-48 object-cover" />
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(carpet.id); }} 
                    className="absolute top-3 right-3 p-2 bg-black/40 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:scale-110"
                >
                    <HeartIcon className={`w-6 h-6 ${carpet.isFavorite ? 'text-red-400 fill-current' : ''}`} />
                </button>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100 mb-1 truncate">{carpet.name}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{carpet.brand}</p>
                <p className="text-xl font-semibold text-amber-600 dark:text-amber-400 mt-2">${carpet.price.toLocaleString()}</p>
            </div>
        </div>
    );
};


// --- Main App ---

function App() {
  const { carpets, loading, error, toggleFavorite, deleteCarpet, addCarpet, updateCarpet, getDetailsFromImage, findMatchByImage, replaceAllCarpets } = useCarpets();
  const { t } = useSettings();
  const { addToast, toasts, removeToast } = useToast();

  const [activePage, setActivePage] = useState<Page>('home');
  const [modal, setModal] = useState<Modal>(null);
  const [selectedCarpet, setSelectedCarpet] = useState<Carpet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchResult, setMatchResult] = useState<Carpet | 'not-found' | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  // File input refs for import/export
  const importFileRef = useRef<HTMLInputElement>(null);

  const filteredCarpets = useMemo(() => {
    const source = activePage === 'favorites' ? carpets.filter(c => c.isFavorite) : carpets;
    if (!searchQuery) return source;
    return source.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.barcodeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.qrCodeId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [carpets, searchQuery, activePage]);

  const openModal = useCallback((type: Modal, carpet?: Carpet) => {
    if (carpet) setSelectedCarpet(carpet);
    setModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setSelectedCarpet(null);
    setMatchResult(null);
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedCarpet) {
      deleteCarpet(selectedCarpet.id);
      addToast(t('Carpet deleted successfully'), 'success'); // Assuming key exists
      closeModal();
    }
  }, [selectedCarpet, deleteCarpet, addToast, t, closeModal]);

  const handleFindMatch = useCallback(async (file: File) => {
    setIsMatching(true);
    try {
        const result = await findMatchByImage(file);
        setMatchResult(result ?? 'not-found');
        openModal('match-result');
    } catch (e: any) {
        addToast(e.message || t('ai_match_error'), 'error');
    } finally {
        setIsMatching(false);
    }
  }, [findMatchByImage, addToast, t, openModal]);
  
  const handleExport = useCallback(() => {
      try {
        const dataStr = JSON.stringify(carpets, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `carpet-catalog-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast(t('export_success'), 'success');
      } catch (e) {
        addToast(t('export_error'), 'error');
      }
  }, [carpets, addToast, t]);

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const content = e.target?.result;
            if (typeof content !== 'string') throw new Error('Invalid file content');
            const newCarpets = JSON.parse(content);
            await replaceAllCarpets(newCarpets);
            addToast(t('import_success'), 'success');
        } catch (err) {
            addToast(t('import_error'), 'error');
        }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  }, [replaceAllCarpets, addToast, t]);


  const renderContent = () => {
    if (loading) return <div className="flex justify-center items-center h-full pt-20"><Spinner className="w-12 h-12 animate-spin text-amber-500" /></div>;
    if (error) return <div className="text-center text-red-500 pt-20">{error}</div>;

    const hasResults = filteredCarpets.length > 0;
    const isFavoritesPage = activePage === 'favorites';

    if (!hasResults && searchQuery) {
        return <div className="text-center pt-20 text-zinc-500">{t('no_carpets_found')}</div>
    }

    if (!hasResults && !searchQuery) {
        if (isFavoritesPage) {
            return (
                <div className="text-center pt-20 text-zinc-500">
                    <HeartIcon className="w-16 h-16 mx-auto text-zinc-400 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">{t('no_favorites_found')}</h2>
                    <p>{t('empty_favorites_message')}</p>
                </div>
            );
        }
        return (
            <div className="text-center pt-20 text-zinc-500">
                <HomeIcon className="w-16 h-16 mx-auto text-zinc-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">{t('no_carpets_found')}</h2>
                <p>{t('empty_home_message')}</p>
                <Button className="mt-6 flex items-center justify-center gap-2 mx-auto" onClick={() => openModal('add')}>
                    <PlusIcon className="w-5 h-5" />
                    {t('add_first_carpet')}
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCarpets.map(carpet => (
                <CarpetCard
                    key={carpet.id}
                    carpet={carpet}
                    onSelect={(c) => openModal('detail', c)}
                    onToggleFavorite={toggleFavorite}
                />
            ))}
        </div>
    );
  };
  
  const SettingsPage = () => {
      const { language, setLanguage, theme, setTheme } = useSettings();
      return (
      <div className="space-y-8 max-w-md mx-auto">
          <div>
              <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mb-2">{t('language')}</h3>
              <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'tr')} className="w-full p-3 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                  <option value="en">English</option>
                  <option value="tr">Türkçe</option>
              </select>
          </div>
          <div>
              <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mb-2">{t('theme')}</h3>
              <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')} className="w-full p-3 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                  <option value="light">{t('light')}</option>
                  <option value="dark">{t('dark')}</option>
              </select>
          </div>
          <div>
              <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mb-2">{t('data_management')}</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-800 focus:ring-zinc-400 text-zinc-100">
                      <ArrowUpTrayIcon className="w-5 h-5" /> {t('import_data')}
                  </Button>
                  <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleImport} />
                  <Button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-800 focus:ring-zinc-400 text-zinc-100">
                      <ArrowDownTrayIcon className="w-5 h-5" /> {t('export_data')}
                  </Button>
              </div>
          </div>
      </div>
  )};

    const MatchPage = () => {
        const [imageFile, setImageFile] = useState<File | null>(null);
        const [preview, setPreview] = useState<string | null>(null);
        
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                setImageFile(file);
                setPreview(URL.createObjectURL(file));
            }
        };

        const handleSubmit = () => {
            if (imageFile) {
                handleFindMatch(imageFile);
            }
        };

        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-zinc-800 dark:text-zinc-100">{t('find_matching_carpet')}</h2>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">{t('upload_image_to_find')}</p>
                <div className="w-full max-w-md mx-auto">
                    <label className="cursor-pointer block border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center hover:border-amber-500 dark:hover:border-amber-400 transition-colors">
                        {preview ? (
                            <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-md" />
                        ) : (
                            <div className="text-zinc-500">
                                <CameraIcon className="w-12 h-12 mx-auto mb-2" />
                                {t('drop_image_here')}
                            </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <Button onClick={handleSubmit} disabled={!imageFile || isMatching} className="w-full mt-6 flex items-center justify-center gap-2">
                        {isMatching ? (
                            <>
                                <Spinner className="w-5 h-5 animate-spin" />
                                {t('searching_for_match')}
                            </>
                        ) : (
                            <>
                                <SearchIcon className="w-5 h-5" />
                                {t('find_match')}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    };

    const renderPage = () => {
        const CurrentPage = {
            home: renderContent,
            favorites: renderContent,
            match: MatchPage,
            settings: SettingsPage,
        }[activePage] || (() => null);

        return (
             <AnimatePresence mode="wait">
                <motion.div
                    key={activePage}
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                >
                    <CurrentPage />
                </motion.div>
            </AnimatePresence>
        );
    };
    

    return (
        <div className="bg-zinc-100 dark:bg-zinc-900 min-h-screen text-zinc-900 dark:text-zinc-200 flex flex-col font-sans">
            <header className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-30 shadow-sm">
                <div className="container mx-auto px-4 py-3">
                    <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{t('app_title')}</h1>
                    {(activePage === 'home' || activePage === 'favorites') && (
                        <div className="relative mt-3">
                            <input
                                type="text"
                                placeholder={t('search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-transparent focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:outline-none"
                            />
                            <SearchIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        </div>
                    )}
                </div>
            </header>
            
            <main className="flex-grow container mx-auto p-4 pb-24">
                {renderPage()}
            </main>
            
            {(activePage === 'home' || activePage === 'favorites') && (
                 <button onClick={() => openModal('add')} className="fixed bottom-24 right-6 bg-amber-500 text-white rounded-full p-4 shadow-lg hover:bg-amber-600 transition-transform hover:scale-110 z-20">
                    <PlusIcon className="w-8 h-8" />
                </button>
            )}

            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 z-30">
                <div className="container mx-auto flex justify-around">
                    {(['home', 'favorites', 'match', 'settings'] as Page[]).map(page => {
                        const icons: Record<Page, ReactNode> = {
                            home: <HomeIcon className="w-7 h-7" />,
                            favorites: <HeartIcon className="w-7 h-7" />,
                            match: <SearchIcon className="w-7 h-7" />,
                            settings: <Cog6ToothIcon className="w-7 h-7" />,
                        };
                        const isActive = activePage === page;
                        return (
                            <button key={page} onClick={() => setActivePage(page)} className={`flex flex-col items-center py-2 px-4 w-full transition-colors relative ${isActive ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400'}`}>
                                {icons[page]}
                                <span className="text-xs mt-1">{t(page)}</span>
                                {isActive && <motion.div layoutId="active-nav-indicator" className="absolute -top-px h-1 w-1/2 bg-amber-500 rounded-full" />}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Modals */}
            <AnimatePresence>
                {modal === 'detail' && selectedCarpet && (
                    <CarpetDetailModal carpet={selectedCarpet} onClose={closeModal} onDelete={() => openModal('delete', selectedCarpet)} />
                )}
                {modal === 'add' && (
                    <CarpetFormModal
                        carpet={null}
                        onClose={closeModal}
                        onSave={async (data, file) => {
                            try {
                                if (file) {
                                    await addCarpet(data, file);
                                    addToast(t('Carpet added successfully'), 'success');
                                }
                                closeModal();
                            } catch (e: any) {
                                addToast(e.message || 'Failed to save carpet', 'error');
                            }
                        }}
                        getDetailsFromImage={getDetailsFromImage}
                    />
                )}
                 {modal === 'delete' && selectedCarpet && (
                    <ModalComponent onClose={closeModal} title={t('delete')}>
                        <p className="mb-6">{t('delete_carpet_confirm')}</p>
                        <div className="flex justify-end gap-4">
                            <Button onClick={closeModal} className="bg-zinc-200 text-zinc-800 hover:bg-zinc-300 focus:ring-zinc-400 dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-700">{t('cancel')}</Button>
                            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">{t('delete')}</Button>
                        </div>
                    </ModalComponent>
                )}
                 {modal === 'match-result' && (
                    <ModalComponent onClose={closeModal} title={matchResult === 'not-found' ? t('no_match_found') : t('match_found')}>
                        {matchResult === 'not-found' ? (
                            <p>{t('no_match_found')}</p>
                        ) : (
                            matchResult && <>
                                <p className="mb-4">{t('view_match')}</p>
                                <CarpetCard carpet={matchResult as Carpet} onSelect={(c) => {closeModal(); openModal('detail', c);}} onToggleFavorite={()=>{}} />
                            </>
                        )}
                    </ModalComponent>
                )}
            </AnimatePresence>

            {/* Toast Container */}
            <div className="fixed top-5 right-5 z-50 space-y-2">
                <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div 
                        key={toast.id} 
                        layout
                        initial={{ opacity: 0, y: -50, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.5, transition: { duration: 0.2 } }}
                        className={`flex items-center gap-4 p-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}
                    >
                       {toast.type === 'success' ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <XCircleIcon className="w-6 h-6 text-red-500" />}
                       <span>{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="ml-auto opacity-70 hover:opacity-100"><XMarkIcon className="w-5 h-5" /></button>
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

// --- Specific Modals and Forms ---
const CarpetDetailModal: React.FC<{ carpet: Carpet; onClose: () => void; onDelete: () => void; }> = ({ carpet, onClose, onDelete }) => {
    const { t } = useSettings();
    const { updateCarpet } = useCarpets();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'details' | 'edit'>('details');

    const handleSave = async (data: Partial<Carpet>) => {
        try {
            await updateCarpet({ ...carpet, ...data });
            addToast(t('Carpet updated successfully'), 'success');
            onClose(); // Close modal on successful save
        } catch (e: any) {
            addToast(e.message || 'Failed to save carpet', 'error');
        }
    };

    return (
        <ModalComponent onClose={onClose} title={carpet.name}>
            <div className="border-b border-zinc-200 dark:border-zinc-700 mb-4">
                <nav className="-mb-px flex space-x-6">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-amber-500 text-amber-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:hover:text-zinc-200'}`}
                    >
                        {t('Details')}
                    </button>
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'edit' ? 'border-amber-500 text-amber-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:hover:text-zinc-200'}`}
                    >
                        {t('edit')}
                    </button>
                </nav>
            </div>
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'details' ? (
                        <div>
                            <img src={carpet.imageUrl} alt={carpet.name} className="w-full h-64 object-cover rounded-lg mb-4" />
                            <div className="space-y-3 text-sm">
                                {(Object.keys(carpet) as Array<keyof Carpet>).map(key => {
                                    if (['id', 'imageUrl', 'isFavorite', 'createdAt', 'barcodeId', 'qrCodeId'].includes(key)) return null;
                                    const value = carpet[key];
                                    if (!value || (Array.isArray(value) && value.length === 0)) return null;
                                    return (
                                        <div key={key} className="grid grid-cols-3 gap-2">
                                            <strong className="col-span-1 text-zinc-500 dark:text-zinc-400 capitalize">{t(key.replace(/([A-Z])/g, '_$1').toLowerCase())}</strong>
                                            <p className="col-span-2">{Array.isArray(value) ? value.join(', ') : (key === 'price' ? `$${value.toLocaleString()}` : value)}</p>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="flex justify-end pt-6">
                                <Button onClick={onDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">{t('delete')}</Button>
                            </div>
                        </div>
                    ) : (
                        <CarpetFormFields carpet={carpet} onSave={handleSave} onCancel={onClose} isEditMode={true} />
                    )}
                </motion.div>
            </AnimatePresence>
        </ModalComponent>
    );
};


const CarpetFormModal: React.FC<{
    carpet: Carpet | null;
    onClose: () => void;
    onSave: (data: Partial<Carpet>, file?: File) => void;
    getDetailsFromImage: (file: File) => Promise<Partial<Carpet>>;
}> = ({ carpet, onClose, onSave, getDetailsFromImage }) => {
    const { t } = useSettings();
    return (
        <ModalComponent onClose={onClose} title={carpet ? t('edit_carpet_details') : t('add_new_carpet')}>
            <CarpetFormFields 
                carpet={carpet} 
                onSave={onSave} 
                onCancel={onClose}
                getDetailsFromImage={getDetailsFromImage}
                isEditMode={!!carpet}
            />
        </ModalComponent>
    );
};

const CarpetFormFields: React.FC<{
    carpet: Carpet | null;
    onSave: (data: Partial<Carpet>, file?: File) => void;
    onCancel: () => void;
    getDetailsFromImage?: (file: File) => Promise<Partial<Carpet>>;
    isEditMode: boolean;
}> = ({ carpet, onSave, onCancel, getDetailsFromImage, isEditMode }) => {
    const { t } = useSettings();
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Partial<Carpet>>(carpet || {});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(carpet?.imageUrl || null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };
    
    const handleMultiValueChange = (name: 'size' | 'yarnType', value: string) => {
        const values = value.split(',').map(s => s.trim()).filter(Boolean);
        setFormData(prev => ({...prev, [name]: values}));
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAIScan = async () => {
        if (!imageFile || !getDetailsFromImage) return;
        setIsAnalyzing(true);
        try {
            const details = await getDetailsFromImage(imageFile);
            setFormData(prev => ({ ...prev, ...details }));
            addToast(t('AI analysis complete'), 'success');
        } catch (e: any) {
             addToast(e.message || t('ai_analysis_error'), 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            addToast(t('required_field'), 'error');
            return;
        }
        onSave(formData, imageFile || undefined);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {!isEditMode && (
                <div>
                    <label className="cursor-pointer block border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-4 text-center hover:border-amber-500 dark:hover:border-amber-400 transition-colors">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-md" />
                        ) : (
                            <div className="text-zinc-500">
                                <CameraIcon className="w-12 h-12 mx-auto mb-2" />
                                {t('drop_image_here')}
                            </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} required={!carpet} />
                    </label>
                    {imageFile && getDetailsFromImage && (
                        <Button onClick={handleAIScan} disabled={isAnalyzing} type="button" className="w-full mt-2 flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-800 focus:ring-zinc-400 text-zinc-100">
                            {isAnalyzing ? <><Spinner className="w-5 h-5 animate-spin"/> {t('analyzing_image')}</> : <><WandSparkles className="w-5 h-5"/> {t('scan_with_ai')}</>}
                        </Button>
                    )}
                </div>
            )}
            
            {(['name', 'brand', 'model', 'price', 'pattern', 'texture', 'type'] as const).map(field => (
                 <div key={field}>
                    <label htmlFor={field} className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">{t(field)}</label>
                    <input
                        type={field === 'price' ? 'number' : 'text'}
                        id={field}
                        name={field}
                        value={(formData as any)[field] || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 rounded-md bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        required={field === 'name'}
                    />
                </div>
            ))}
            
            {(['size', 'yarnType'] as const).map(field => (
                 <div key={field}>
                    <label htmlFor={field} className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">{t(field === 'size' ? 'sizes' : 'yarn_types')}</label>
                    <input
                        type="text"
                        id={field}
                        name={field}
                        value={formData[field]?.join(', ') || ''}
                        onChange={(e) => handleMultiValueChange(field, e.target.value)}
                        className="w-full p-2 rounded-md bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Değer1, Değer2, ..."
                    />
                </div>
            ))}

            <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">{t('description')}</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-2 rounded-md bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
                <Button onClick={onCancel} type="button" className="bg-zinc-200 text-zinc-800 hover:bg-zinc-300 focus:ring-zinc-400 dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-700">{t('cancel')}</Button>
                <Button type="submit">{t('save_changes')}</Button>
            </div>
        </form>
    );
};

export default App;