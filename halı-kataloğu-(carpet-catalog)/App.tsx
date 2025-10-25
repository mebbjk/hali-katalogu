import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { Carpet } from './types';
import { AppScreen } from './types';
import { useCarpets } from './hooks/useCarpets';
import { extractCarpetDetails, findMatchingCarpet } from './services/geminiService';
import { PlusIcon, SearchIcon, ListIcon, CameraIcon, TrashIcon, ArrowLeftIcon, SpinnerIcon, StarIcon, CogIcon, UploadCloudIcon, DownloadCloudIcon } from './components/icons';

// HELPER COMPONENTS (Defined outside main component to prevent re-rendering issues)

const ScreenContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex flex-col h-full w-full max-w-md mx-auto bg-gray-900 text-gray-100">
        {children}
    </div>
);

const Header: React.FC<{ title: string; onBack?: () => void }> = ({ title, onBack }) => (
    <header className="bg-gray-800 p-4 flex items-center shadow-md sticky top-0 z-10">
        {onBack && (
            <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-gray-700">
                <ArrowLeftIcon />
            </button>
        )}
        <h1 className="text-xl font-bold text-white">{title}</h1>
    </header>
);

const BottomNav: React.FC<{ activeScreen: AppScreen; onNavigate: (screen: AppScreen) => void }> = ({ activeScreen, onNavigate }) => {
    const navItems = [
        { screen: AppScreen.LIST, icon: <ListIcon />, label: 'Katalog' },
        { screen: AppScreen.FAVORITES, icon: <StarIcon filled={activeScreen === AppScreen.FAVORITES} />, label: 'Favoriler' },
        { screen: AppScreen.ADD, icon: <PlusIcon />, label: 'Yeni Ekle' },
        { screen: AppScreen.SEARCH, icon: <SearchIcon />, label: 'Fotoğrafla Ara' },
        { screen: AppScreen.SETTINGS, icon: <CogIcon />, label: 'Ayarlar' },
    ];

    return (
        <nav className="sticky bottom-0 left-0 right-0 bg-gray-800 shadow-lg mt-auto max-w-md mx-auto">
            <div className="flex justify-around">
                {navItems.map(({ screen, icon, label }) => (
                    <button
                        key={screen}
                        onClick={() => onNavigate(screen)}
                        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs font-medium transition-colors duration-200 ${activeScreen === screen ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        {icon}
                        <span className="mt-1">{label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

const ImagePicker: React.FC<{ onImageSelect: (file: File, dataUrl: string) => void; label: string }> = ({ onImageSelect, label }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImageSelect(file, e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800">
            <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center text-center text-blue-400 hover:text-blue-300">
                <CameraIcon />
                <span className="mt-2 font-semibold">{label}</span>
                <input id="image-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            </label>
            <p className="text-xs text-gray-500 mt-2">Veya galeriden seçin</p>
        </div>
    );
};

// FIX: Define a more specific type for the form fields to avoid type conflicts with boolean properties like 'isFavorite'.
// An input 'value' cannot be a boolean, and this type ensures only string/number properties are used in the form.
type EditableCarpetKeys = 'name' | 'brand' | 'model' | 'price' | 'size' | 'pattern' | 'texture' | 'yarnType';

const CarpetForm: React.FC<{ carpetData: Partial<Carpet>; onDataChange: (field: keyof Carpet, value: any) => void }> = ({ carpetData, onDataChange }) => {
    const fields: { key: EditableCarpetKeys; label: string; type: string }[] = [
        { key: 'name', label: 'Halı Adı', type: 'text' },
        { key: 'brand', label: 'Marka', type: 'text' },
        { key: 'model', label: 'Model', type: 'text' },
        { key: 'price', label: 'Fiyat (₺)', type: 'number' },
        { key: 'size', label: 'Boyut', type: 'text' },
        { key: 'pattern', label: 'Desen', type: 'text' },
        { key: 'texture', label: 'Doku', type: 'text' },
        { key: 'yarnType', label: 'İplik Türü', type: 'text' },
    ];

    return (
        <div className="space-y-4">
            {fields.map(({ key, label, type }) => (
                 <div key={key}>
                    <label htmlFor={key} className="block text-sm font-medium text-gray-400">{label}</label>
                    <input
                        type={type}
                        id={key}
                        value={carpetData[key] || ''}
                        onChange={(e) => onDataChange(key, type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                        className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2"
                    />
                </div>
            ))}
            <div>
                 <label htmlFor="description" className="block text-sm font-medium text-gray-400">Açıklama</label>
                 <textarea
                    id="description"
                    rows={4}
                    value={carpetData.description || ''}
                    onChange={(e) => onDataChange('description', e.target.value)}
                    className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2"
                 />
            </div>
        </div>
    );
};

// SCREENS

const CarpetListScreen: React.FC<{ carpets: Carpet[]; onSelectCarpet: (id: string) => void; }> = ({ carpets, onSelectCarpet }) => (
    <>
        <Header title="Halı Kataloğum" />
        <main className="flex-grow overflow-y-auto p-4">
            {carpets.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                    <h2 className="text-lg font-semibold">Katalog Boş</h2>
                    <p>Başlamak için alttaki 'Yeni Ekle' butonuna dokunun.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {carpets.map(carpet => (
                        <div key={carpet.id} onClick={() => onSelectCarpet(carpet.id)} className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-200">
                            {carpet.isFavorite && (
                                <div className="absolute top-1 right-1 bg-gray-900/50 rounded-full p-1">
                                    <StarIcon filled={true} />
                                </div>
                            )}
                            <img src={carpet.imageUrl} alt={carpet.name} className="w-full h-32 object-cover" />
                            <div className="p-3">
                                <h3 className="font-bold text-sm truncate text-white">{carpet.name}</h3>
                                <p className="text-xs text-gray-400 truncate">{carpet.brand || 'Marka Bilinmiyor'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    </>
);

const FavoritesScreen: React.FC<{ carpets: Carpet[]; onSelectCarpet: (id: string) => void; }> = ({ carpets, onSelectCarpet }) => {
    const favoriteCarpets = useMemo(() => carpets.filter(c => c.isFavorite), [carpets]);

    return (
        <>
            <Header title="Favorilerim" />
            <main className="flex-grow overflow-y-auto p-4">
                {favoriteCarpets.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20">
                        <h2 className="text-lg font-semibold">Favori Listeniz Boş</h2>
                        <p>Bir halıyı favorilere eklemek için detay sayfasındaki yıldız ikonuna dokunun.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {favoriteCarpets.map(carpet => (
                             <div key={carpet.id} onClick={() => onSelectCarpet(carpet.id)} className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-200">
                                <div className="absolute top-1 right-1 bg-gray-900/50 rounded-full p-1">
                                    <StarIcon filled={true} />
                                </div>
                                <img src={carpet.imageUrl} alt={carpet.name} className="w-full h-32 object-cover" />
                                <div className="p-3">
                                    <h3 className="font-bold text-sm truncate text-white">{carpet.name}</h3>
                                    <p className="text-xs text-gray-400 truncate">{carpet.brand || 'Marka Bilinmiyor'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
};

const AddCarpetScreen: React.FC<{ onAddCarpet: (carpet: Carpet) => void; onBack: () => void; }> = ({ onAddCarpet, onBack }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<Partial<Carpet>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageSelect = (file: File, dataUrl: string) => {
        setImageFile(file);
        setImageDataUrl(dataUrl);
        setExtractedData({});
        setError(null);
    };

    const handleExtract = async () => {
        if (!imageFile) return;
        setIsLoading(true);
        setError(null);
        try {
            const details = await extractCarpetDetails(imageFile);
            setExtractedData(details);
        } catch (e: any) {
            setError(e.message || "Özellikler çıkarılamadı.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDataChange = (field: keyof Carpet, value: any) => {
        setExtractedData(prev => ({...prev, [field]: value}));
    };

    const handleSave = () => {
        if (!imageDataUrl || !extractedData.name || !extractedData.description) {
            alert("Lütfen en azından bir isim ve açıklama girin.");
            return;
        }
        const newCarpet: Carpet = {
            id: new Date().toISOString(),
            imageUrl: imageDataUrl,
            name: extractedData.name,
            description: extractedData.description,
            isFavorite: false,
            ...extractedData
        };
        onAddCarpet(newCarpet);
    };

    return (
        <>
            <Header title="Yeni Halı Ekle" onBack={onBack} />
            <main className="flex-grow overflow-y-auto p-4 space-y-4">
                {!imageDataUrl && <ImagePicker onImageSelect={handleImageSelect} label="Özellik Çıkarmak İçin Fotoğraf Çek" />}
                
                {imageDataUrl && (
                    <>
                        <img src={imageDataUrl} alt="Seçilen Halı" className="rounded-lg w-full object-contain max-h-64" />
                        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm">{error}</div>}
                        
                        {Object.keys(extractedData).length === 0 ? (
                            <button onClick={handleExtract} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-500">
                                {isLoading ? <SpinnerIcon /> : "AI ile Özellikleri Çıkar"}
                            </button>
                        ) : (
                            <>
                                <CarpetForm carpetData={extractedData} onDataChange={handleDataChange} />
                                <button onClick={handleSave} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700">
                                    Kataloğa Kaydet
                                </button>
                            </>
                        )}
                    </>
                )}
            </main>
        </>
    );
};

const SearchCarpetScreen: React.FC<{ carpets: Carpet[]; onSelectCarpet: (id: string) => void; onBack: () => void; }> = ({ carpets, onSelectCarpet, onBack }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [matchedCarpet, setMatchedCarpet] = useState<Carpet | null | undefined>(undefined); // undefined: initial, null: no match
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageSelect = (file: File, dataUrl: string) => {
        setImageFile(file);
        setImageDataUrl(dataUrl);
        setMatchedCarpet(undefined);
        setError(null);
    };
    
    const handleSearch = async () => {
        if (!imageFile) return;
        setIsLoading(true);
        setError(null);
        setMatchedCarpet(undefined);
        try {
            const match = await findMatchingCarpet(imageFile, carpets);
            setMatchedCarpet(match);
        } catch(e: any) {
            setError(e.message || "Arama sırasında bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Header title="Fotoğrafla Halı Ara" onBack={onBack} />
             <main className="flex-grow overflow-y-auto p-4 space-y-4">
                 {!imageDataUrl && <ImagePicker onImageSelect={handleImageSelect} label="Aramak İçin Fotoğraf Çek" />}
                 
                 {imageDataUrl && (
                    <>
                        <img src={imageDataUrl} alt="Aranacak Halı" className="rounded-lg w-full object-contain max-h-64" />
                        <button onClick={handleSearch} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-500">
                            {isLoading ? <SpinnerIcon /> : "Katalogda Benzerini Bul"}
                        </button>

                        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm">{error}</div>}

                        {matchedCarpet === undefined && !isLoading && <div className="text-center text-gray-400 p-4">Aramak için butona basın.</div>}

                        {matchedCarpet === null && !isLoading && (
                             <div className="text-center bg-gray-800 p-6 rounded-lg">
                                <h3 className="text-lg font-semibold text-white">Sonuç Bulunamadı</h3>
                                <p className="text-gray-400">Kataloğunuzda bu halıya benzer bir kayıt bulunamadı.</p>
                            </div>
                        )}
                        {matchedCarpet && !isLoading && (
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2 text-green-400">Eşleşme Bulundu!</h3>
                                 <div onClick={() => onSelectCarpet(matchedCarpet.id)} className="bg-gray-700 rounded-lg overflow-hidden shadow-lg cursor-pointer">
                                    <img src={matchedCarpet.imageUrl} alt={matchedCarpet.name} className="w-full h-40 object-cover" />
                                    <div className="p-3">
                                        <h3 className="font-bold text-md truncate text-white">{matchedCarpet.name}</h3>
                                        <p className="text-sm text-gray-400 truncate">{matchedCarpet.brand || 'Marka Bilinmiyor'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                 )}
            </main>
        </>
    );
};

const CarpetDetailScreen: React.FC<{ carpet: Carpet; onDelete: (id: string) => void; onBack: () => void; onToggleFavorite: (id: string) => void; }> = ({ carpet, onDelete, onBack, onToggleFavorite }) => {
    const handleDelete = () => {
        if (window.confirm("Bu halıyı katalogdan silmek istediğinize emin misiniz?")) {
            onDelete(carpet.id);
        }
    };
    return (
        <>
            <Header title={carpet.name} onBack={onBack} />
            <main className="flex-grow overflow-y-auto">
                <img src={carpet.imageUrl} alt={carpet.name} className="w-full h-64 object-cover" />
                <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 mr-4">
                             <h2 className="text-2xl font-bold text-white">{carpet.name}</h2>
                             <p className="text-lg text-blue-400 font-semibold">{carpet.price ? `${carpet.price} ₺` : 'Fiyat Belirtilmemiş'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                             <button onClick={() => onToggleFavorite(carpet.id)} className="p-2 rounded-full text-white hover:bg-gray-700">
                                <StarIcon filled={!!carpet.isFavorite} />
                            </button>
                            <button onClick={handleDelete} className="bg-red-600/80 p-2 rounded-full text-white hover:bg-red-500">
                                <TrashIcon />
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                        <p><strong className="text-gray-400 w-24 inline-block">Marka:</strong> {carpet.brand || 'N/A'}</p>
                        <p><strong className="text-gray-400 w-24 inline-block">Model:</strong> {carpet.model || 'N/A'}</p>
                        <p><strong className="text-gray-400 w-24 inline-block">Boyut:</strong> {carpet.size || 'N/A'}</p>
                        <p><strong className="text-gray-400 w-24 inline-block">Desen:</strong> {carpet.pattern || 'N/A'}</p>
                        <p><strong className="text-gray-400 w-24 inline-block">Doku:</strong> {carpet.texture || 'N/A'}</p>
                        <p><strong className="text-gray-400 w-24 inline-block">İplik:</strong> {carpet.yarnType || 'N/A'}</p>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-1">Açıklama</h3>
                        <p className="text-gray-400 leading-relaxed">{carpet.description}</p>
                    </div>
                </div>
            </main>
        </>
    );
};

const SettingsScreen: React.FC<{ carpets: Carpet[]; onRestore: (carpets: Carpet[]) => void; onNavigate: (screen: AppScreen) => void }> = ({ carpets, onRestore, onNavigate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackup = () => {
        if (carpets.length === 0) {
            alert("Yedeklenecek hiç halı yok.");
            return;
        }
        const dataStr = JSON.stringify(carpets, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.download = `hali-katalogu-yedek-${date}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const restoredCarpets = JSON.parse(text);
                
                // Basic validation
                if (!Array.isArray(restoredCarpets) || (restoredCarpets.length > 0 && !restoredCarpets[0].id)) {
                    throw new Error("Geçersiz yedek dosyası formatı.");
                }

                if (window.confirm("Yedekten geri yüklemek istediğinize emin misiniz? Mevcut tüm halılarınız bu yedekle değiştirilecektir.")) {
                    onRestore(restoredCarpets);
                    alert("Veriler başarıyla geri yüklendi!");
                    onNavigate(AppScreen.LIST);
                }
            } catch (error) {
                alert("Yedek dosyası okunurken bir hata oluştu. Lütfen geçerli bir dosya seçtiğinizden emin olun.");
                console.error("Restore error:", error);
            }
        };
        reader.readAsText(file);
        
        // Reset the input value to allow selecting the same file again
        event.target.value = '';
    };

    return (
        <>
            <Header title="Ayarlar" />
            <main className="flex-grow p-4 space-y-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-white mb-2">Veri Yönetimi</h2>
                    <p className="text-sm text-gray-400 mb-4">
                        Kataloğunuzu bir JSON dosyası olarak indirin. Bu dosyayı telefonunuzun 'Dosyalar' klasörüne veya Google Drive/OneDrive gibi bir bulut hizmetine kaydedebilirsiniz.
                    </p>
                    <div className="space-y-3">
                        <button onClick={handleBackup} className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            <DownloadCloudIcon />
                            <span>Yedek Dosyası İndir</span>
                        </button>
                        <button onClick={handleRestoreClick} className="w-full flex items-center justify-center bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            <UploadCloudIcon />
                            <span>Yedekten Geri Yükle</span>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".json"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>
            </main>
        </>
    );
};


// MAIN APP COMPONENT
export default function App() {
    const [screen, setScreen] = useState<AppScreen>(AppScreen.LIST);
    const [previousScreen, setPreviousScreen] = useState<AppScreen>(AppScreen.LIST);
    const { carpets, addCarpet, deleteCarpet, toggleFavorite, saveCarpets } = useCarpets();
    const [selectedCarpetId, setSelectedCarpetId] = useState<string | null>(null);

    const handleNavigate = (targetScreen: AppScreen) => {
        if (targetScreen !== AppScreen.DETAIL) {
            setSelectedCarpetId(null);
        }
        setScreen(targetScreen);
    };

    const handleSelectCarpet = (id: string) => {
        setPreviousScreen(screen); // Remember where we came from
        setSelectedCarpetId(id);
        setScreen(AppScreen.DETAIL);
    };

    const handleAddCarpet = (carpet: Carpet) => {
        addCarpet(carpet);
        handleNavigate(AppScreen.LIST);
    };
    
    const handleDeleteCarpet = (id: string) => {
        deleteCarpet(id);
        handleNavigate(AppScreen.LIST);
    };

    const selectedCarpet = useMemo(() => {
        if (!selectedCarpetId) return null;
        return carpets.find(c => c.id === selectedCarpetId);
    }, [selectedCarpetId, carpets]);

    const renderScreen = () => {
        switch (screen) {
            case AppScreen.ADD:
                return <AddCarpetScreen onAddCarpet={handleAddCarpet} onBack={() => handleNavigate(AppScreen.LIST)} />;
            case AppScreen.SEARCH:
                return <SearchCarpetScreen carpets={carpets} onSelectCarpet={handleSelectCarpet} onBack={() => handleNavigate(AppScreen.LIST)} />;
            case AppScreen.FAVORITES:
                 return <FavoritesScreen carpets={carpets} onSelectCarpet={handleSelectCarpet} />;
            case AppScreen.SETTINGS:
                return <SettingsScreen carpets={carpets} onRestore={saveCarpets} onNavigate={handleNavigate} />;
            case AppScreen.DETAIL:
                if (selectedCarpet) {
                    return <CarpetDetailScreen carpet={selectedCarpet} onDelete={handleDeleteCarpet} onToggleFavorite={toggleFavorite} onBack={() => handleNavigate(previousScreen)} />;
                }
                return <CarpetListScreen carpets={carpets} onSelectCarpet={handleSelectCarpet} />; // Fallback
            case AppScreen.LIST:
            default:
                return <CarpetListScreen carpets={carpets} onSelectCarpet={handleSelectCarpet} />;
        }
    };
    
    const activeNavScreen = screen === AppScreen.DETAIL ? previousScreen : screen;

    return (
        <div className="h-screen w-screen overflow-hidden antialiased">
            <ScreenContainer>
                {renderScreen()}
                <BottomNav activeScreen={activeNavScreen} onNavigate={handleNavigate} />
            </ScreenContainer>
        </div>
    );
}