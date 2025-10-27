import React, { useState, useMemo, useCallback, useRef, FC, ReactNode } from 'react';
import { useCarpets } from '../hooks/useCarpets';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import type { Carpet } from '../types';
import {
  HomeIcon, HeartIcon, PlusCircleIcon, SearchIcon, SettingsIcon,
  EditIcon, StarIcon, TrashIcon, XIcon, MoonIcon, SunIcon, SparklesIcon,
  CameraIcon, PhotoIcon, CheckIcon, BarcodeScannerIcon
} from './components/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { readCodeFromImage } from '../services/geminiService';


type ModalType = 'add' | 'edit' | 'delete' | 'settings' | 'import-export' | null;
// FIX: Added 'settings' to the ActiveTab type to allow it as a valid tab ID in the navigation bar, resolving assignment and comparison errors.
type ActiveTab = 'home' | 'favorites' | 'search' | 'settings';


const App: FC = () => {
  const { carpets, loading, error, addCarpet, updateCarpet, deleteCarpet, toggleFavorite, replaceAllCarpets, getDetailsFromImage, findMatchByImage } = useCarpets();
  const { addToast } = useToast();
  const { t } = useSettings();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedCarpet, setSelectedCarpet] = useState<Carpet | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Modal handlers
  const openModal = (type: ModalType, carpet?: Carpet) => {
    setSelectedCarpet(carpet || null);
    setActiveModal(type);
  };
  const closeModal = () => {
    setActiveModal(null);
    setSelectedCarpet(null);
  };

  const displayedCarpets = useMemo(() => {
    if (activeTab === 'favorites') {
      return carpets.filter(c => c.isFavorite);
    }
    return carpets; // For 'home' tab
  }, [carpets, activeTab]);


  return (
    <div className="bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-slate-200 min-h-screen font-sans antialiased w-full h-full overflow-hidden">
      <main className="pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && <CarpetGrid title={t('app_title')} carpets={displayedCarpets} loading={loading} error={error} openModal={openModal} toggleFavorite={toggleFavorite} />}
            {activeTab === 'favorites' && <CarpetGrid title={t('favorites')} carpets={displayedCarpets} loading={loading} error={error} openModal={openModal} toggleFavorite={toggleFavorite} />}
            {activeTab === 'search' && <SearchView allCarpets={carpets} openModal={openModal} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} onAddClick={() => openModal('add')} onSettingsClick={() => openModal('settings')} />

      <AnimatePresence>
        {activeModal === 'add' && <CarpetFormModal mode="add" onClose={closeModal} addCarpet={addCarpet} getDetailsFromImage={getDetailsFromImage} addToast={addToast} />}
        {activeModal === 'edit' && selectedCarpet && <CarpetFormModal mode="edit" carpet={selectedCarpet} onClose={closeModal} updateCarpet={updateCarpet} addToast={addToast} />}
        {activeModal === 'delete' && selectedCarpet && <ConfirmDeleteModal carpetName={selectedCarpet.name} onConfirm={async () => { await deleteCarpet(selectedCarpet.id); addToast(t('toast_carpet_deleted'), 'success'); closeModal(); }} onCancel={closeModal} />}
        {activeModal === 'settings' && <SettingsModal onClose={closeModal} onImportExport={() => { closeModal(); openModal('import-export'); }} />}
        {activeModal === 'import-export' && <ImportExportModal onClose={closeModal} carpets={carpets} onImport={replaceAllCarpets} addToast={addToast} />}
      </AnimatePresence>
      <ToastContainer />
    </div>
  );
};

// Main Views
const CarpetGrid: FC<{ title: string, carpets: Carpet[], loading: boolean, error: string | null, openModal: (type: ModalType, carpet?: Carpet) => void, toggleFavorite: (id: string) => void }> = ({ title, carpets, loading, error, openModal, toggleFavorite }) => {
  const { t } = useSettings();
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">{title}</h1>
      {loading && <p>{t('loading')}</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        carpets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {carpets.map(carpet => (
              <CarpetCard
                key={carpet.id}
                carpet={carpet}
                onView={() => openModal('edit', carpet)}
                onDelete={() => openModal('delete', carpet)}
                onToggleFavorite={() => toggleFavorite(carpet.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">
            <p>{t('no_carpets_found')}</p>
          </div>
        )
      )}
    </div>
  );
};

const SearchView: FC<{ allCarpets: Carpet[], openModal: (type: ModalType, carpet?: Carpet) => void }> = ({ allCarpets, openModal }) => {
  const { t } = useSettings();
  const { addToast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Carpet[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (!q) {
      setResults([]);
      return;
    }
    const lowerQ = q.toLowerCase();
    const filtered = allCarpets.filter(c =>
      c.name.toLowerCase().includes(lowerQ) ||
      c.brand.toLowerCase().includes(lowerQ) ||
      c.model.toLowerCase().includes(lowerQ) ||
      c.pattern.toLowerCase().includes(lowerQ) ||
      c.barcodeId?.toLowerCase().includes(lowerQ) ||
      c.qrCodeId?.toLowerCase().includes(lowerQ)
    );
    setResults(filtered);
  };

  const handleScan = async () => {
    fileInputRef.current?.click();
  };
  
  const onFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    addToast(t('analyzing_image'));
    try {
      const code = await readCodeFromImage(file);
      if (code) {
        addToast(`${t('scan_success')}: ${code}`, 'success');
        handleSearch(code);
      } else {
        addToast(t('scan_error'), 'error');
      }
    } catch (e) {
      const error = e as Error;
      addToast(error.message, 'error');
    } finally {
      setIsScanning(false);
      // Reset file input
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">{t('search')}</h1>
      <div className="relative w-full mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder={t('search_by_text')}
          value={query}
          onChange={e => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-full bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
        />
      </div>
       <div className="flex gap-4 mb-6">
        <button onClick={handleScan} disabled={isScanning} className="flex-1 flex items-center justify-center gap-2 bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-slate-200 font-semibold py-3 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50">
          <BarcodeScannerIcon className="w-6 h-6" /> {isScanning ? t('loading') : t('scan_barcode_qr')}
        </button>
        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={onFileSelect} className="hidden" />
      </div>

      <div>
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map(carpet => <CarpetCard key={carpet.id} carpet={carpet} onView={() => openModal('edit', carpet)} onDelete={() => openModal('delete', carpet)} onToggleFavorite={() => { /* Not implemented in search view */ }} />)}
          </div>
        ) : (
          query && <p className="text-center text-slate-500">{t('no_carpets_found')}</p>
        )}
      </div>
    </div>
  );
};

// Reusable Components
const CarpetCard: FC<{ carpet: Carpet, onView: () => void, onDelete: () => void, onToggleFavorite: () => void }> = ({ carpet, onView, onDelete, onToggleFavorite }) => {
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300"
            onClick={onView}
        >
            <div className="relative">
                <img src={carpet.imageUrl} alt={carpet.name} className="w-full h-48 object-cover" />
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} 
                    className={`absolute top-2 right-2 p-2 rounded-full transition-colors bg-black/30 backdrop-blur-sm ${carpet.isFavorite ? 'text-yellow-400' : 'text-white/80 hover:text-white'}`}
                >
                    <StarIcon className={`w-6 h-6 transition-transform duration-200 ${carpet.isFavorite ? 'fill-current scale-110' : 'scale-100'}`} />
                </button>
            </div>
            <div className="p-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate">{carpet.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{carpet.brand}</p>
            </div>
        </motion.div>
    );
};

const BottomNavBar: FC<{ activeTab: ActiveTab, setActiveTab: (tab: ActiveTab) => void, onAddClick: () => void, onSettingsClick: () => void }> = ({ activeTab, setActiveTab, onAddClick, onSettingsClick }) => {
  const { t } = useSettings();
  const tabs: { id: ActiveTab; icon: ReactNode; label: string }[] = [
    { id: 'home', icon: <HomeIcon className="w-6 h-6" />, label: t('home') },
    { id: 'favorites', icon: <HeartIcon className="w-6 h-6" />, label: t('favorites') },
    { id: 'search', icon: <SearchIcon className="w-6 h-6" />, label: t('search') },
    { id: 'settings', icon: <SettingsIcon className="w-6 h-6" />, label: t('settings') },
  ];
  
  const indicatorPos = { home: '12.5%', favorites: '37.5%', search: '62.5%', settings: '87.5%' };

  // FIX: Refactor tab click handling to correctly set the active tab for 'settings' and trigger the modal.
  const handleTabClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (tabId === 'settings') {
      onSettingsClick();
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50">
        <div className="relative bg-white/70 dark:bg-zinc-800/70 backdrop-blur-xl rounded-2xl shadow-lg p-2 flex items-center justify-around text-zinc-500 dark:text-zinc-400">
             <motion.div
                className="absolute bottom-1 left-0 h-1.5 w-10 bg-violet-500 rounded-full"
                animate={{ x: indicatorPos[activeTab as keyof typeof indicatorPos] ? `calc(${indicatorPos[activeTab as keyof typeof indicatorPos]} - 50%)` : '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ display: indicatorPos[activeTab as keyof typeof indicatorPos] ? 'block' : 'none' }}
             />

            {tabs.slice(0, 2).map(tab => (
                <NavButton key={tab.id} isActive={activeTab === tab.id} onClick={() => handleTabClick(tab.id)} label={tab.label}>{tab.icon}</NavButton>
            ))}

            <button onClick={onAddClick} className="bg-violet-600 text-white rounded-full w-14 h-14 flex items-center justify-center -translate-y-4 shadow-lg shadow-violet-500/50 hover:bg-violet-700 transition-transform active:scale-90">
                <PlusCircleIcon className="w-8 h-8"/>
            </button>
            
            {tabs.slice(2).map(tab => (
                <NavButton key={tab.id} isActive={activeTab === tab.id} onClick={() => handleTabClick(tab.id)} label={tab.label}>{tab.icon}</NavButton>
            ))}
        </div>
    </div>
  );
};

const NavButton: FC<{ isActive: boolean, onClick: () => void, children: ReactNode, label: string }> = ({ isActive, onClick, children, label }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 h-12 transition-colors rounded-lg ${isActive ? 'text-violet-600 dark:text-violet-400' : 'hover:text-zinc-800 dark:hover:text-white'}`}>
        {children}
        <span className="text-xs font-medium">{label}</span>
    </button>
);


// Modals
const Modal: FC<{ children: ReactNode, onClose: () => void, title: string }> = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" 
            onClick={e => e.stopPropagation()}
        >
            <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold">{title}</h2>
                <button onClick={onClose} className="p-1 rounded-full text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"><XIcon className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
                {children}
            </div>
        </motion.div>
    </div>
);

const SettingsModal: FC<{ onClose: () => void, onImportExport: () => void }> = ({ onClose, onImportExport }) => {
    const { theme, setTheme, language, setLanguage, t } = useSettings();
    return (
        <Modal onClose={onClose} title={t('settings')}>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('language')}</label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'en' | 'tr')}
                        className="w-full px-3 py-2 border rounded-md bg-white dark:bg-zinc-700 border-slate-300 dark:border-zinc-600 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
                        aria-label="Language"
                    >
                        <option value="en">English</option>
                        <option value="tr">Türkçe</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('theme')}</label>
                    <div className="flex gap-2">
                        <button onClick={() => setTheme('light')} className={`flex-1 py-2 rounded-md ${theme === 'light' ? 'bg-violet-600 text-white' : 'bg-slate-200 dark:bg-zinc-700'}`}>
                            {t('light')}
                        </button>
                        <button onClick={() => setTheme('dark')} className={`flex-1 py-2 rounded-md ${theme === 'dark' ? 'bg-violet-600 text-white' : 'bg-slate-200 dark:bg-zinc-700'}`}>
                            {t('dark')}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('import_export')}</label>
                    <button onClick={onImportExport} className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors">
                        {t('import_export_data')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const CarpetFormModal: FC<{
    mode: 'add' | 'edit';
    carpet?: Carpet;
    onClose: () => void;
    addCarpet?: (data: Partial<Carpet>, file: File) => Promise<Carpet>;
    updateCarpet?: (data: Carpet) => Promise<void>;
    getDetailsFromImage?: (file: File) => Promise<Partial<Carpet>>;
    addToast: (message: string, type?: 'success' | 'error') => void;
}> = ({ mode, carpet, onClose, addCarpet, updateCarpet, getDetailsFromImage, addToast }) => {
    const { t } = useSettings();
    const [formData, setFormData] = useState<Partial<Carpet>>(carpet || { size: [], yarnType: [], isFavorite: false });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(carpet?.imageUrl || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [customSize, setCustomSize] = useState('');
    const [customYarnType, setCustomYarnType] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const FIXED_SIZES = ["80x150 cm", "120x180 cm", "160x230 cm", "200x300 cm", "240x340 cm", "Runner"];
    const YARN_TYPES = ["Yün", "Polyester", "Akrilik", "Polipropilen", "Viskon", "Pamuk"];

    const handleActionSheet = (type: 'camera' | 'gallery') => {
        if(fileInputRef.current) {
            fileInputRef.current.removeAttribute('capture');
            if (type === 'camera') {
                fileInputRef.current.setAttribute('capture', 'environment');
            }
            fileInputRef.current.click();
        }
    };
    
    const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleScan = async (field: 'barcodeId' | 'qrCodeId') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            addToast(t('analyzing_image'));
            setIsAnalyzing(true);
            try {
                const code = await readCodeFromImage(file);
                if (code) {
                    setFormData(prev => ({...prev, [field]: code}));
                    addToast(`${t('scan_success')}: ${code}`, 'success');
                } else {
                    addToast(t('scan_error'), 'error');
                }
            } catch (err) {
                 const error = err as Error;
                 addToast(error.message, 'error');
            } finally {
                setIsAnalyzing(false);
            }
        };
        input.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };

    const toggleListItem = (field: 'size' | 'yarnType', value: string) => {
        const currentList = (formData[field] as string[] || []);
        const newList = currentList.includes(value)
            ? currentList.filter(item => item !== value)
            : [...currentList, value];
        setFormData(prev => ({...prev, [field]: newList}));
    };

    const addCustomItem = (field: 'size' | 'yarnType') => {
        const value = field === 'size' ? customSize : customYarnType;
        if (value && !(formData[field] as string[] || []).includes(value)) {
            setFormData(prev => ({...prev, [field]: [...(prev[field] as string[] || []), value]}));
            if (field === 'size') setCustomSize('');
            else setCustomYarnType('');
        }
    };
    
    const handleAiFill = async () => {
        if (!imageFile || !getDetailsFromImage) return;
        setIsAnalyzing(true);
        try {
            const details = await getDetailsFromImage(imageFile);
            setFormData(prev => ({ ...prev, ...details, size: details.size || [], yarnType: details.yarnType || [] }));
        } catch (e) {
            const error = e as Error;
            addToast(error.message || t('toast_ai_error'), 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (mode === 'add' && addCarpet && imageFile) {
                await addCarpet(formData, imageFile);
                addToast(t('toast_carpet_added'), 'success');
            } else if (mode === 'edit' && updateCarpet && carpet) {
                await updateCarpet({ ...carpet, ...formData });
                addToast(t('toast_carpet_updated'), 'success');
            }
            onClose();
        } catch (e) {
            addToast(t('toast_generic_error'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Modal onClose={onClose} title={mode === 'add' ? t('add_carpet') : t('edit_carpet')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="p-4 bg-slate-100 dark:bg-zinc-900 rounded-lg">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-contain rounded-md mb-2" />
                    ) : (
                        <div className="w-full h-48 bg-slate-200 dark:bg-zinc-700 rounded-md flex items-center justify-center">
                            <span className="text-slate-500">{t('no_photo')}</span>
                        </div>
                    )}
                    <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => handleActionSheet('camera')} className="flex-1 flex items-center justify-center gap-2 bg-slate-200 dark:bg-zinc-700 py-2 rounded-md"><CameraIcon className="w-5 h-5"/> {t('take_photo')}</button>
                        <button type="button" onClick={() => handleActionSheet('gallery')} className="flex-1 flex items-center justify-center gap-2 bg-slate-200 dark:bg-zinc-700 py-2 rounded-md"><PhotoIcon className="w-5 h-5"/> {t('select_from_gallery')}</button>
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileSelect} className="hidden" />
                    {imageFile && getDetailsFromImage && (
                         <button type="button" onClick={handleAiFill} disabled={isAnalyzing} className="w-full mt-2 flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-violet-700 transition-colors disabled:bg-violet-400">
                             {isAnalyzing ? t('analyzing_image') : <><SparklesIcon className="w-5 h-5"/> {t('ai_fill_details')}</>}
                         </button>
                    )}
                </div>

                <InputField name="name" label={t('name')} value={formData.name || ''} onChange={handleChange} />
                <InputField name="brand" label={t('brand')} value={formData.brand || ''} onChange={handleChange} />
                <InputField name="model" label={t('model')} value={formData.model || ''} onChange={handleChange} />
                <InputField name="price" type="number" label={t('price')} value={formData.price || ''} onChange={handleChange} />
                <InputField name="pattern" label={t('pattern')} value={formData.pattern || ''} onChange={handleChange} />
                <InputField name="texture" label={t('texture')} value={formData.texture || ''} onChange={handleChange} />
                <InputField name="type" label={t('type')} value={formData.type || ''} onChange={handleChange} />

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('size')}</label>
                    <div className="flex flex-wrap gap-2">
                        {FIXED_SIZES.map(s => <SelectButton key={s} label={s} isSelected={(formData.size || []).includes(s)} onClick={() => toggleListItem('size', s)} />)}
                        {(formData.size || []).filter(s => !FIXED_SIZES.includes(s)).map(s => <SelectButton key={s} label={s} isSelected={true} onClick={() => toggleListItem('size', s)} />)}
                    </div>
                    <div className="flex gap-2 mt-2">
                         <InputField name="custom_size" placeholder={t('custom_size')} value={customSize} onChange={e => setCustomSize(e.target.value)} className="flex-grow" />
                         <button type="button" onClick={() => addCustomItem('size')} className="bg-slate-200 dark:bg-zinc-700 px-4 rounded-md">{t('add')}</button>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('yarn_type')}</label>
                    <div className="flex flex-wrap gap-2">
                        {YARN_TYPES.map(s => <SelectButton key={s} label={s} isSelected={(formData.yarnType || []).includes(s)} onClick={() => toggleListItem('yarnType', s)} />)}
                        {(formData.yarnType || []).filter(s => !YARN_TYPES.includes(s)).map(s => <SelectButton key={s} label={s} isSelected={true} onClick={() => toggleListItem('yarnType', s)} />)}
                    </div>
                    <div className="flex gap-2 mt-2">
                         <InputField name="custom_yarn_type" placeholder={t('custom_yarn_type')} value={customYarnType} onChange={e => setCustomYarnType(e.target.value)} className="flex-grow" />
                         <button type="button" onClick={() => addCustomItem('yarnType')} className="bg-slate-200 dark:bg-zinc-700 px-4 rounded-md">{t('add_yarn_type')}</button>
                    </div>
                </div>

                <InputField name="description" as="textarea" label={t('description')} value={formData.description || ''} onChange={handleChange} />
                <InputField name="barcodeId" label={t('barcodeId')} value={formData.barcodeId || ''} onChange={handleChange} onScan={() => handleScan('barcodeId')} />
                <InputField name="qrCodeId" label={t('qrCodeId')} value={formData.qrCodeId || ''} onChange={handleChange} onScan={() => handleScan('qrCodeId')} />


                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 border border-slate-300 dark:border-zinc-600 rounded-md font-semibold hover:bg-slate-100 dark:hover:bg-zinc-700 transition">
                        {t('cancel')}
                    </button>
                    <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-violet-600 text-white font-semibold rounded-md hover:bg-violet-700 transition disabled:bg-violet-400">
                        {isSubmitting ? t('loading') : t('save')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const InputField: FC<{ name: string, label?: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, type?: string, placeholder?: string, as?: 'input' | 'textarea', className?: string, onScan?: () => void }> = ({ name, label, as = 'input', onScan, ...props }) => {
  const commonClasses = "w-full px-3 py-2 border rounded-md bg-white dark:bg-zinc-700 border-slate-300 dark:border-zinc-600 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition";
  const Element = as;
  return (
    <div className={props.className}>
        {label && <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
        <div className="relative">
             <Element id={name} name={name} {...props} className={commonClasses} />
             {onScan && (
                 <button type="button" onClick={onScan} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 dark:text-slate-400 hover:text-violet-500 dark:hover:text-violet-400">
                    <BarcodeScannerIcon className="w-6 h-6"/>
                 </button>
             )}
        </div>
    </div>
  );
};

const SelectButton: FC<{ label: string, isSelected: boolean, onClick: () => void }> = ({ label, isSelected, onClick }) => (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${isSelected ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-100 dark:bg-zinc-700 border-slate-200 dark:border-zinc-600 hover:border-slate-400 dark:hover:border-zinc-500'}`}>
        <span className="flex items-center gap-1.5">
            {isSelected && <CheckIcon className="w-4 h-4"/>}
            {label}
        </span>
    </button>
);

const ConfirmDeleteModal: FC<{ carpetName: string, onConfirm: () => void, onCancel: () => void }> = ({ carpetName, onConfirm, onCancel }) => {
    const { t } = useSettings();
    return (
    <Modal onClose={onCancel} title={t('delete')}>
        <p className="mb-6">{t('confirm_delete')} <strong>{carpetName}</strong>?</p>
        <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="py-2 px-4 border border-slate-300 dark:border-zinc-600 rounded-md font-semibold hover:bg-slate-100 dark:hover:bg-zinc-700 transition">
                {t('cancel')}
            </button>
            <button onClick={onConfirm} className="py-2 px-4 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition">
                {t('yes_delete')}
            </button>
        </div>
    </Modal>
)};

const ImportExportModal: FC<{ onClose: () => void, carpets: Carpet[], onImport: (carpets: Carpet[]) => Promise<void>, addToast: (msg: string, type?: 'success' | 'error') => void }> = ({ onClose, carpets, onImport, addToast }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useSettings();

    const handleExport = () => {
        const dataStr = JSON.stringify(carpets, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'carpet_catalog_export.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        addToast(t('toast_export_success'), 'success');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!confirm(t('import_warning'))) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                const importedCarpets = JSON.parse(text as string);
                await onImport(importedCarpets);
                addToast(t('toast_import_success'), 'success');
                onClose();
            } catch (error) {
                addToast(t('toast_import_error'), 'error');
            }
        };
        reader.readAsText(file);
    };

    return (
        <Modal onClose={onClose} title={t('import_export_data')}>
            <div className="flex flex-col gap-4">
                <button onClick={handleExport} className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    {t('export_data')}
                </button>
                <button onClick={handleImportClick} className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors">
                    {t('import_data')}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
            </div>
        </Modal>
    );
};

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();
  
    return (
      <div className="fixed bottom-28 md:bottom-5 right-5 z-50 space-y-3 w-80">
        <AnimatePresence>
        {toasts.map(toast => (
            <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.3 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                className={`relative flex items-center justify-between p-4 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
            >
                <p>{toast.message}</p>
                <button onClick={() => removeToast(toast.id)} className="ml-4 p-1 rounded-full hover:bg-white/20">
                    <XIcon className="w-5 h-5" />
                </button>
            </motion.div>
        ))}
        </AnimatePresence>
      </div>
    );
};

export default App;