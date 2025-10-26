import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCarpets } from './hooks/useCarpets';
import { useSettings } from './hooks/useSettings';
// FIX: Removed unused import for `initializeAi` as API key management is now handled by environment variables.
// import { initializeAi } from './services/geminiService';
import type { Carpet } from './types';
import {
  HomeIcon, PlusIcon, SearchIcon, HeartIcon, Cog6ToothIcon, CameraIcon, WandSparkles, Spinner, XMarkIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, BarcodeIcon, QrCodeIcon
} from './components/icons';

const e = React.createElement;

// --- Constants for Dropdowns ---
const STANDARD_CARPET_SIZES = [
    "80x150 cm", "80x300 cm", "120x180 cm", "160x230 cm", "200x290 cm", "240x340 cm"
];
const STANDARD_YARN_TYPES = [
    "Polypropylene", "Wool", "Polyester", "Acrylic", "Cotton", "Viscose", "Jute", "Sisal", "Nylon"
];

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
        // FIX: Using an untyped event parameter with the `e` alias for `React.createElement` can confuse TypeScript's type overload resolution.
        // Explicitly typing the event parameter `evt` as `React.MouseEvent` resolves the ambiguity.
        e('div', { className: 'relative w-full max-w-md bg-slate-900 rounded-lg p-4', onClick: (evt: React.MouseEvent) => evt.stopPropagation() },
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
            className: `mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md ${previewUrl ? 'h-48' : ''}`,
            onClick: () => fileInputRef.current?.click(),
            onDrop: handleDrop,
            onDragOver: (e: React.DragEvent) => e.preventDefault(),
        },
            e('input', { ref: fileInputRef, type: 'file', accept: 'image/*', className: 'hidden', onChange: handleFileChange }),
            previewUrl ? 
                e('img', { src: previewUrl, alt: 'Carpet preview', className: 'h-full object-contain' }) :
                e('div', { className: 'space-y-1 text-center' },
                    e(CameraIcon, { className: 'mx-auto h-12 w-12 text-slate-400' }),
                    e('p', { className: 'text-sm text-slate-600 dark:text-slate-400' }, t('drop_image_here'))
                )
        )
    );
};

const FormInput = ({ label, name, value, onChange, placeholder = '', type = 'text', required = false }: { label: string, name: string, value: any, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, placeholder?: string, type?: string, required?: boolean }) => {
    const { t } = useSettings();
    const InputComponent = type === 'textarea' ? 'textarea' : 'input';

    return e('div', { className: 'mb-4' },
        e('label', { htmlFor: name, className: 'block text-sm font-medium text-slate-700 dark:text-slate-300' }, `${label}${required ? ' *' : ''}`),
        e(InputComponent, {
            id: name,
            name: name,
            type: type,
            value: value,
            onChange: onChange,
            placeholder: placeholder || label,
            required: required,
            rows: type === 'textarea' ? 4 : undefined,
            className: `mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${type === 'textarea' ? 'min-h-[100px]' : ''}`,
        }),
        required && !value && e('p', { className: 'text-xs text-red-500 mt-1' }, t('required_field'))
    );
};

const FormSelect = ({ label, name, value, onChange, options, required = false }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[], required?: boolean }) => {
    const { t } = useSettings();
    return e('div', { className: 'mb-4' },
        e('label', { htmlFor: name, className: 'block text-sm font-medium text-slate-700 dark:text-slate-300' }, `${label}${required ? ' *' : ''}`),
        e('select', {
            id: name,
            name: name,
            value: value,
            onChange: onChange,
            required: required,
            className: 'mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md',
        },
            e('option', { value: "", disabled: true }, t('select_one')),
            ...options.map(opt => e('option', { key: opt, value: opt }, opt)),
            e('option', { value: "Other" }, t('other'))
        ),
        required && !value && e('p', { className: 'text-xs text-red-500 mt-1' }, t('required_field'))
    );
};


// FIX: Per React.createElement conventions and TypeScript, component props with children should mark `children` as optional in the type definition to avoid type errors at the call site.
const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children?: React.ReactNode }) => {
    if (!isOpen) return null;

    return e('div', {
        className: 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4',
        onClick: onClose,
    },
        e('div', {
            className: 'bg-slate-100 dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto',
            onClick: (evt: React.MouseEvent) => evt.stopPropagation(),
        }, children)
    );
};

// FIX: Removed `showApiKeyLink` prop and related logic as API key is now handled by environment variables.
const InfoModal = ({ title, message, isOpen, onClose }: { title: string, message: string, isOpen: boolean, onClose: () => void }) => {
    const { t } = useSettings();
    if (!isOpen) return null;

    return e(Modal, { isOpen: isOpen, onClose: onClose },
        e('div', { className: 'p-6' },
            e('h2', { className: 'text-xl font-bold mb-4' }, title),
            e('p', { className: 'mb-6' }, message),
            e('div', { className: 'flex justify-end space-x-4' },
                e('button', {
                    onClick: onClose,
                    className: 'px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500'
                }, t('ok'))
            )
        )
    );
};


const CarpetDetailModal = ({ carpet, onClose, onUpdate, onDelete, onToggleFavorite }: { carpet: Carpet | null, onClose: () => void, onUpdate: (c: Carpet) => void, onDelete: (id: string) => void, onToggleFavorite: (id: string) => void }) => {
    const { t } = useSettings();
    const [isEditing, setIsEditing] = useState(false);
    const [editedCarpet, setEditedCarpet] = useState<Carpet | null>(carpet);

    useEffect(() => {
        setEditedCarpet(carpet);
        setIsEditing(false); // Reset edit mode when a new carpet is selected
    }, [carpet]);

    if (!carpet || !editedCarpet) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedCarpet(prev => prev ? { ...prev, [name]: name === 'price' ? Number(value) : value } : null);
    };
    
    const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setEditedCarpet(prev => prev ? { ...prev, size: value === "Other" ? "" : value } : null);
    };
    
    const handleCustomSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedCarpet(prev => prev ? { ...prev, size: e.target.value } : null);
    };

    const handleYarnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setEditedCarpet(prev => prev ? { ...prev, yarnType: value === "Other" ? "" : value } : null);
    };
    
    const handleCustomYarnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedCarpet(prev => prev ? { ...prev, yarnType: e.target.value } : null);
    };


    const handleSave = () => {
        if (editedCarpet) {
            onUpdate(editedCarpet);
            setIsEditing(false);
        }
    };
    
    const handleDelete = () => {
        // eslint-disable-next-line no-alert
        if (window.confirm(t('delete_carpet_confirm'))) {
            onDelete(carpet.id);
        }
    };

    const isCustomSize = !STANDARD_CARPET_SIZES.includes(editedCarpet.size);
    const isCustomYarn = !STANDARD_YARN_TYPES.includes(editedCarpet.yarnType);

    const renderDetail = (label: string, value?: string | number) => e('div', { key: label, className: 'py-2' },
        e('p', { className: 'text-sm font-medium text-slate-500' }, label),
        e('p', { className: 'text-md text-slate-800 dark:text-slate-200' }, value || 'N/A')
    );
    
    const detailFields = [
        { label: t('brand'), value: carpet.brand },
        { label: t('model'), value: carpet.model },
        { label: t('price'), value: `${carpet.price} TL` },
        { label: t('size'), value: carpet.size },
        { label: t('pattern'), value: carpet.pattern },
        { label: t('texture'), value: carpet.texture },
        { label: t('yarn_type'), value: carpet.yarnType },
        { label: t('type'), value: carpet.type },
        { label: t('barcode_id'), value: carpet.barcodeId },
        { label: t('qr_code_id'), value: carpet.qrCodeId },
        { label: t('created_at'), value: new Date(carpet.createdAt).toLocaleDateString() },
    ];
    
    const editFields = [
        { name: 'name', label: t('name'), type: 'text', required: true },
        { name: 'brand', label: t('brand'), type: 'text' },
        { name: 'model', label: t('model'), type: 'text' },
        { name: 'price', label: t('price'), type: 'number' },
        { name: 'pattern', label: t('pattern'), type: 'text' },
        { name: 'texture', label: t('texture'), type: 'text' },
        { name: 'type', label: t('type'), type: 'text' },
        { name: 'barcodeId', label: t('barcode_id'), type: 'text' },
        { name: 'qrCodeId', label: t('qr_code_id'), type: 'text' },
        { name: 'description', label: t('description'), type: 'textarea' },
    ];

    return e(Modal, { isOpen: true, onClose },
        e('div', { className: 'relative' },
            e('img', { src: carpet.imageUrl, alt: carpet.name, className: 'w-full h-64 object-cover' }),
            e('button', { onClick: onClose, className: 'absolute top-3 right-3 p-2 bg-black/50 rounded-full' }, e(XMarkIcon, { className: 'h-6 w-6 text-white' })),
            e('div', { className: 'p-6' },
                e('div', { className: 'flex justify-between items-start mb-4' },
                    isEditing ?
                        e(FormInput, { label: t('name'), name: 'name', value: editedCarpet.name, onChange: handleChange, required: true }) :
                        e('h2', { className: 'text-2xl font-bold' }, carpet.name),
                    e('button', { onClick: () => onToggleFavorite(carpet.id) }, 
                        e(HeartIcon, { className: `h-8 w-8 transition-colors ${carpet.isFavorite ? 'text-red-500' : 'text-slate-400'}`, fill: carpet.isFavorite ? 'currentColor' : 'none' })
                    )
                ),
                isEditing ? (
                    e('div', null, 
                        ...editFields.map(f => e(FormInput, { key: f.name, ...f, value: editedCarpet[f.name as keyof Carpet], onChange: handleChange })),
                        e(FormSelect, { label: t('size'), name: 'size', value: isCustomSize ? 'Other' : editedCarpet.size, onChange: handleSizeChange, options: STANDARD_CARPET_SIZES }),
                        isCustomSize && e(FormInput, { label: t('enter_custom_size'), name: 'size', value: editedCarpet.size, onChange: handleCustomSizeChange }),
                        e(FormSelect, { label: t('yarn_type'), name: 'yarnType', value: isCustomYarn ? 'Other' : editedCarpet.yarnType, onChange: handleYarnChange, options: STANDARD_YARN_TYPES }),
                        isCustomYarn && e(FormInput, { label: t('yarn_type'), name: 'yarnType', value: editedCarpet.yarnType, onChange: handleCustomYarnChange })
                    )
                ) : (
                    e(React.Fragment, null,
                        e('p', { className: 'text-slate-600 dark:text-slate-400 mb-4' }, carpet.description),
                        e('div', { className: 'grid grid-cols-2 gap-x-4' },
                            ...detailFields.map(f => renderDetail(f.label, f.value))
                        )
                    )
                ),
                e('div', { className: 'mt-6 flex justify-between' },
                    e('div', { className: 'flex space-x-2' },
                        e('button', { onClick: handleDelete, className: 'p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md flex items-center' },
                            e(TrashIcon, { className: 'h-5 w-5 mr-1' }),
                            t('delete')
                        )
                    ),
                    e('div', { className: 'flex space-x-2' },
                        isEditing ? (
                            e(React.Fragment, null,
                                e('button', { onClick: () => setIsEditing(false), className: 'px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600' }, t('cancel')),
                                e('button', { onClick: handleSave, className: 'px-4 py-2 rounded-md bg-blue-600 text-white' }, t('save_changes'))
                            )
                        ) : (
                            e('button', { onClick: () => setIsEditing(true), className: 'px-4 py-2 rounded-md bg-blue-600 text-white' }, t('edit'))
                        )
                    )
                )
            )
        )
    );
};

const AddCarpetView = ({ onCarpetAdded }: { onCarpetAdded: () => void }) => {
    const { t } = useSettings();
    const { addCarpet, getDetailsFromImage } = useCarpets();
    const [carpetData, setCarpetData] = useState<Partial<Carpet>>({ name: '', brand: '', model: '', price: 0, size: '', pattern: '', texture: '', yarnType: '', type: '', description: '', barcodeId: '', qrCodeId: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
    const [barcodeScanType, setBarcodeScanType] = useState<'barcode' | 'qr_code'>('barcode');
    // FIX: Removed `isApiError` from state as it's no longer needed after API key handling refactor.
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCarpetData(prev => ({ ...prev, [name]: name === 'price' ? Number(value) : value }));
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === "Other") {
            setCarpetData(prev => ({ ...prev, size: '' }));
        } else {
            setCarpetData(prev => ({ ...prev, size: value }));
        }
    };
    const handleCustomSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCarpetData(prev => ({ ...prev, size: e.target.value }));
    };

    const handleYarnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === "Other") {
            setCarpetData(prev => ({ ...prev, yarnType: '' }));
        } else {
            setCarpetData(prev => ({ ...prev, yarnType: value }));
        }
    };
     const handleCustomYarnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCarpetData(prev => ({ ...prev, yarnType: e.target.value }));
    };

    const handleImageSelect = (file: File) => {
        setImageFile(file);
    };

    const handleAiScan = async () => {
        if (!imageFile) {
            setError(t('carpet_image') + ' ' + t('required_field').toLowerCase());
            return;
        }
        setError('');
        setIsAiLoading(true);
        try {
            const details = await getDetailsFromImage(imageFile);
            setCarpetData(prev => ({ ...prev, ...details }));
        // FIX: Updated error handling to show a generic AI error message, reflecting the new API key management strategy.
        } catch (err: any) {
            console.error("AI Scan Error:", err);
            setInfoModal({
                isOpen: true,
                title: t('ai_analysis_error'),
                message: err.message,
            });
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile || !carpetData.name) {
            setError(`${t('carpet_image')} and ${t('name')} are required.`);
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await addCarpet(carpetData, imageFile);
            onCarpetAdded(); // Switch view
        } catch (err) {
            setError("Failed to save carpet. Please try again.");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };
    
    const openBarcodeScanner = (type: 'barcode' | 'qr_code') => {
        setBarcodeScanType(type);
        setIsBarcodeScannerOpen(true);
    };

    const handleScanSuccess = (value: string) => {
        if(barcodeScanType === 'barcode') {
            setCarpetData(prev => ({ ...prev, barcodeId: value }));
        } else {
            setCarpetData(prev => ({ ...prev, qrCodeId: value }));
        }
        setIsBarcodeScannerOpen(false);
    };
    
    const isCustomSize = !STANDARD_CARPET_SIZES.includes(carpetData.size || "");
    const isCustomYarn = !STANDARD_YARN_TYPES.includes(carpetData.yarnType || "");

    return e('div', null,
        e(InfoModal, {
            isOpen: infoModal.isOpen,
            title: infoModal.title,
            message: infoModal.message,
            onClose: () => setInfoModal({ isOpen: false, title: '', message: '' })
        }),
        isBarcodeScannerOpen && e(BarcodeScannerModal, {
            onScanSuccess: handleScanSuccess,
            onClose: () => setIsBarcodeScannerOpen(false),
            scanType: barcodeScanType,
        }),
        e('form', { onSubmit: handleSubmit, className: 'space-y-4' },
            e(ImageUploader, { onImageSelect: handleImageSelect }),
            e('button', {
                type: 'button',
                onClick: handleAiScan,
                disabled: isAiLoading || !imageFile,
                className: 'w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500',
            },
                isAiLoading ? e(Spinner, { className: 'animate-spin -ml-1 mr-3 h-5 w-5' }) : e(WandSparkles, { className: '-ml-1 mr-2 h-5 w-5' }),
                isAiLoading ? t('analyzing_image') : t('scan_with_ai')
            ),
            error && e('p', { className: 'text-red-500 text-sm' }, error),
            e(FormInput, { label: t('name'), name: 'name', value: carpetData.name, onChange: handleChange, required: true }),
            e(FormInput, { label: t('brand'), name: 'brand', value: carpetData.brand, onChange: handleChange }),
            e(FormInput, { label: t('model'), name: 'model', value: carpetData.model, onChange: handleChange }),
            e(FormInput, { label: t('price'), name: 'price', value: carpetData.price, onChange: handleChange, type: 'number' }),
            
            e(FormSelect, { label: t('size'), name: 'size', value: isCustomSize ? 'Other' : (carpetData.size || ''), onChange: handleSizeChange, options: STANDARD_CARPET_SIZES }),
            isCustomSize && e(FormInput, { label: t('enter_custom_size'), name: 'size', value: carpetData.size, onChange: handleCustomSizeChange }),
            
            e(FormSelect, { label: t('yarn_type'), name: 'yarnType', value: isCustomYarn ? 'Other' : (carpetData.yarnType || ''), onChange: handleYarnChange, options: STANDARD_YARN_TYPES }),
            isCustomYarn && e(FormInput, { label: t('yarn_type'), name: 'yarnType', value: carpetData.yarnType, onChange: handleCustomYarnChange }),

            e(FormInput, { label: t('pattern'), name: 'pattern', value: carpetData.pattern, onChange: handleChange }),
            e(FormInput, { label: t('texture'), name: 'texture', value: carpetData.texture, onChange: handleChange }),
            e(FormInput, { label: t('type'), name: 'type', value: carpetData.type, onChange: handleChange }),
            e(FormInput, { label: t('description'), name: 'description', value: carpetData.description, onChange: handleChange, type: 'textarea' }),
            
             e('div', { className: 'flex space-x-2' },
                e(FormInput, { label: t('barcode_id'), name: 'barcodeId', value: carpetData.barcodeId, onChange: handleChange }),
                e('button', { type: 'button', onClick: () => openBarcodeScanner('barcode'), className: 'mt-6 p-2 bg-slate-200 dark:bg-slate-600 rounded-md' }, e(BarcodeIcon, {className: 'h-6 w-6'}))
            ),
             e('div', { className: 'flex space-x-2' },
                e(FormInput, { label: t('qr_code_id'), name: 'qrCodeId', value: carpetData.qrCodeId, onChange: handleChange }),
                e('button', { type: 'button', onClick: () => openBarcodeScanner('qr_code'), className: 'mt-6 p-2 bg-slate-200 dark:bg-slate-600 rounded-md' }, e(QrCodeIcon, {className: 'h-6 w-6'}))
            ),

            e('button', {
                type: 'submit',
                disabled: isSaving,
                className: 'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            },
                isSaving ? e(Spinner, { className: 'animate-spin -ml-1 mr-3 h-5 w-5' }) : null,
                t('add_new_carpet')
            )
        )
    );
};

const MatchCarpetView = () => {
    const { t } = useSettings();
    const { findMatchByImage } = useCarpets();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<'found' | 'not_found' | null>(null);
    const [matchedCarpet, setMatchedCarpet] = useState<Carpet | null>(null);
    const [detailModalCarpet, setDetailModalCarpet] = useState<Carpet | null>(null);
    // FIX: Removed `isApiError` from state as it's no longer needed after API key handling refactor.
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });


    const handleImageSelect = (file: File) => {
        setImageFile(file);
        setResult(null);
        setMatchedCarpet(null);
    };

    const handleMatchSearch = async () => {
        if (!imageFile) return;
        setIsLoading(true);
        setResult(null);
        setMatchedCarpet(null);
        try {
            const match = await findMatchByImage(imageFile);
            if (match) {
                setResult('found');
                setMatchedCarpet(match);
            } else {
                setResult('not_found');
            }
        // FIX: Updated error handling to show a generic AI error message, reflecting the new API key management strategy.
        } catch (err: any) {
             setInfoModal({
                isOpen: true,
                title: t('ai_match_error'),
                message: err.message,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    // Dummy functions for modal compatibility
    const handleUpdate = () => {};
    const handleDelete = () => {};
    const handleToggleFavorite = () => {};

    return e('div', null,
         e(InfoModal, {
            isOpen: infoModal.isOpen,
            title: infoModal.title,
            message: infoModal.message,
            onClose: () => setInfoModal({ isOpen: false, title: '', message: '' })
        }),
        e(ImageUploader, { onImageSelect: handleImageSelect }),
        e('button', {
            type: 'button',
            onClick: handleMatchSearch,
            disabled: isLoading || !imageFile,
            className: 'mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        },
            isLoading ? e(Spinner, { className: 'animate-spin -ml-1 mr-3 h-5 w-5' }) : e(SearchIcon, { className: '-ml-1 mr-2 h-5 w-5' }),
            isLoading ? t('searching_for_match') : t('find_match')
        ),

        result && e('div', { className: 'mt-6 text-center' },
            result === 'found' && matchedCarpet ? (
                e('div', null,
                    e('h3', { className: 'text-lg font-medium text-green-600 dark:text-green-400' }, t('match_found')),
                    e('div', { className: 'mt-4 max-w-xs mx-auto' }, 
                        e(CarpetCard, { carpet: matchedCarpet, onCarpetClick: () => setDetailModalCarpet(matchedCarpet) })
                    )
                )
            ) : (
                e('h3', { className: 'text-lg font-medium text-amber-600 dark:text-amber-400' }, t('no_match_found'))
            )
        ),
        
        detailModalCarpet && e(CarpetDetailModal, {
            carpet: detailModalCarpet,
            onClose: () => setDetailModalCarpet(null),
            onUpdate: handleUpdate,
            onDelete: handleDelete,
            onToggleFavorite: handleToggleFavorite,
        })
    );
};

const SettingsView = () => {
    // FIX: Removed `apiKey` and `setApiKey` as they are no longer managed through settings.
    const { language, setLanguage, theme, setTheme, t } = useSettings();
    const { carpets, replaceAllCarpets } = useCarpets();
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
        } catch (err) {
            console.error("Export failed", err);
            alert(t('export_error'));
        }
    };
    
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read");
                const importedCarpets = JSON.parse(text);
                await replaceAllCarpets(importedCarpets);
                alert(t('import_success'));
            } catch (err) {
                console.error("Import failed", err);
                alert(t('import_error'));
            }
        };
        reader.readAsText(file);
    };

    // FIX: Per React.createElement conventions and TypeScript, component props with children should mark `children` as optional in the type definition to avoid type errors at the call site.
    const SettingsSection = ({ title, children }: { title: string, children?: React.ReactNode }) =>
        e('div', { className: 'mb-6' },
            e('h3', { className: 'text-lg font-semibold border-b border-slate-300 dark:border-slate-600 pb-2 mb-3' }, title),
            children
        );
        
    // FIX: Per React.createElement conventions and TypeScript, component props with children should mark `children` as optional in the type definition to avoid type errors at the call site.
    const SettingsItem = ({ label, children }: { label: string, children?: React.ReactNode }) =>
        e('div', { className: 'flex items-center justify-between py-2' },
            e('label', { className: 'text-md' }, label),
            children
        );

    return e('div', { className: 'space-y-6' },
        e(SettingsSection, { title: t('language') },
            e(SettingsItem, { label: t('language') },
                e('select', { 
                    value: language, 
                    onChange: (ev: React.ChangeEvent<HTMLSelectElement>) => setLanguage(ev.target.value as 'en' | 'tr'),
                    className: 'p-2 rounded-md bg-slate-200 dark:bg-slate-700'
                },
                    e('option', { value: 'tr' }, 'Türkçe'),
                    e('option', { value: 'en' }, 'English')
                )
            )
        ),
        e(SettingsSection, { title: t('theme') },
            e(SettingsItem, { label: t('theme') },
                e('div', { className: 'flex space-x-2' },
                    e('button', { 
                        onClick: () => setTheme('light'),
                        className: `px-4 py-2 rounded-md ${theme === 'light' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`
                    }, t('light')),
                    e('button', { 
                        onClick: () => setTheme('dark'),
                        className: `px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`
                    }, t('dark'))
                )
            )
        ),
        // FIX: Removed the API Key configuration section from the UI to align with security best practices.
        e(SettingsSection, { title: t('data_management') },
            e('div', { className: 'flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4' },
                e('input', { ref: importInputRef, type: 'file', accept: '.json', className: 'hidden', onChange: handleImport }),
                e('button', { 
                    onClick: () => importInputRef.current?.click(),
                    className: 'w-full flex items-center justify-center px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700'
                }, e(ArrowDownTrayIcon, { className: 'h-5 w-5 mr-2' }), t('import_data')),
                e('button', { 
                    onClick: handleExport,
                    className: 'w-full flex items-center justify-center px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700'
                }, e(ArrowUpTrayIcon, { className: 'h-5 w-5 mr-2' }), t('export_data'))
            )
        )
    );
};

function App() {
  const { carpets, loading, error: dbError, toggleFavorite, updateCarpet, deleteCarpet } = useCarpets();
  // FIX: Removed `apiKey` from settings context as it's no longer needed.
  const { t } = useSettings();
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCarpet, setSelectedCarpet] = useState<Carpet | null>(null);

  // FIX: Removed useEffect for `initializeAi` as API key is now handled via environment variables.
  
  const handleCarpetClick = (carpet: Carpet) => {
    setSelectedCarpet(carpet);
  };
  
  const handleCloseModal = () => {
    setSelectedCarpet(null);
  };

  const filteredCarpets = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return carpets.filter(c => 
      c.name.toLowerCase().includes(lowerCaseQuery) ||
      c.brand.toLowerCase().includes(lowerCaseQuery) ||
      c.model.toLowerCase().includes(lowerCaseQuery) ||
      c.barcodeId?.includes(lowerCaseQuery) ||
      c.qrCodeId?.includes(lowerCaseQuery)
    );
  }, [searchQuery, carpets]);

  const favoriteCarpets = useMemo(() => filteredCarpets.filter(c => c.isFavorite), [filteredCarpets]);

  const renderContent = () => {
    if (loading) return e('div', { className: 'flex justify-center items-center h-64' }, e(Spinner, { className: 'h-8 w-8 animate-spin' }));
    if (dbError) return e('p', { className: 'text-center text-red-500' }, dbError);

    switch(currentView) {
      case 'home':
        return e(CarpetGrid, { carpets: filteredCarpets, onCarpetClick: handleCarpetClick });
      case 'favorites':
        return e(CarpetGrid, { carpets: favoriteCarpets, onCarpetClick: handleCarpetClick, isFavorites: true });
      case 'add':
        return e(AddCarpetView, { onCarpetAdded: () => setCurrentView('home') });
      case 'match':
          return e(MatchCarpetView, null);
      case 'settings':
        return e(SettingsView, null);
      default:
        return e(CarpetGrid, { carpets, onCarpetClick: handleCarpetClick });
    }
  };

  return e('div', { className: 'min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100' },
    e(Header, { title: t('app_title'), searchQuery, setSearchQuery, currentView }),
    e('main', { className: 'p-4 pb-24 max-w-2xl mx-auto' }, renderContent()),
    e(BottomNav, { currentView, setCurrentView }),
    selectedCarpet && e(CarpetDetailModal, { 
      carpet: selectedCarpet,
      onClose: handleCloseModal,
      onUpdate: (c: Carpet) => {
        updateCarpet(c);
        setSelectedCarpet(c); // Update the modal with the new data
      },
      onDelete: (id: string) => {
          deleteCarpet(id);
          handleCloseModal();
      },
      // FIX: Corrected prop passing to use the `toggleFavorite` function from the `useCarpets` hook.
      onToggleFavorite: toggleFavorite
    })
  );
}

export default App;
