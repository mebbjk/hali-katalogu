import React, { useState, useEffect, ChangeEvent, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCarpets } from '../hooks/useCarpets';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import type { Carpet } from '../types';
import {
    HomeIcon, HeartIcon, SearchIcon, SettingsIcon, PlusCircleIcon, StarIcon, TrashIcon, EditIcon, XIcon,
    SunIcon, MoonIcon, SparklesIcon, CameraIcon, PhotoIcon, CheckIcon, BarcodeScannerIcon
} from './components/icons';
import { readCodeFromImage } from '../services/geminiService';


type ActiveTab = 'home' | 'favorites' | 'search' | 'settings_dummy';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('home');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAddCarpetModalOpen, setIsAddCarpetModalOpen] = useState(false);
    const [carpetToEdit, setCarpetToEdit] = useState<Carpet | null>(null);

    const handleOpenSettings = () => {
        setActiveTab('settings_dummy');
        setIsSettingsModalOpen(true);
    };

    const handleCloseSettings = () => {
        setIsSettingsModalOpen(false);
        setActiveTab('home'); // or whichever tab was active before
    };

    const renderView = () => {
        switch (activeTab) {
            case 'home':
            case 'settings_dummy': // Keep rendering home view when settings are open
                return <HomeView onEdit={setCarpetToEdit} />;
            case 'favorites':
                return <FavoritesView onEdit={setCarpetToEdit} />;
            case 'search':
                return <SearchView onEdit={setCarpetToEdit} />;
            default:
                return <HomeView onEdit={setCarpetToEdit} />;
        }
    };
    
    useEffect(() => {
        if(carpetToEdit) {
            setIsAddCarpetModalOpen(true);
        }
    }, [carpetToEdit]);
    
    useEffect(() => {
        if(!isAddCarpetModalOpen) {
            setCarpetToEdit(null);
        }
    }, [isAddCarpetModalOpen]);

    return (
        <div className="bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-slate-200 min-h-screen font-sans antialiased selection:bg-purple-500/30">
            <div className="container mx-auto max-w-2xl pb-24 relative">
                <main className="p-4">
                    {renderView()}
                </main>
            </div>
            
            <BottomNavBar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                onAddClick={() => setIsAddCarpetModalOpen(true)}
                onSettingsClick={handleOpenSettings}
            />
            
            <AnimatePresence>
                {isSettingsModalOpen && <SettingsModal onClose={handleCloseSettings} />}
                {isAddCarpetModalOpen && <CarpetFormModal carpet={carpetToEdit} onClose={() => setIsAddCarpetModalOpen(false)} />}
            </AnimatePresence>

            <ToastContainer />
        </div>
    );
};


// Views
const HomeView: React.FC<{onEdit: (carpet: Carpet) => void;}> = ({onEdit}) => {
    const { carpets, loading, error } = useCarpets();
    const { t } = useSettings();
    if (loading) return <LoadingSpinner />;
    if (error) return <p className="text-red-500 text-center">{error}</p>;
    if (carpets.length === 0) return <EmptyState message={t('no_carpets_found')} />;
    return <CarpetList carpets={carpets} onEdit={onEdit} />;
};

const FavoritesView: React.FC<{onEdit: (carpet: Carpet) => void;}> = ({onEdit}) => {
    const { carpets, loading, error } = useCarpets();
    const { t } = useSettings();
    if (loading) return <LoadingSpinner />;
    if (error) return <p className="text-red-500 text-center">{error}</p>;
    const favoriteCarpets = carpets.filter(c => c.isFavorite);
    if (favoriteCarpets.length === 0) return <EmptyState message={t('no_carpets_found')} />;
    return <CarpetList carpets={favoriteCarpets} onEdit={onEdit} />;
};

const SearchView: React.FC<{onEdit: (carpet: Carpet) => void;}> = ({onEdit}) => {
    const { carpets } = useCarpets();
    const { t } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchingByImage, setIsSearchingByImage] = useState(false);
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredCarpets = carpets.filter(carpet =>
        Object.values(carpet).some(value => 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const handleCodeScan = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        setIsSearchingByImage(true);
        try {
            const code = await readCodeFromImage(file);
            if(code) {
                 addToast(`${t('scan_success')}: ${code}`, 'success');
                 setSearchTerm(code);
            } else {
                 addToast(t('scan_error'), 'error');
            }
        } catch (e) {
            addToast(t('toast_ai_error'), 'error');
            console.error(e);
        } finally {
            setIsSearchingByImage(false);
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex gap-2 sticky top-2 z-10">
                <input
                    type="text"
                    placeholder={t('search_by_text')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white/80 dark:bg-zinc-800/80 dark:border-zinc-700 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                 <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleCodeScan} className="hidden" />
                 <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex-shrink-0">
                    <BarcodeScannerIcon className="w-6 h-6" />
                </button>
            </div>
            
            {isSearchingByImage && <LoadingSpinner />}
            
            {!isSearchingByImage && (
                filteredCarpets.length > 0 
                    ? <CarpetList carpets={filteredCarpets} onEdit={onEdit} />
                    : <EmptyState message={t('no_carpets_found')} />
            )}
        </div>
    );
};


// Modals
const SettingsModal: React.FC<{onClose: () => void}> = ({onClose}) => {
    const { theme, setTheme, language, setLanguage, t } = useSettings();
    const { replaceAllCarpets, carpets } = useCarpets();
    const { addToast } = useToast();
    const importFileRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        try {
            const dataStr = JSON.stringify(carpets, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = 'carpets_export.json';
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            addToast(t('toast_export_success'));
        } catch (e) {
            addToast(t('toast_generic_error'), 'error');
        }
    };
    
    const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!window.confirm(t('import_warning'))) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const newCarpets = JSON.parse(text) as Carpet[];
                    if (Array.isArray(newCarpets) && newCarpets.every(c => c.id && c.name)) {
                        await replaceAllCarpets(newCarpets);
                        addToast(t('toast_import_success'));
                        onClose();
                    } else {
                        throw new Error("Invalid format");
                    }
                }
            } catch (error) {
                addToast(t('toast_import_error'), 'error');
            }
        };
        reader.readAsText(file);
    };

    return (
        <ModalBase title={t('settings')} onClose={onClose}>
            <div className="space-y-6 p-4">
                 <div>
                    <h3 className="text-lg font-semibold mb-2">{t('theme')}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setTheme('light')} className={`flex-1 p-2 rounded-md flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-zinc-700'}`}><SunIcon className="w-5 h-5"/>{t('light')}</button>
                        <button onClick={() => setTheme('dark')} className={`flex-1 p-2 rounded-md flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-zinc-700'}`}><MoonIcon className="w-5 h-5"/>{t('dark')}</button>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">{t('language')}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setLanguage('en')} className={`flex-1 p-2 rounded-md ${language === 'en' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-zinc-700'}`}>English</button>
                        <button onClick={() => setLanguage('tr')} className={`flex-1 p-2 rounded-md ${language === 'tr' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-zinc-700'}`}>Türkçe</button>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">{t('import_export_data')}</h3>
                    <div className="flex gap-2">
                        <input type="file" accept=".json" ref={importFileRef} onChange={handleImport} className="hidden" />
                        <button onClick={() => importFileRef.current?.click()} className="flex-1 p-2 rounded-md bg-white dark:bg-zinc-700">{t('import_data')}</button>
                        <button onClick={handleExport} className="flex-1 p-2 rounded-md bg-white dark:bg-zinc-700">{t('export_data')}</button>
                    </div>
                </div>
            </div>
        </ModalBase>
    );
};

const CarpetFormModal: React.FC<{ carpet: Carpet | null; onClose: () => void }> = ({ carpet, onClose }) => {
    const { addCarpet, updateCarpet, getDetailsFromImage } = useCarpets();
    const { addToast } = useToast();
    const { t } = useSettings();
    
    const [formData, setFormData] = useState<Partial<Carpet>>(carpet || {});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(carpet?.imageUrl || null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const [customYarnType, setCustomYarnType] = useState('');
    
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
        setShowPhotoOptions(false);
    };

    const handleCodeScan = async (field: 'barcodeId' | 'qrCodeId') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                 setIsAnalyzing(true);
                 try {
                     const code = await readCodeFromImage(file);
                     if(code) {
                        setFormData(prev => ({...prev, [field]: code}));
                        addToast(`${t('scan_success')}: ${code}`, 'success');
                     } else {
                        addToast(t('scan_error'), 'error');
                     }
                 } catch(err) {
                    addToast(t('toast_ai_error'), 'error');
                 } finally {
                    setIsAnalyzing(false);
                 }
            }
        };
        input.click();
    };
    
    const handleAiFill = async () => {
        if (!imageFile && !previewUrl) { // Use imageFile for new images, previewUrl for existing
            addToast(t('no_photo'), 'error');
            return;
        }
        setIsAnalyzing(true);
        try {
            let details: Partial<Carpet>;
            if (imageFile) {
                details = await getDetailsFromImage(imageFile);
            } else if (previewUrl) {
                // If we only have a URL (editing), we can't re-analyze.
                // A better implementation would fetch the blob if needed.
                addToast("AI analysis requires a new photo.", "error");
                setIsAnalyzing(false);
                return;
            }
            setFormData(prev => ({ ...prev, ...details }));
            addToast(t('ai_fill_details'), 'success');
        } catch (e) {
            addToast(t('toast_ai_error'), 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (carpet) {
                await updateCarpet({ ...carpet, ...formData });
                addToast(t('toast_carpet_updated'));
            } else { 
                if (!imageFile) {
                    addToast(t('no_photo'), "error");
                    return;
                }
                await addCarpet(formData, imageFile);
                addToast(t('toast_carpet_added'));
            }
            onClose();
        } catch (error) {
            addToast(t('toast_generic_error'), 'error');
        }
    };
    
    const toggleArrayValue = (field: 'size' | 'yarnType', value: string) => {
        const currentValues = formData[field] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        setFormData(prev => ({...prev, [field]: newValues}));
    };

    const addCustomYarnType = () => {
        if (customYarnType && !formData.yarnType?.includes(customYarnType)) {
            toggleArrayValue('yarnType', customYarnType);
            setCustomYarnType('');
        }
    };

    const fixedSizes = ["80x150 cm", "120x180 cm", "160x230 cm", "200x300 cm", "240x340 cm", "Runner"];
    const fixedYarnTypes = ["Yün", "Polyester", "Akrilik", "Pamuk", "Jüt", "Viskon"];

    return (
        <ModalBase title={carpet ? t('edit_carpet') : t('add_carpet')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4 p-1">
                <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto">
                    <div className="relative">
                        <div onClick={() => setShowPhotoOptions(true)} className="cursor-pointer w-full h-48 bg-zinc-200 dark:bg-zinc-700 rounded-md flex items-center justify-center mb-2 overflow-hidden">
                            {previewUrl ? <img src={previewUrl} alt="preview" className="w-full h-full object-cover"/> : <span className="text-zinc-500 flex flex-col items-center gap-2"><PhotoIcon className="w-8 h-8"/><span>{t('add')}</span></span>}
                        </div>
                        <AnimatePresence>
                        {showPhotoOptions && (
                            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 rounded-md">
                                <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageChange} className="hidden" />
                                <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleImageChange} className="hidden" />
                                <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-4 bg-white/20 rounded-full text-white"><CameraIcon className="w-8 h-8"/></button>
                                <button type="button" onClick={() => galleryInputRef.current?.click()} className="p-4 bg-white/20 rounded-full text-white"><PhotoIcon className="w-8 h-8"/></button>
                                <button type="button" onClick={(e) => {e.stopPropagation(); setShowPhotoOptions(false);}} className="absolute top-2 right-2 p-1 bg-white/20 rounded-full text-white"><XIcon className="w-5 h-5"/></button>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                    
                    {(previewUrl || imageFile) && (
                        <button type="button" onClick={handleAiFill} disabled={isAnalyzing} className="p-2 w-full flex justify-center items-center gap-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-400">
                            <SparklesIcon className="w-5 h-5" />
                            {isAnalyzing ? t('analyzing_image') : t('ai_fill_details')}
                        </button>
                    )}

                    <FormField label={t('name')}><FormInput name="name" value={formData.name || ''} onChange={setFormData} /></FormField>
                    <FormField label={t('brand')}><FormInput name="brand" value={formData.brand || ''} onChange={setFormData} /></FormField>
                    <FormField label={t('model')}><FormInput name="model" value={formData.model || ''} onChange={setFormData} /></FormField>
                    <FormField label={t('price')}><FormInput name="price" type="number" value={formData.price || ''} onChange={setFormData} /></FormField>
                    
                    <FormField label={t('fixed_sizes')}>
                        <div className="flex flex-wrap gap-2">
                            {fixedSizes.map(size => (
                                <TagButton key={size} active={!!formData.size?.includes(size)} onClick={() => toggleArrayValue('size', size)}>{size}</TagButton>
                            ))}
                        </div>
                    </FormField>
                    {/* TODO: Add custom size input */}

                    <FormField label={t('yarn_type')}>
                        <div className="flex flex-wrap gap-2">
                            {fixedYarnTypes.map(type => (
                                <TagButton key={type} active={!!formData.yarnType?.includes(type)} onClick={() => toggleArrayValue('yarnType', type)}>{type}</TagButton>
                            ))}
                        </div>
                    </FormField>
                    <FormField label={t('custom_yarn_type')}>
                         <div className="flex gap-2">
                            <FormInput name="custom_yarn" value={customYarnType} customOnChange={(e) => setCustomYarnType(e.target.value)} />
                            <button type="button" onClick={addCustomYarnType} className="px-4 rounded-md bg-zinc-200 dark:bg-zinc-600 text-sm">{t('add')}</button>
                        </div>
                    </FormField>

                    <FormField label={t('barcodeId')}>
                        <div className="flex gap-2">
                           <FormInput name="barcodeId" value={formData.barcodeId || ''} onChange={setFormData} />
                           <button type="button" onClick={() => handleCodeScan('barcodeId')} className="p-2 rounded-md bg-zinc-200 dark:bg-zinc-600"><BarcodeScannerIcon className="w-6 h-6"/></button>
                        </div>
                    </FormField>
                    <FormField label={t('qrCodeId')}>
                        <div className="flex gap-2">
                           <FormInput name="qrCodeId" value={formData.qrCodeId || ''} onChange={setFormData} />
                           <button type="button" onClick={() => handleCodeScan('qrCodeId')} className="p-2 rounded-md bg-zinc-200 dark:bg-zinc-600"><BarcodeScannerIcon className="w-6 h-6"/></button>
                        </div>
                    </FormField>
                    
                    <FormField label={t('description')}><FormTextArea name="description" value={formData.description || ''} onChange={setFormData} /></FormField>
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-zinc-200 dark:border-zinc-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-zinc-200 dark:bg-zinc-600">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-purple-600 text-white">{t('save')}</button>
                </div>
            </form>
        </ModalBase>
    );
};


// UI Components
const CarpetList: React.FC<{ carpets: Carpet[]; onEdit: (carpet: Carpet) => void; }> = ({ carpets, onEdit }) => {
    return (
        <div className="space-y-4">
            {carpets.map(carpet => (
                <CarpetCard key={carpet.id} carpet={carpet} onEdit={onEdit} />
            ))}
        </div>
    );
};

const CarpetCard: React.FC<{ carpet: Carpet; onEdit: (carpet: Carpet) => void; }> = ({ carpet, onEdit }) => {
    const { toggleFavorite, deleteCarpet } = useCarpets();
    const { addToast } = useToast();
    const { t } = useSettings();

    const handleDelete = () => {
        if(window.confirm(`${t('confirm_delete')} "${carpet.name}"?`)){
            deleteCarpet(carpet.id);
            addToast(t('toast_carpet_deleted'));
        }
    };

    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden">
            <img src={carpet.imageUrl} alt={carpet.name} className="w-full h-48 object-cover" />
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{carpet.name}</h3>
                        <p className="text-sm text-zinc-500">{carpet.brand} - {carpet.model}</p>
                    </div>
                    <button onClick={() => toggleFavorite(carpet.id)} className={`p-2 rounded-full transition-colors ${carpet.isFavorite ? 'text-yellow-400' : 'text-zinc-400 hover:text-yellow-400'}`}>
                        <StarIcon className={`w-6 h-6 transition-transform duration-300 ${carpet.isFavorite ? 'fill-current scale-110' : ''}`} />
                    </button>
                </div>
                <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-300 line-clamp-2">{carpet.description}</p>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => onEdit(carpet)} className="p-2 text-zinc-500 hover:text-purple-500"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={handleDelete} className="p-2 text-zinc-500 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </div>
        </motion.div>
    );
};

const BottomNavBar: React.FC<{ activeTab: ActiveTab; setActiveTab: (tab: ActiveTab) => void; onAddClick: () => void; onSettingsClick: () => void; }> = ({ activeTab, setActiveTab, onAddClick, onSettingsClick }) => {
    const { t } = useSettings();
    const tabs: { id: ActiveTab; icon: React.FC<any>; label: string }[] = [
        { id: 'home', icon: HomeIcon, label: t('home') },
        { id: 'favorites', icon: HeartIcon, label: t('favorites') },
        { id: 'search', icon: SearchIcon, label: t('search') },
    ];
    
    // Find the index of the active tab to position the indicator
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

    return (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-lg shadow-lg rounded-full z-50 w-[calc(100%-2rem)] max-w-sm">
            <div className="flex justify-around items-center p-1 relative">
                {/* Animated Indicator */}
                <AnimatePresence>
                {activeIndex !== -1 && (
                    <motion.div
                        layoutId="active-tab-indicator"
                        className="absolute top-1 h-[calc(100%-0.5rem)] w-16 bg-purple-600/20 dark:bg-purple-500/30 rounded-full"
                        initial={{ x: activeIndex * 68 }} // Approximate width of a tab item
                        animate={{ x: activeIndex * 68 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                )}
                </AnimatePresence>

                 {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative flex flex-col items-center gap-1 p-2 rounded-full transition-colors w-16 z-10 ${activeTab === tab.id ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-500'}`}>
                        <tab.icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{tab.label}</span>
                    </button>
                ))}
                
                <button onClick={onAddClick} className="relative z-10 p-4 bg-purple-600 text-white rounded-full shadow-lg -translate-y-3.5">
                    <PlusCircleIcon className="w-8 h-8"/>
                </button>
                
                 <button onClick={onSettingsClick} className={`relative flex flex-col items-center gap-1 p-2 rounded-full transition-colors w-16 z-10 ${activeTab === 'settings_dummy' ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-500'}`}>
                        <SettingsIcon className="w-6 h-6" />
                        <span className="text-xs font-medium">{t('settings')}</span>
                </button>
            </div>
        </nav>
    );
};

const ToastContainer = () => {
    const { toasts } = useToast();
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-xs">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div 
                        key={toast.id} 
                        layout
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        className={`px-4 py-3 rounded-md shadow-lg text-white font-semibold ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {toast.message}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

const ModalBase: React.FC<{title: string, children: ReactNode, onClose: () => void;}> = ({title, children, onClose}) => {
    return (
        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: 50, opacity: 0}} className="bg-zinc-100 dark:bg-zinc-900 rounded-lg max-w-lg w-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"/></button>
                </header>
                {children}
            </motion.div>
        </motion.div>
    );
};

const FormField: React.FC<{label: string, children: ReactNode}> = ({label, children}) => (
    <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        {children}
    </div>
);

const FormInput: React.FC<{name: string, value: string | number, type?: string, onChange?: (state: React.SetStateAction<Partial<Carpet>>) => void, customOnChange?: (e: ChangeEvent<HTMLInputElement>) => void}> = 
({name, value, type="text", onChange, customOnChange}) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (customOnChange) {
            customOnChange(e);
        } else if (onChange) {
            const { name, value } = e.target;
            onChange(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
        }
    };
    return (
        <input
            type={type}
            name={name}
            value={value}
            onChange={handleChange}
            className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 dark:border-zinc-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
    );
};

const FormTextArea: React.FC<{name: string, value: string, onChange: (state: React.SetStateAction<Partial<Carpet>>) => void}> = 
({name, value, onChange}) => {
    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        onChange(prev => ({ ...prev, [name]: value }));
    };
    return (
        <textarea
            name={name}
            value={value}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 dark:border-zinc-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
    );
};

const TagButton: React.FC<{active: boolean, children: ReactNode, onClick: () => void;}> = ({active, children, onClick}) => (
    <button type="button" onClick={onClick} className={`px-3 py-1 text-sm rounded-full border-2 transition-colors ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-zinc-700 border-transparent hover:border-purple-500'}`}>
        {active && <CheckIcon className="inline w-4 h-4 mr-1"/>}
        {children}
    </button>
);


const LoadingSpinner = () => <div className="text-center p-8 text-zinc-500">{useSettings().t('loading')}</div>;
const EmptyState: React.FC<{message: string}> = ({message}) => <div className="text-center p-8 text-zinc-500">{message}</div>;

export default App;