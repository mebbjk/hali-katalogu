import React, { useState, useCallback, useMemo, ChangeEvent, DragEvent, useRef, useEffect } from 'react';
import { AppScreen, Carpet } from './types';
import { useCarpets } from './hooks/useCarpets';
import { useSettings } from './hooks/useSettings';
import { extractCarpetDetails, findMatchingCarpet } from './services/geminiService';
import {
  PlusIcon, SearchIcon, ListIcon, TrashIcon, ArrowLeftIcon,
  SpinnerIcon, StarIcon, CogIcon, UploadCloudIcon, DownloadCloudIcon
} from './components/icons';

const App = () => {
  const { carpets, addCarpet, deleteCarpet, updateCarpet, toggleFavorite, saveCarpets } = useCarpets();
  const { t, language, setLanguage, theme, setTheme } = useSettings();

  const [screen, setScreen] = useState<AppScreen>(AppScreen.LIST);
  const [selectedCarpetId, setSelectedCarpetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<Carpet | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carpetToDelete, setCarpetToDelete] = useState<string | null>(null);
  const [previousScreen, setPreviousScreen] = useState<AppScreen>(AppScreen.LIST);


  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);


  const navigate = (newScreen: AppScreen, carpetId?: string) => {
    if (newScreen !== screen) {
      setPreviousScreen(screen);
    }
    setScreen(newScreen);
    setSelectedCarpetId(carpetId || null);
    setError(null);
    setSearchResult(null);
  };

  const handleBackNavigation = () => {
    setScreen(previousScreen);
    setError(null);
    setSearchResult(null);
  };

  const handleImageUploadForAdd = async (file: File) => {
    setLoading(true);
    setLoadingMessage(t('analyzingImage'));
    setError(null);
    try {
      const details = await extractCarpetDetails(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const newCarpet: Carpet = {
          id: `carpet-${Date.now()}`,
          name: details.name || t('unknown'),
          description: details.description || '',
          imageUrl: reader.result as string,
          isFavorite: false,
          ...details
        };
        addCarpet(newCarpet);
        navigate(AppScreen.DETAIL, newCarpet.id);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(t('errorExtractingDetails'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploadForSearch = async (file: File) => {
    setLoading(true);
    setLoadingMessage(t('searchingForMatch'));
    setError(null);
    setSearchResult(null);
    try {
      const match = await findMatchingCarpet(file, carpets);
      setSearchResult(match);
      if (!match) {
        setError(t('noMatchFound'));
      }
    } catch (err) {
      setError(t('errorSearching'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCarpet = useMemo(() => {
    return carpets.find(c => c.id === selectedCarpetId) || null;
  }, [selectedCarpetId, carpets]);
  
  const confirmDelete = (carpetId: string) => {
      setCarpetToDelete(carpetId);
      setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if(carpetToDelete){
        deleteCarpet(carpetToDelete);
        setScreen(previousScreen); // Go back after deleting
    }
    setShowDeleteModal(false);
    setCarpetToDelete(null);
  };

  const renderScreen = () => {
    switch (screen) {
      case AppScreen.ADD:
        return <AddCarpetScreen onImageUpload={handleImageUploadForAdd} />;
      case AppScreen.SEARCH:
        return <SearchCarpetScreen onImageUpload={handleImageUploadForSearch} result={searchResult} onNavigate={navigate} />;
      case AppScreen.DETAIL:
        return selectedCarpet ? <CarpetDetailScreen carpet={selectedCarpet} onBack={handleBackNavigation} onUpdate={updateCarpet} onDelete={confirmDelete} onToggleFavorite={toggleFavorite} /> : <div className="p-4">{t('noCarpets')}</div>;
      case AppScreen.FAVORITES:
        return <CarpetListScreen carpets={carpets.filter(c => c.isFavorite)} onSelectCarpet={(id) => navigate(AppScreen.DETAIL, id)} emptyMessage={t('noFavorites')} />;
      case AppScreen.SETTINGS:
        return <SettingsScreen />;
      case AppScreen.LIST:
      default:
        return <CarpetListScreen carpets={carpets} onSelectCarpet={(id) => navigate(AppScreen.DETAIL, id)} />;
    }
  };
  
  const headerText: Record<string, string> = {
    [AppScreen.LIST]: t('appName'),
    [AppScreen.ADD]: t('addNewCarpet'),
    [AppScreen.SEARCH]: t('searchForCarpet'),
    [AppScreen.DETAIL]: t('carpetDetails'),
    [AppScreen.FAVORITES]: t('favorites'),
    [AppScreen.SETTINGS]: t('settings'),
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans shadow-2xl">
      <header className="sticky top-0 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-sm shadow-sm p-4 flex items-center justify-between z-10">
         {screen !== AppScreen.LIST ? (
           <button onClick={handleBackNavigation} className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"><ArrowLeftIcon /></button>
         ) : <div className="w-8" /> }
         <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">{headerText[screen]}</h1>
         <div className="w-8" />
      </header>

      <main className="flex-grow overflow-y-auto p-4 pb-24">
        {error && !loading && <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
        {loading ? <LoadingOverlay message={loadingMessage} /> : renderScreen()}
      </main>

      {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 w-full max-w-sm mx-4 shadow-xl">
                  <h3 className="text-lg font-bold mb-4">{t('deleteCarpet')}</h3>
                  <p className="mb-6 text-slate-600 dark:text-slate-300">{t('deleteConfirmation')}</p>
                  <div className="flex justify-end gap-4">
                      <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold">{t('cancel')}</button>
                      <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold">{t('delete')}</button>
                  </div>
              </div>
          </div>
      )}

      <BottomNav currentScreen={screen} onNavigate={navigate} />
    </div>
  );
};

// --- Sub-components ---

const LoadingOverlay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <SpinnerIcon />
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-lg">{message}</p>
    </div>
);

const BottomNav = ({ currentScreen, onNavigate }: { currentScreen: AppScreen; onNavigate: (screen: AppScreen) => void; }) => {
    const { t } = useSettings();
    const navItems = [
        { screen: AppScreen.LIST, icon: <ListIcon />, label: t('list') },
        { screen: AppScreen.SEARCH, icon: <SearchIcon />, label: t('search') },
        { screen: AppScreen.FAVORITES, icon: <StarIcon filled={currentScreen === AppScreen.FAVORITES} />, label: t('favorites') },
        { screen: AppScreen.SETTINGS, icon: <CogIcon />, label: t('settings') },
    ];

    const NavButton = ({ item }: {item: typeof navItems[0]}) => (
         <button
            onClick={() => onNavigate(item.screen)}
            className={`flex flex-col items-center justify-center p-2 w-full text-xs transition-colors duration-200 ${currentScreen === item.screen ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
            {item.icon}
            <span className="mt-1">{item.label}</span>
        </button>
    )

    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 flex items-center z-20">
            <div className="flex justify-around w-full">
                <NavButton item={navItems[0]}/>
                <NavButton item={navItems[1]}/>
            </div>

            <div className="relative w-20 flex justify-center">
                 <button onClick={() => onNavigate(AppScreen.ADD)} className="absolute -top-8 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
                    <PlusIcon />
                </button>
            </div>
           
            <div className="flex justify-around w-full">
                 <NavButton item={navItems[2]}/>
                 <NavButton item={navItems[3]}/>
            </div>
        </nav>
    );
};

const CarpetListScreen = ({ carpets, onSelectCarpet, emptyMessage }: { carpets: Carpet[]; onSelectCarpet: (id: string) => void; emptyMessage?: string; }) => {
    const { t } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredCarpets = useMemo(() => {
        if (!searchTerm) return carpets;
        const lowercasedTerm = searchTerm.toLowerCase();
        return carpets.filter(c => 
            Object.values(c).some(value => 
                typeof value === 'string' && value.toLowerCase().includes(lowercasedTerm)
            )
        );
    }, [carpets, searchTerm]);

    if (carpets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-lg text-slate-500">{emptyMessage || t('noCarpets')}</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            <div className="sticky -top-4 bg-slate-100 dark:bg-slate-950 py-2 z-0">
                <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border-none rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            {filteredCarpets.length > 0 ? (
                 <div className="grid grid-cols-2 gap-4">
                    {filteredCarpets.map(carpet => (
                        <div key={carpet.id} onClick={() => onSelectCarpet(carpet.id)} className="cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden group ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-blue-500 transition-shadow">
                            <div className="relative">
                                <img src={carpet.imageUrl} alt={carpet.name} className="w-full h-40 object-cover group-hover:opacity-90 transition-opacity" />
                                {carpet.isFavorite && (
                                     <div className="absolute top-2 right-2 bg-slate-900/50 rounded-full p-1">
                                        <StarIcon filled={true} />
                                     </div>
                                )}
                            </div>
                            <div className="p-3">
                                <h3 className="font-semibold truncate text-slate-800 dark:text-slate-200">{carpet.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{carpet.brand}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-slate-500">
                    <p>{t('noSearchResults')}</p>
                </div>
            )}
        </div>
    );
};

type EditableCarpetProperties = 'name' | 'brand' | 'model' | 'price' | 'size' | 'pattern' | 'texture' | 'yarnType' | 'type' | 'description';

const CarpetDetailScreen = ({ carpet, onBack, onUpdate, onDelete, onToggleFavorite }: { carpet: Carpet; onBack: () => void; onUpdate: (carpet: Carpet) => void; onDelete: (id: string) => void; onToggleFavorite: (id: string) => void; }) => {
    const { t } = useSettings();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(carpet);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? Number(value) || 0 : value }));
    };
    
    const handleSave = () => {
        onUpdate(formData);
        setIsEditing(false);
    };

    const detailFields: { labelKey: string, name: EditableCarpetProperties, type?: 'text' | 'number' }[] = [
        { labelKey: 'brand', name: 'brand', type: 'text' },
        { labelKey: 'model', name: 'model', type: 'text' },
        { labelKey: 'price', name: 'price', type: 'number' },
        { labelKey: 'size', name: 'size', type: 'text' },
        { labelKey: 'pattern', name: 'pattern', type: 'text' },
        { labelKey: 'texture', name: 'texture', type: 'text' },
        { labelKey: 'yarnType', name: 'yarnType', type: 'text' },
        { labelKey: 'type', name: 'type', type: 'text' },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden">
            <img src={carpet.imageUrl} alt={carpet.name} className="w-full h-64 object-cover" />
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                    {isEditing ? (
                         <input
                            type='text'
                            name='name'
                            value={formData.name}
                            onChange={handleInputChange}
                            className="text-2xl font-bold w-full mr-2 px-2 py-1 border-none rounded-lg bg-slate-200 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    ) : (
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{carpet.name}</h2>
                    )}
                    <button onClick={() => onToggleFavorite(carpet.id)} className="p-1 -mr-1 text-slate-400 hover:text-yellow-400">
                        <StarIcon filled={!!carpet.isFavorite} />
                    </button>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                   {detailFields.map(field => (
                       <div key={field.name}>
                           <label className="text-sm font-medium text-slate-500 dark:text-slate-400">{t(field.labelKey)}</label>
                           {isEditing ? (
                                <input
                                    type={field.type || 'text'}
                                    name={field.name}
                                    value={formData[field.name as keyof Carpet] as string | number || ''}
                                    onChange={handleInputChange}
                                    className="w-full mt-1 px-3 py-1.5 border-none rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                           ) : (
                                <p className="text-slate-800 dark:text-slate-200 font-semibold">{carpet[field.name as keyof Carpet] || t('unknown')}</p>
                           )}
                       </div>
                   ))}
                </div>

                <div>
                     <label className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('description')}</label>
                     {isEditing ? (
                         <textarea
                            name='description'
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={5}
                            className="w-full mt-1 px-3 py-2 border-none rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                     ): (
                         <p className="mt-1 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{carpet.description}</p>
                     )}
                </div>

                <div className="mt-2 flex items-center gap-4">
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} className="flex-grow px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">{t('save')}</button>
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold">{t('cancel')}</button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="flex-grow px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold">{t('edit')}</button>
                    )}
                     <button onClick={() => onDelete(carpet.id)} className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors">
                        <TrashIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ImageDropzone = ({ onDrop }: { onDrop: (file: File) => void; }) => {
    const { t } = useSettings();
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: DragEvent<HTMLDivElement>, enter: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(enter);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        handleDrag(e, false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onDrop(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };
    
    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
            onDrop(e.target.files[0]);
        }
    };

    return (
        <div 
            onDragEnter={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700'}
            bg-slate-50 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800`}
        >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                <div className="w-12 h-12 text-slate-400 dark:text-slate-500">
                    <UploadCloudIcon />
                </div>
                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">{t('uploadImage')}</span></p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('dropImageHere')}</p>
            </div>
            <input ref={inputRef} id="dropzone-file" type="file" className="hidden" onChange={onFileChange} accept="image/*" />
        </div>
    );
};


const AddCarpetScreen = ({ onImageUpload }: { onImageUpload: (file: File) => void; }) => {
    return <ImageDropzone onDrop={onImageUpload} />;
};

const SearchCarpetScreen = ({ onImageUpload, result, onNavigate }: { onImageUpload: (file: File) => void; result: Carpet | null; onNavigate: (screen: AppScreen, carpetId: string) => void; }) => {
    const { t } = useSettings();
    
    return (
         <div className="h-full flex flex-col space-y-4">
             <div className="flex-grow">
                 <ImageDropzone onDrop={onImageUpload} />
             </div>
             {result && (
                <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-2">{t('matchFound')}</h2>
                    <div onClick={() => onNavigate(AppScreen.DETAIL, result.id)} className="cursor-pointer group">
                        <img src={result.imageUrl} alt={result.name} className="w-full h-32 object-cover rounded-md" />
                        <h3 className="font-semibold mt-2 truncate group-hover:text-blue-500">{result.name}</h3>
                    </div>
                </div>
            )}
         </div>
    );
};

const SettingsScreen = () => {
  const { t, language, setLanguage, theme, setTheme } = useSettings();
  const { carpets, saveCarpets } = useCarpets();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if(carpets.length === 0) {
        alert(t('noDataToExport'));
        return;
    }
    const dataStr = JSON.stringify(carpets, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'hali-katalogu-yedek.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = e => {
      try {
        const importedCarpets = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedCarpets) && (importedCarpets.length === 0 || importedCarpets.every(c => c.id && c.name && c.imageUrl))) {
          const confirmed = confirm(t('importConfirmation'));
          if(confirmed) {
              saveCarpets(importedCarpets);
              alert(t('dataImported'));
          }
        } else {
          throw new Error("Invalid file format");
        }
      } catch (error) {
        alert(t('errorImporting'));
        console.error("Import error:", error);
      } finally {
        // Reset the input value to allow re-uploading the same file
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
  };

  const SettingCard = ({ title, children }: {title: string, children: React.ReactNode}) => (
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 ring-1 ring-slate-200 dark:ring-slate-800">
        <h3 className="font-semibold mb-3 text-slate-800 dark:text-slate-200">{title}</h3>
        {children}
      </div>
  )

  const SettingButton = ({ onClick, children, active }: {onClick: () => void, children: React.ReactNode, active: boolean}) => (
      <button 
        onClick={onClick}
        className={`flex-1 px-4 py-2 rounded-md font-semibold transition-colors ${
            active 
            ? 'bg-blue-600 text-white' 
            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
        }`}
      >
          {children}
      </button>
  )

  return (
    <div className="space-y-6">
      <SettingCard title={t('language')}>
        <div className="flex gap-2">
            <SettingButton onClick={() => setLanguage('tr')} active={language === 'tr'}>Türkçe</SettingButton>
            <SettingButton onClick={() => setLanguage('en')} active={language === 'en'}>English</SettingButton>
        </div>
      </SettingCard>

      <SettingCard title={t('theme')}>
         <div className="flex gap-2">
            <SettingButton onClick={() => setTheme('light')} active={theme === 'light'}>{t('light')}</SettingButton>
            <SettingButton onClick={() => setTheme('dark')} active={theme === 'dark'}>{t('dark')}</SettingButton>
        </div>
      </SettingCard>
      
      <SettingCard title={t('dataManagement')}>
         <div className="space-y-3">
             <button onClick={handleExport} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-600 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 font-semibold">
                <DownloadCloudIcon />
                {t('exportData')}
             </button>
             <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-600 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 font-semibold">
                <UploadCloudIcon />
                {t('importData')}
             </button>
             <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
         </div>
         <p className="text-xs text-slate-500 mt-3">{t('dataManagementDescription')}</p>
      </SettingCard>
    </div>
  );
};


export default App;