import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useCarpets } from './hooks/useCarpets';
import { useSettings } from './hooks/useSettings';
import type { Carpet } from './types';
import {
  HomeIcon, PlusIcon, SearchIcon, HeartIcon, Cog6ToothIcon, CameraIcon, WandSparkles, Spinner, XMarkIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, BarcodeIcon, QrCodeIcon
} from './components/icons';

const e = React.createElement;

// Barcode Detection API type definitions
declare global {
    interface Window {
        BarcodeDetector: any;
    }
}

const BarcodeScannerModal = ({ onScanSuccess, onClose, scanType }: { onScanSuccess: (value: string) => void, onClose: () => void, scanType: 'barcode' | 'qr_code' }) => {
    const { t } = useSettings();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let stream: MediaStream | null = null;
        let animationFrameId: number;

        const startScan = async () => {
            if (!('BarcodeDetector' in window)) {
                setError('Barcode detection is not supported in this browser.');
                return;
            }

            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                const barcodeDetector = new window.BarcodeDetector({
                    formats: scanType === 'qr_code' ? ['qr_code'] : ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
                });

                const detect = async () => {
                    if (videoRef.current && videoRef.current.readyState === 4) {
                        const barcodes = await barcodeDetector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            onScanSuccess(barcodes[0].rawValue);
                        } else {
                            animationFrameId = requestAnimationFrame(detect);
                        }
                    } else {
                        animationFrameId = requestAnimationFrame(detect);
                    }
                };
                detect();

            } catch (err) {
                setError('Could not access camera. Please grant permission.');
                console.error(err);
            }
        };

        startScan();

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onScanSuccess, scanType]);
    
    return e('div', { className: 'fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center', onClick: onClose },
        e('div', { className: 'relative w-full max-w-md bg-slate-900 rounded-lg p-4', onClick: e => e.stopPropagation() },
            // Fix: Use the 'e' alias to resolve a TypeScript overload error and maintain consistency.
            e('video', { ref: videoRef, className: 'w-full rounded-md', autoPlay: true, playsInline: true, muted: true }),
            error && e('p', { className: 'text-red-500 text-center mt-2' }, error),
            e('p', { className: 'text-white text-center mt-4' }, scanType === 'barcode' ? t('scan_barcode_instruction') : t('scan_qrcode_instruction')),
            e('button', { onClick: onClose, className: 'absolute top-2 right-2 p-2 bg-black/50 rounded-full' }, e(XMarkIcon, { className: 'h-6 w-6 text-white' }))
        )
    );
};


const Header = ({ title, searchQuery, setSearchQuery, currentView }: { title: string, searchQuery: string, setSearchQuery: (q: string) => void, currentView: string }) => {
  const { t } = useSettings();
  const showSearch = currentView === 'home' || currentView === 'favorites';
  
  const viewTitles: Record<string, string> = {
    'home': t('app_title'),
    'favorites': t('favorites'),
    'add': t('add_new_carpet'),
    'match': t('find_matching_carpet'),
    'settings': t('settings'),
  };

  return e('header', { className: 'sticky top-0 z-10 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 border-b border-slate-200 dark:border-slate-700' },
    e('h1', { className: 'text-2xl font-bold text-center mb-4' }, viewTitles[currentView] || title),
    showSearch && e('div', { className: 'relative' },
      e('input', {
        type: 'text',
        value: searchQuery,
        onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(ev.target.value),
        placeholder: t('search_placeholder'),
        className: 'w-full p-2 pl-10 rounded-md bg-slate-200 dark:bg-slate-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500',
      }),
      e(SearchIcon, { className: 'absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400' })
    )
  );
};

const BottomNav = ({ currentView, setCurrentView }: { currentView: string, setCurrentView: (v: string) => void }) => {
  const { t } = useSettings();
  const navItems = [
    { id: 'home', icon: HomeIcon, label: t('home') },
    { id: 'favorites', icon: HeartIcon, label: t('favorites') },
    { id: 'add', icon: PlusIcon, label: t('add_carpet') },
    { id: 'match', icon: SearchIcon, label: t('find_match') },
    { id: 'settings', icon: Cog6ToothIcon, label: t('settings') },
  ];

  return e('nav', { className: 'fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700' },
    e('div', { className: 'flex justify-around items-center h-16' },
      ...navItems.map(item => {
        if (item.id === 'add') {
          return e('div', { key: 'add-wrapper', className: 'relative -mt-8' },
            e('button', {
              key: item.id,
              onClick: () => setCurrentView(item.id),
              'aria-label': item.label,
              className: `w-16 h-16 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-transform hover:scale-110`,
            },
              e(item.icon, { className: 'h-8 w-8' })
            )
          );
        }
        return e('button', {
          key: item.id,
          onClick: () => setCurrentView(item.id),
          className: `flex flex-col items-center justify-center w-full py-2 px-1 text-xs ${currentView === item.id ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`,
        },
          e(item.icon, { className: 'h-6 w-6 mb-1' }),
          item.label
        );
      })
    )
  );
};

const CarpetCard = ({ carpet, onCarpetClick }: { carpet: Carpet, onCarpetClick: (c: Carpet) => void }) => {
    return e('div', { 
        className: 'bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105 relative',
        onClick: () => onCarpetClick(carpet),
    },
        e('img', { src: carpet.imageUrl, alt: carpet.name, className: 'w-full h-40 object-cover' }),
        e('div', { className: 'p-3' },
            e('h3', { className: 'font-bold text-md truncate' }, carpet.name),
            e('p', { className: 'text-sm text-slate-500 dark:text-slate-400 truncate' }, carpet.brand)
        ),
        carpet.isFavorite && e(HeartIcon, { className: 'absolute top-2 right-2 h-6 w-6 text-red-500', fill: 'currentColor' })
    );
};

const CarpetGrid = ({ carpets, onCarpetClick, isFavorites = false }: { carpets: Carpet[], onCarpetClick: (c: Carpet) => void, isFavorites?: boolean }) => {
    const { t } = useSettings();

    if (carpets.length === 0) {
        return e('div', { className: 'text-center py-10' },
            e('p', { className: 'text-slate-500' }, isFavorites ? t('no_favorites_found') : t('no_carpets_found'))
        );
    }
    
    return e('div', { className: 'grid grid-cols-2 md:grid-cols-3 gap-4' },
        ...carpets.map(carpet => e(CarpetCard, { key: carpet.id, carpet, onCarpetClick }))
    );
};

const ImageUploader = ({ onImageSelect, currentImageUrl }: { onImageSelect: (file: File) => void, currentImageUrl?: string | null }) => {
    const { t } = useSettings();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const newUrl = URL.createObjectURL(file);
            setPreviewUrl(newUrl);
            onImageSelect(file);
        }
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const newUrl = URL.createObjectURL(file);
            setPreviewUrl(newUrl);
            onImageSelect(file);
        }
    };

    return e('div', { className: 'mt-4' },
        e('label', { className: 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2' }, t('carpet_image')),
        e('div', { 
            className: 'w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md flex items-center justify-center text-center cursor-pointer',
            onClick: () => fileInputRef.current?.click(),
            onDrop: handleDrop,
            onDragOver: (e: React.DragEvent) => e.preventDefault(),
        },
            previewUrl 
                ? e('img', { src: previewUrl, className: 'h-full w-full object-contain' })
                : e('div', { className: 'text-slate-500' }, 
                    e(CameraIcon, { className: 'h-12 w-12 mx-auto mb-2' }),
                    t('drop_image_here')
                ),
            e('input', { type: 'file', ref: fileInputRef, onChange: handleFileChange, accept: "image/*", className: 'hidden' })
        )
    );
};

const AddCarpetView = ({ addCarpet, getDetailsFromImage, onFinished }: { addCarpet: (data: Partial<Carpet>, file: File) => Promise<Carpet>, getDetailsFromImage: (file: File) => Promise<Partial<Carpet>>, onFinished: () => void }) => {
    const { t } = useSettings();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [details, setDetails] = useState<Partial<Carpet>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanTarget, setScanTarget] = useState<'barcode' | 'qr_code' | null>(null);


    const handleImageSelect = (file: File) => {
        setImageFile(file);
    };
    
    const handleAnalyze = async () => {
        if (!imageFile) return;
        setIsAnalyzing(true);
        setError('');
        try {
            const extractedDetails = await getDetailsFromImage(imageFile);
            setDetails(prev => ({...prev, ...extractedDetails}));
        } catch (e: any) {
            setError(e.message || t('ai_analysis_error'));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) {
            setError(t('required_field'));
            return;
        }
        await addCarpet(details, imageFile);
        onFinished();
    };
    
    const handleInputChange = (field: keyof Carpet, value: string | number) => {
        setDetails(prev => ({...prev, [field]: value}));
    };
    
    const handleScanSuccess = (value: string) => {
        if (scanTarget) {
            const field = scanTarget === 'barcode' ? 'barcodeId' : 'qrCodeId';
            handleInputChange(field, value);
        }
        setIsScannerOpen(false);
        setScanTarget(null);
    };

    const formFields = [
        { id: 'name', label: t('name'), type: 'text' },
        { id: 'brand', label: t('brand'), type: 'text' },
        { id: 'model', label: t('model'), type: 'text' },
        { id: 'price', label: t('price'), type: 'number' },
        { id: 'size', label: t('size'), type: 'text' },
        { id: 'pattern', label: t('pattern'), type: 'text' },
        { id: 'texture', label: t('texture'), type: 'text' },
        { id: 'yarnType', label: t('yarn_type'), type: 'text' },
        { id: 'type', label: t('type'), type: 'text' },
    ];
    
    return e(React.Fragment, null, 
        e('form', { onSubmit: handleSubmit, className: 'space-y-4' },
            e(ImageUploader, { onImageSelect: handleImageSelect }),
            imageFile && e('button', {
                type: 'button',
                onClick: handleAnalyze,
                disabled: isAnalyzing,
                className: 'w-full flex items-center justify-center gap-2 p-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-300'
            }, 
                isAnalyzing ? e(Spinner, { className: 'h-5 w-5 animate-spin'}) : e(WandSparkles, { className: 'h-5 w-5' }),
                isAnalyzing ? t('analyzing_image') : t('scan_with_ai')
            ),
            error && e('p', { className: 'text-red-500 text-sm' }, error),
            
            ...formFields.map(field => e('div', { key: field.id },
                e('label', { htmlFor: field.id, className: 'block text-sm font-medium' }, field.label),
                e('input', {
                    id: field.id,
                    type: field.type,
                    value: details[field.id as keyof Carpet] as string || '',
                    onChange: (ev: React.ChangeEvent<HTMLInputElement>) => handleInputChange(field.id as keyof Carpet, field.type === 'number' ? parseInt(ev.target.value) || 0 : ev.target.value),
                    className: 'mt-1 w-full p-2 rounded-md bg-slate-200 dark:bg-slate-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
            )),

            e('div', { key: 'barcodeId' },
                e('label', { htmlFor: 'barcodeId', className: 'block text-sm font-medium' }, t('barcode_id')),
                e('div', { className: 'flex gap-2 mt-1' },
                    e('input', {
                        id: 'barcodeId',
                        type: 'text',
                        value: details.barcodeId || '',
                        onChange: (ev: React.ChangeEvent<HTMLInputElement>) => handleInputChange('barcodeId', ev.target.value),
                        className: 'flex-grow w-full p-2 rounded-md bg-slate-200 dark:bg-slate-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }),
                    e('button', { type: 'button', onClick: () => { setScanTarget('barcode'); setIsScannerOpen(true); }, className: 'p-2 rounded-md bg-slate-200 dark:bg-slate-600' }, e(BarcodeIcon, { className: 'h-6 w-6' }))
                )
            ),

            e('div', { key: 'qrCodeId' },
                e('label', { htmlFor: 'qrCodeId', className: 'block text-sm font-medium' }, t('qr_code_id')),
                e('div', { className: 'flex gap-2 mt-1' },
                    e('input', {
                        id: 'qrCodeId',
                        type: 'text',
                        value: details.qrCodeId || '',
                        onChange: (ev: React.ChangeEvent<HTMLInputElement>) => handleInputChange('qrCodeId', ev.target.value),
                        className: 'flex-grow w-full p-2 rounded-md bg-slate-200 dark:bg-slate-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }),
                    e('button', { type: 'button', onClick: () => { setScanTarget('qr_code'); setIsScannerOpen(true); }, className: 'p-2 rounded-md bg-slate-200 dark:bg-slate-600' }, e(QrCodeIcon, { className: 'h-6 w-6' }))
                )
            ),
            
            e('div', {},
                e('label', { htmlFor: 'description', className: 'block text-sm font-medium' }, t('description')),
                e('textarea', {
                    id: 'description',
                    value: details.description || '',
                    rows: 4,
                    onChange: (ev: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', ev.target.value),
                    className: 'mt-1 w-full p-2 rounded-md bg-slate-200 dark:bg-slate-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
            ),

            e('button', {
                type: 'submit',
                className: 'w-full p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
                disabled: !imageFile,
            }, t('add_carpet'))
        ),
        isScannerOpen && scanTarget && e(BarcodeScannerModal, { 
            onScanSuccess: handleScanSuccess, 
            onClose: () => setIsScannerOpen(false), 
            scanType: scanTarget 
        })
    );
};

const MatchFinderView = ({ findMatchByImage, onMatchFound }: { findMatchByImage: (file: File) => Promise<Carpet | null>, onMatchFound: (carpet: Carpet | null) => void }) => {
    const { t } = useSettings();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [match, setMatch] = useState<Carpet | 'not_found' | null>(null);

    useEffect(() => {
        // Clear previous result when a new image is selected
        setMatch(null);
    }, [imageFile]);
    
    const handleImageSelect = (file: File) => {
        setImageFile(file);
    };

    const handleSearch = async () => {
        if (!imageFile) return;
        setIsSearching(true);
        setError('');
        setMatch(null);
        try {
            const foundMatch = await findMatchByImage(imageFile);
            setMatch(foundMatch || 'not_found');
        } catch (e: any) {
            setError(e.message || t('ai_match_error'));
        } finally {
            setIsSearching(false);
        }
    };
    
    return e('div', { className: 'space-y-4' },
        e('p', { className: 'text-center text-slate-600 dark:text-slate-400' }, t('upload_image_to_find')),
        e(ImageUploader, { onImageSelect: handleImageSelect }),
        imageFile && e('button', {
            type: 'button',
            onClick: handleSearch,
            disabled: isSearching,
            className: 'w-full flex items-center justify-center gap-2 p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
        }, 
            isSearching ? e(Spinner, { className: 'h-5 w-5 animate-spin'}) : e(SearchIcon, { className: 'h-5 w-5' }),
            isSearching ? t('searching_for_match') : t('find_match')
        ),
        error && e('p', { className: 'text-red-500 text-sm' }, error),
        
        match && e('div', { className: 'mt-6' },
            match === 'not_found' 
            ? e('p', { className: 'text-center' }, t('no_match_found'))
            : e(React.Fragment, null,
                e('h3', { className: 'text-lg font-semibold mb-2 text-center' }, t('match_found')),
                e(CarpetCard, { carpet: match, onCarpetClick: () => onMatchFound(match) })
            )
        )
    );
};


const SettingsView = ({ replaceAllCarpets }: { replaceAllCarpets: (carpets: Carpet[]) => void }) => {
    const { language, setLanguage, theme, setTheme, t } = useSettings();
    const { carpets } = useCarpets();
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        try {
            const dataStr = JSON.stringify(carpets, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = 'carpet_catalog_export.json';
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        } catch (e) {
            alert(t('export_error'));
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        if (!event.target.files) return;
        fileReader.readAsText(event.target.files[0], "UTF-8");
        fileReader.onload = e => {
            try {
                const importedCarpets = JSON.parse(e.target?.result as string);
                if (Array.isArray(importedCarpets)) {
                    // Simple validation
                    if(importedCarpets.every(item => item.id && item.name)) {
                        replaceAllCarpets(importedCarpets);
                        alert(t('import_success'));
                    } else {
                        throw new Error("Invalid format");
                    }
                } else {
                    throw new Error("Not an array");
                }
            } catch (err) {
                alert(t('import_error'));
            }
        };
    };
    
    return e('div', { className: 'space-y-6' },
        e('div', {},
            e('h3', { className: 'text-lg font-semibold mb-2' }, t('language')),
            e('select', { 
                value: language,
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value as 'en' | 'tr'),
                className: 'w-full p-2 rounded-md bg-slate-200 dark:bg-slate-700 border border-transparent'
            },
                e('option', { value: 'en' }, 'English'),
                e('option', { value: 'tr' }, 'Türkçe')
            )
        ),
        e('div', {},
            e('h3', { className: 'text-lg font-semibold mb-2' }, t('theme')),
            e('div', { className: 'flex gap-4' },
                e('button', { 
                    onClick: () => setTheme('light'),
                    className: `w-full p-2 rounded-md ${theme === 'light' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`
                }, t('light')),
                e('button', { 
                    onClick: () => setTheme('dark'),
                    className: `w-full p-2 rounded-md ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`
                }, t('dark'))
            )
        ),
        e('div', {},
            e('h3', { className: 'text-lg font-semibold mb-2' }, t('data_management')),
            e('div', { className: 'flex gap-4' },
                e('button', { 
                    onClick: handleExport,
                    className: 'w-full p-2 flex items-center justify-center gap-2 rounded-md bg-slate-200 dark:bg-slate-700'
                }, e(ArrowDownTrayIcon, { className: 'h-5 w-5' }), t('export_data')),
                e('button', { 
                    onClick: () => importInputRef.current?.click(),
                    className: 'w-full p-2 flex items-center justify-center gap-2 rounded-md bg-slate-200 dark:bg-slate-700'
                }, e(ArrowUpTrayIcon, { className: 'h-5 w-5' }), t('import_data')),
                e('input', { type: 'file', ref: importInputRef, onChange: handleImport, accept: ".json", className: 'hidden' })
            )
        )
    );
};

const CarpetDetailModal = ({ carpet, onClose, onUpdate, onDelete, onToggleFavorite }: { carpet: Carpet, onClose: () => void, onUpdate: (c: Carpet) => void, onDelete: (id: string) => void, onToggleFavorite: (id: string) => void }) => {
    const { t } = useSettings();
    const [isEditing, setIsEditing] = useState(false);
    const [editedCarpet, setEditedCarpet] = useState(carpet);

    const handleSave = () => {
        onUpdate(editedCarpet);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm(t('delete_carpet_confirm'))) {
            onDelete(carpet.id);
            onClose();
        }
    };
    
    const DetailItem = ({ label, value }: { label: string, value: string | number | undefined }) => value ? e('div', {},
        e('p', { className: 'text-sm font-medium text-slate-500 dark:text-slate-400' }, label),
        e('p', {}, String(value))
    ) : null;

    const EditItem = ({ label, field, type = 'text' }: { label: string, field: keyof Carpet, type?: string }) => e('div', {},
        e('label', { className: 'block text-sm font-medium' }, label),
        type === 'textarea'
            ? e('textarea', {
                value: String(editedCarpet[field] || ''),
                rows: 4,
                onChange: (ev: React.ChangeEvent<HTMLTextAreaElement>) => setEditedCarpet(c => ({...c, [field]: ev.target.value })),
                className: 'mt-1 w-full p-2 rounded-md bg-slate-200 dark:bg-slate-700'
            })
            : e('input', {
                type,
                value: String(editedCarpet[field] || ''),
                onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setEditedCarpet(c => ({...c, [field]: type === 'number' ? parseInt(ev.target.value) || 0 : ev.target.value })),
                className: 'mt-1 w-full p-2 rounded-md bg-slate-200 dark:bg-slate-700'
            })
    );

    return e('div', { className: 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4', onClick: onClose },
        e('div', { className: 'bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col', onClick: (e: React.MouseEvent) => e.stopPropagation() },
            e('div', { className: 'p-4 border-b dark:border-slate-700 flex justify-between items-center' },
                e('h2', { className: 'text-xl font-bold truncate' }, isEditing ? t('edit_carpet_details') : carpet.name),
                e('button', { onClick: onClose, className: 'flex-shrink-0 ml-4' }, e(XMarkIcon, { className: 'h-6 w-6' }))
            ),
            e('div', { className: 'p-4 overflow-y-auto space-y-4' },
                e('img', { src: carpet.imageUrl, alt: carpet.name, className: 'w-full h-64 object-contain rounded-md bg-slate-100 dark:bg-slate-700' }),
                isEditing
                    ? e(React.Fragment, null,
                        e(EditItem, { label: t('name'), field: 'name' }),
                        e(EditItem, { label: t('brand'), field: 'brand' }),
                        e(EditItem, { label: t('model'), field: 'model' }),
                        e(EditItem, { label: t('price'), field: 'price', type: 'number' }),
                        e(EditItem, { label: t('size'), field: 'size' }),
                        e(EditItem, { label: t('pattern'), field: 'pattern' }),
                        e(EditItem, { label: t('texture'), field: 'texture' }),
                        e(EditItem, { label: t('yarn_type'), field: 'yarnType' }),
                        e(EditItem, { label: t('type'), field: 'type' }),
                        e(EditItem, { label: t('barcode_id'), field: 'barcodeId' }),
                        e(EditItem, { label: t('qr_code_id'), field: 'qrCodeId' }),
                        e(EditItem, { label: t('description'), field: 'description', type: 'textarea' }),
                    )
                    : e(React.Fragment, null,
                        e('p', {}, carpet.description),
                        e('div', { className: 'grid grid-cols-2 gap-4 pt-4' },
                            e(DetailItem, { label: t('brand'), value: carpet.brand }),
                            e(DetailItem, { label: t('model'), value: carpet.model }),
                            e(DetailItem, { label: t('price'), value: `$${carpet.price}` }),
                            e(DetailItem, { label: t('size'), value: carpet.size }),
                            e(DetailItem, { label: t('pattern'), value: carpet.pattern }),
                            e(DetailItem, { label: t('texture'), value: carpet.texture }),
                            e(DetailItem, { label: t('yarn_type'), value: carpet.yarnType }),
                            e(DetailItem, { label: t('type'), value: carpet.type }),
                            e(DetailItem, { label: t('barcode_id'), value: carpet.barcodeId }),
                            e(DetailItem, { label: t('qr_code_id'), value: carpet.qrCodeId }),
                            e(DetailItem, { label: t('created_at'), value: new Date(carpet.createdAt).toLocaleDateString() }),
                        )
                    )
            ),
            e('div', { className: 'p-4 border-t dark:border-slate-700 flex items-center gap-2' },
                e('button', {
                    onClick: () => onToggleFavorite(carpet.id),
                    className: `p-2 rounded-full ${carpet.isFavorite ? 'text-red-500 bg-red-100 dark:bg-red-900/50' : 'text-slate-500 bg-slate-100 dark:bg-slate-700'}`
                }, e(HeartIcon, { className: 'h-6 w-6', fill: carpet.isFavorite ? 'currentColor' : 'none' })),
                e('button', { onClick: handleDelete, className: 'p-2 rounded-full text-slate-500 bg-slate-100 dark:bg-slate-700' }, e(TrashIcon, { className: 'h-6 w-6' })),
                e('div', { className: 'flex-grow' }),
                isEditing
                    ? e(React.Fragment, null,
                        e('button', { onClick: () => setIsEditing(false), className: 'px-4 py-2 rounded-md' }, t('cancel')),
                        e('button', { onClick: handleSave, className: 'px-4 py-2 rounded-md bg-blue-600 text-white' }, t('save_changes')),
                    )
                    : e('button', { onClick: () => setIsEditing(true), className: 'px-4 py-2 rounded-md bg-blue-600 text-white' }, t('edit'))
            )
        )
    );
};

const LoadingSpinner = () => e('div', { className: 'flex justify-center items-center h-full fixed inset-0' },
    e(Spinner, { className: 'h-12 w-12 animate-spin text-blue-500' })
);

const App = () => {
  const { t } = useSettings();
  const {
    carpets, loading, error, addCarpet, updateCarpet, deleteCarpet, toggleFavorite, replaceAllCarpets, getDetailsFromImage, findMatchByImage,
  } = useCarpets();

  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCarpet, setSelectedCarpet] = useState<Carpet | null>(null);

  const filteredCarpets = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return carpets;
    return carpets.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.brand.toLowerCase().includes(query) ||
      c.pattern.toLowerCase().includes(query) ||
      c.barcodeId?.toLowerCase().includes(query) ||
      c.qrCodeId?.toLowerCase().includes(query)
    );
  }, [carpets, searchQuery]);

  const favoriteCarpets = useMemo(() => carpets.filter(c => c.isFavorite), [carpets]);

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return e(CarpetGrid, { carpets: filteredCarpets, onCarpetClick: setSelectedCarpet });
      case 'favorites':
        return e(CarpetGrid, { carpets: favoriteCarpets, onCarpetClick: setSelectedCarpet, isFavorites: true });
      case 'add':
        return e(AddCarpetView, { addCarpet, getDetailsFromImage, onFinished: () => setCurrentView('home') });
      case 'match':
        return e(MatchFinderView, { findMatchByImage, onMatchFound: (carpet) => { if(carpet) setSelectedCarpet(carpet); setCurrentView('home'); } });
      case 'settings':
        return e(SettingsView, { replaceAllCarpets });
      default:
        return e(CarpetGrid, { carpets: filteredCarpets, onCarpetClick: setSelectedCarpet });
    }
  };

  return e('div', { className: 'font-sans bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 min-h-screen' },
    e('div', { className: 'container mx-auto max-w-2xl flex flex-col min-h-screen' },
      e(Header, { title: t('app_title'), searchQuery, setSearchQuery, currentView }),
      e('main', { className: 'flex-grow p-4 pb-24' },
        error ? e('p', { className: 'text-red-500 text-center' }, error) : null,
        !loading && !error ? renderContent() : null,
      ),
      e(BottomNav, { currentView, setCurrentView }),
      selectedCarpet ? e(CarpetDetailModal, { carpet: selectedCarpet, onClose: () => setSelectedCarpet(null), onUpdate: updateCarpet, onDelete: deleteCarpet, onToggleFavorite: toggleFavorite }) : null,
      loading ? e(LoadingSpinner, null) : null
    )
  );
};

export default App;
