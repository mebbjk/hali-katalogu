// FIX: Removed extraneous text from the end of the file that was causing parsing errors.
import React, { useState, useEffect, ChangeEvent, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useCarpets } from './hooks/useCarpets';
import { useSettings } from './contexts/SettingsContext';
import { useToast } from './contexts/ToastContext';
import type { Carpet } from './types';
import {
    HomeIcon, HeartIcon, SearchIcon, SettingsIcon, PlusCircleIcon, StarIcon, TrashIcon, EditIcon, XIcon,
    SunIcon, MoonIcon, SparklesIcon, CameraIcon, PhotoIcon, BarcodeScannerIcon
} from './components/icons';
import { readCodeFromImage } from './services/geminiService';


type ActiveTab = 'home' | 'favorites' | 'search' | 'settings';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('home');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAddCarpetModalOpen, setIsAddCarpetModalOpen] = useState(false);
    const [carpetToEdit, setCarpetToEdit] = useState<Carpet | null>(null);

    const handleOpenSettings = () => {
        setIsSettingsModalOpen(true);
    };

    const handleCloseSettings = () => {
        setIsSettingsModalOpen(false);
    };
    
    useEffect(() => {
        if (activeTab === 'settings') {
            handleOpenSettings();
        } else {
            handleCloseSettings();
        }
    }, [activeTab]);


    const renderView = () => {
        switch (activeTab) {
            case 'home':
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
            />
            
            <AnimatePresence>
                {isSettingsModalOpen && <SettingsModal onClose={() => setActiveTab('home')} />}
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
    const [isScanning, setIsScanning] = useState(false);
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredCarpets = carpets.filter(carpet =>
        Object.values(carpet).some(value => 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const handleSearchTermChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleCodeScan = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        setIsScanning(true);
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
            setIsScanning(false);
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex gap-2 sticky top-2 z-10">
                <input
                    type="text"
                    placeholder={t('search_by_text')}
                    value={searchTerm}
                    onChange={handleSearchTermChange}
                    className="w-full p-3 border rounded-lg bg-white/80 dark:bg-zinc-800/80 dark:border-zinc-700 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                 <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleCodeScan} className="hidden" />
                 
                 <button title={t('scan_barcode_qr')} onClick={() => fileInputRef.current?.click()} className="p-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex-shrink-0">
                    <BarcodeScannerIcon className="w-6 h-6" />
                </button>
            </div>
            
            {isScanning && <LoadingSpinner />}
            
            {!isScanning && (
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
    const { t } = useSettings();
    const { addToast } = useToast();

    const [formData, setFormData] = useState<Partial<Carpet>>(
        carpet || {
            name: '', brand: '', model: '', price: 0,
            size: [], pattern: '', texture: '', yarnType: [],
            type: '', description: '', barcodeId: '', qrCodeId: '',
        }
    );
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(carpet?.imageUrl || null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [customSize, setCustomSize] = useState('');
    const [customYarnType, setCustomYarnType] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);


    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: acceptedFiles => {
            const file = acceptedFiles[0];
            if (file) {
                setImageFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        },
        accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp'] },
        multiple: false,
    });
    
    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
             setImageFile(file);
             const reader = new FileReader();
             reader.onloadend = () => {
                 setImagePreview(reader.result as string);
             };
             reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }));
    };

    const handleAiFill = async () => {
        if (!imageFile && !imagePreview) {
            addToast(t('toast_image_required'), 'error');
            return;
        }
        let fileToAnalyze = imageFile;
        if (!fileToAnalyze && imagePreview) {
             const response = await fetch(imagePreview);
             const blob = await response.blob();
             fileToAnalyze = new File([blob], "image.jpg", { type: blob.type });
        }
        
        if (!fileToAnalyze) return;

        setIsAnalyzing(true);
        try {
            const details = await getDetailsFromImage(fileToAnalyze);
            setFormData(prev => ({ ...prev, ...details }));
            addToast(t('toast_ai_fill_success'), 'success');
        } catch (error) {
            addToast(t('toast_ai_error'), 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const toggleArrayItem = (field: 'size' | 'yarnType', value: string) => {
        const currentItems = formData[field] || [];
        const newItems = currentItems.includes(value)
            ? currentItems.filter(item => item !== value)
            : [...currentItems, value];
        setFormData(prev => ({ ...prev, [field]: newItems }));
    };

    const handleAddCustom = (field: 'size' | 'yarnType', value: string, setValue: (s:string)=>void) => {
        if (value && !(formData[field] || []).includes(value)) {
            setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), value] }));
        }
        setValue('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!imagePreview) {
            addToast(t('toast_new_carpet_image_required'), 'error');
            return;
        }
        
        try {
            if (carpet) {
                let imageUrl = carpet.imageUrl;
                if (imageFile) {
                    const reader = new FileReader();
                    imageUrl = await new Promise(resolve => {
                         reader.onloadend = () => resolve(reader.result as string);
                         reader.readAsDataURL(imageFile);
                    });
                }
                const updatedCarpet: Carpet = { ...carpet, ...formData, imageUrl };
                await updateCarpet(updatedCarpet);
                addToast(t('toast_carpet_updated'));
            } else if (imageFile) {
                await addCarpet(formData, imageFile);
                addToast(t('toast_carpet_added'));
            }
            onClose();
        } catch (error) {
            addToast(t('toast_generic_error'), 'error');
        }
    };
    
    const renderFormInput = (name: keyof Carpet, label: string, type = 'text') => (
        <div>
            <label htmlFor={name.toString()} className="block text-sm font-medium mb-1">{label}</label>
            <input
                id={name.toString()}
                name={name.toString()}
                type={type}
                value={formData[name]?.toString() || ''}
                onChange={type === 'number' ? handlePriceChange : handleInputChange}
                className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 dark:border-zinc-600 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
        </div>
    );
    
    const PRESET_SIZES = ['60x90 cm', '80x150 cm', '120x170 cm', '160x230 cm', '200x290 cm'];
    const PRESET_YARN_TYPES = ['Polyester', 'Wool', 'Polypropylene', 'Acrylic', 'Cotton'];

    return (
        <ModalBase title={carpet ? t('edit_carpet') : t('add_carpet')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4 p-4 max-h-[80vh] overflow-y-auto">
                <div className="space-y-2">
                     <div {...getRootProps()} className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer ${isDragActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-zinc-300 dark:border-zinc-600'}`}>
                        <input {...getInputProps()} />
                        {imagePreview ? (
                             <img src={imagePreview} alt="Preview" className="mx-auto max-h-40 rounded-md" />
                        ) : (
                            <p>{t('no_photo')}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                         <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileSelect} className="hidden" />
                         <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                         <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex-1 p-2 rounded-md bg-white dark:bg-zinc-700 flex items-center justify-center gap-2"><CameraIcon className="w-5 h-5"/>{t('take_photo')}</button>
                         <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 p-2 rounded-md bg-white dark:bg-zinc-700 flex items-center justify-center gap-2"><PhotoIcon className="w-5 h-5"/>{t('select_from_gallery')}</button>
                    </div>
                </div>

                <button type="button" onClick={handleAiFill} disabled={isAnalyzing || !imagePreview} className="w-full p-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-400 flex items-center justify-center gap-2">
                   {isAnalyzing ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{t('analyzing_image')}</> : <><SparklesIcon className="w-5 h-5" />{t('ai_fill_details')}</>}
                </button>
                
                {renderFormInput('name', t('name'))}
                {renderFormInput('brand', t('brand'))}
                {renderFormInput('model', t('model'))}
                {renderFormInput('price', t('price'), 'number')}
                <div>
                     <label className="block text-sm font-medium mb-1">{t('size')}</label>
                     <div className="flex flex-wrap gap-2">
                        {PRESET_SIZES.map(s => <button type="button" key={s} onClick={() => toggleArrayItem('size', s)} className={`px-3 py-1 text-sm rounded-full ${formData.size?.includes(s) ? 'bg-purple-600 text-white' : 'bg-white dark:bg-zinc-700'}`}>{s}</button>)}
                     </div>
                     <div className="flex gap-2 mt-2">
                        <input type="text" value={customSize} onChange={e => setCustomSize(e.target.value)} placeholder={t('custom_size')} className="flex-grow p-2 border rounded-md bg-white dark:bg-zinc-700 dark:border-zinc-600"/>
                        <button type="button" onClick={() => handleAddCustom('size', customSize, setCustomSize)} className="p-2 rounded-md bg-zinc-200 dark:bg-zinc-600">{t('add')}</button>
                     </div>
                </div>
                 <div>
                     <label className="block text-sm font-medium mb-1">{t('yarn_type')}</label>
                     <div className="flex flex-wrap gap-2">
                        {PRESET_YARN_TYPES.map(yt => <button type="button" key={yt} onClick={() => toggleArrayItem('yarnType', yt)} className={`px-3 py-1 text-sm rounded-full ${formData.yarnType?.includes(yt) ? 'bg-purple-600 text-white' : 'bg-white dark:bg-zinc-700'}`}>{yt}</button>)}
                     </div>
                     <div className="flex gap-2 mt-2">
                        <input type="text" value={customYarnType} onChange={e => setCustomYarnType(e.target.value)} placeholder={t('custom_yarn_type')} className="flex-grow p-2 border rounded-md bg-white dark:bg-zinc-700 dark:border-zinc-600"/>
                        <button type="button" onClick={() => handleAddCustom('yarnType', customYarnType, setCustomYarnType)} className="p-2 rounded-md bg-zinc-200 dark:bg-zinc-600">{t('add_yarn_type')}</button>
                     </div>
                </div>
                {renderFormInput('pattern', t('pattern'))}
                {renderFormInput('texture', t('texture'))}
                {renderFormInput('type', t('type'))}
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">{t('description')}</label>
                    <textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} rows={3} className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 dark:border-zinc-600 focus:ring-1 focus:ring-purple-500 focus:outline-none"/>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-zinc-200 dark:bg-zinc-600">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700">{t('save')}</button>
                </div>
            </form>
        </ModalBase>
    );
};


const BottomNavBar: React.FC<{
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    onAddClick: () => void;
}> = ({ activeTab, setActiveTab, onAddClick }) => {
    const navItems: { id: ActiveTab; icon: React.FC<any>; label: string }[] = [
        { id: 'home', icon: HomeIcon, label: 'home' },
        { id: 'favorites', icon: HeartIcon, label: 'favorites' },
        { id: 'search', icon: SearchIcon, label: 'search' },
        { id: 'settings', icon: SettingsIcon, label: 'settings' }
    ];
    const { t } = useSettings();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-t-lg z-50">
            <div className="max-w-2xl mx-auto flex justify-around items-center h-16">
                {navItems.slice(0, 2).map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center w-16 h-16 transition-colors ${activeTab === item.id ? 'text-purple-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        <item.icon className="w-7 h-7" />
                        <span className="text-xs">{t(item.label)}</span>
                    </button>
                ))}

                <button onClick={onAddClick} className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center transform -translate-y-4 shadow-lg hover:bg-purple-700">
                    <PlusCircleIcon className="w-8 h-8" />
                </button>

                {navItems.slice(2).map(item => (
                     <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center w-16 h-16 transition-colors ${activeTab === item.id ? 'text-purple-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        <item.icon className="w-7 h-7" />
                        <span className="text-xs">{t(item.label)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();
    return (
        <div className="fixed top-4 right-4 z-[100] space-y-2">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        layout
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-center justify-between p-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                    >
                        <span>{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="ml-4 text-white hover:bg-white/20 rounded-full p-1">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center p-8">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
    </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center py-16 text-zinc-500">
        <p>{message}</p>
    </div>
);

const CarpetList: React.FC<{ carpets: Carpet[]; onEdit: (carpet: Carpet) => void }> = ({ carpets, onEdit }) => {
    const { toggleFavorite, deleteCarpet } = useCarpets();
    const { t } = useSettings();
    return (
        <div className="space-y-4">
            {carpets.map(carpet => (
                <motion.div 
                  key={carpet.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden"
                >
                    <img src={carpet.imageUrl} alt={carpet.name} className="w-full h-48 object-cover" />
                    <div className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold">{carpet.name}</h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{carpet.brand} - {carpet.model}</p>
                            </div>
                             <button onClick={() => toggleFavorite(carpet.id)} className="p-2 -mr-2 -mt-2">
                                <StarIcon className={`w-6 h-6 transition-colors ${carpet.isFavorite ? 'text-yellow-400 fill-current' : 'text-zinc-400'}`} />
                            </button>
                        </div>
                        <p className="mt-2 text-zinc-600 dark:text-zinc-300">{carpet.description}</p>
                        <div className="mt-4 flex justify-end gap-2">
                             <button onClick={() => onEdit(carpet)} className="p-2 text-zinc-500 hover:text-purple-600"><EditIcon className="w-5 h-5"/></button>
                             <button onClick={() => {
                                 if (window.confirm(`${t('confirm_delete')} ${carpet.name}?`)) {
                                     deleteCarpet(carpet.id);
                                 }
                             }} className="p-2 text-zinc-500 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

const ModalBase: React.FC<{ title: string; onClose: () => void; children: ReactNode }> = ({ title, onClose, children }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-zinc-100 dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b dark:border-zinc-700">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                {children}
            </motion.div>
        </motion.div>
    );
};


export default App;