import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCarpets } from './hooks/useCarpets';
import { useSettings } from './hooks/useSettings';
import { useToast } from './hooks/useToast';
import type { Carpet } from './types';
import {
  HomeIcon, PlusIcon, SearchIcon, HeartIcon, Cog6ToothIcon, CameraIcon, WandSparkles, Spinner, XMarkIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, BarcodeIcon, QrCodeIcon, CheckCircleIcon, XCircleIcon
} from './components/icons';

const e = React.createElement;

// --- Utility for Haptic Feedback ---
const triggerHapticFeedback = (impact: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        const pattern: Record<typeof impact, number> = {
            light: 20,
            medium: 40,
            heavy: 60
        };
        try {
            navigator.vibrate(pattern[impact]);
        } catch (e) {
            // This can fail on some browsers if called too frequently.
            // We can safely ignore the error.
        }
    }
};

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
                            triggerHapticFeedback('medium');
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

  return e('header', { className: 'sticky top-0 z-30 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 border-b border-slate-200 dark:border-slate-700' },
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

  const handleNavClick = (view: string) => {
    triggerHapticFeedback();
    setCurrentView(view);
  };

  return e('nav', { className: 'fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700' },
    e('div', { className: 'flex justify-around items-center h-16' },
      ...navItems.map(item => {
        if (item.id === 'add') {
          return e('div', { key: 'add-wrapper', className: 'relative -mt-8' },
            e('button', {
              key: item.id,
              onClick: () => handleNavClick(item.id),
              'aria-label': item.label,
              className: `w-16 h-16 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-transform hover:scale-110`,
            },
              e(item.icon, { className: 'h-8 w-8' })
            )
          );
        }
        return e('button', {
          key: item.id,
          onClick: () => handleNavClick(item.id),
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
    return e(motion.div, { 
        className: 'bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden cursor-pointer relative',
        onClick: () => onCarpetClick(carpet),
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        layout: true,
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
        e(AnimatePresence, null, 
          ...carpets.map(carpet => e(CarpetCard, { key: carpet.id, carpet, onCarpetClick }))
        )
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

const FormInput = ({ label, name, value, onChange, placeholder = '', type = 'text', required = false }: { label: string, name: string, value: any, onChange: any, placeholder?: string, type?: string, required?: boolean }) => {
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

const MultiTagInput = ({ label, values, onValuesChange, placeholder, options }: { label: string, values: string[], onValuesChange: (newValues: string[]) => void, placeholder: string, options?: string[] }) => {
    const { t } = useSettings();
    const [inputValue, setInputValue] = useState('');

    const handleAdd = () => {
        const valueToAdd = inputValue.trim();
        if (valueToAdd && !values.includes(valueToAdd)) {
            triggerHapticFeedback();
            onValuesChange([...values, valueToAdd]);
            setInputValue(''); // Reset for next input
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleRemove = (valueToRemove: string) => {
        onValuesChange(values.filter(v => v !== valueToRemove));
    };

    const inputArea = options ?
        e('select', {
            value: inputValue,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setInputValue(e.target.value),
            className: 'flex-grow p-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
        },
            e('option', { value: "" }, placeholder),
            ...options.map(opt => e('option', { key: opt, value: opt }, opt))
        ) :
        e('input', {
            type: 'text',
            value: inputValue,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value),
            onKeyDown: handleKeyDown,
            placeholder: placeholder,
            className: 'flex-grow p-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
        });
        
    return e('div', { className: 'mb-4' },
        e('label', { className: 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1' }, label),
        e('div', { className: 'flex flex-wrap gap-2 p-2 min-h-[44px] bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md' },
            ...values.map(value => e('span', {
                key: value,
                className: 'flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-2.5 py-1 rounded-full'
            },
                value,
                e('button', {
                    type: 'button',
                    onClick: () => handleRemove(value),
                    className: 'ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100'
                }, e(XMarkIcon, { className: 'h-4 w-4' }))
            ))
        ),
        e('div', { className: 'flex mt-2' },
            inputArea,
            e('button', {
                type: 'button',
                onClick: handleAdd,
                className: 'px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-r-md hover:bg-slate-300 dark:hover:bg-slate-500'
            }, t('add'))
        )
    );
};


const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children?: React.ReactNode }) => {
    return e(AnimatePresence, null,
        isOpen && e(motion.div, {
            className: 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4',
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            onClick: onClose,
        },
            e(motion.div, {
                className: 'bg-slate-100 dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto',
                initial: { scale: 0.9, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                exit: { scale: 0.9, opacity: 0 },
                transition: { type: 'spring', stiffness: 300, damping: 30 },
                onClick: (evt: React.MouseEvent) => evt.stopPropagation(),
            }, children)
        )
    );
};

const InfoModal = ({ title, message, isOpen, onClose }: { title: string, message: string, isOpen: boolean, onClose: () => void }) => {
    const { t } = useSettings();

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

    if (!carpet) return null;
    const currentCarpet = editedCarpet || carpet;


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedCarpet(prev => prev ? { ...prev, [name]: name === 'price' ? Number(value) : value } : null);
    };

    const handleSave = () => {
        if (editedCarpet) {
            triggerHapticFeedback('medium');
            onUpdate(editedCarpet);
            setIsEditing(false);
        }
    };
    
    const handleDelete = () => {
        if (window.confirm(t('delete_carpet_confirm'))) {
            triggerHapticFeedback('heavy');
            onDelete(carpet.id);
        }
    };

    const handleToggleFavorite = () => {
        triggerHapticFeedback();
        onToggleFavorite(carpet.id);
    };

    const renderDetail = (label: string, value?: string | number | string[]) => {
        const displayValue = Array.isArray(value) ? (value.length > 0 ? value.join(', ') : 'N/A') : (value || 'N/A');
        return e('div', { key: label, className: 'py-2' },
            e('p', { className: 'text-sm font-medium text-slate-500' }, label),
            e('p', { className: 'text-md text-slate-800 dark:text-slate-200' }, displayValue)
        );
    }
    
    const detailFields = [
        { label: t('brand'), value: carpet.brand },
        { label: t('model'), value: carpet.model },
        { label: t('price'), value: `${carpet.price} TL` },
        { label: t('sizes'), value: carpet.size },
        { label: t('pattern'), value: carpet.pattern },
        { label: t('texture'), value: carpet.texture },
        { label: t('yarn_types'), value: carpet.yarnType },
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

    return e(Modal, { isOpen: !!carpet, onClose },
        e('div', { className: 'relative' },
            e('img', { src: carpet.imageUrl, alt: carpet.name, className: 'w-full h-64 object-cover' }),
            e('button', { onClick: onClose, className: 'absolute top-3 right-3 p-2 bg-black/50 rounded-full' }, e(XMarkIcon, { className: 'h-6 w-6 text-white' })),
            e('div', { className: 'p-6' },
                e('div', { className: 'flex justify-between items-start mb-4' },
                    isEditing ?
                        e(FormInput, { label: t('name'), name: 'name', value: currentCarpet.name, onChange: handleChange, required: true }) :
                        e('h2', { className: 'text-2xl font-bold' }, carpet.name),
                    e('button', { onClick: handleToggleFavorite }, 
                        e(HeartIcon, { className: `h-8 w-8 transition-colors ${carpet.isFavorite ? 'text-red-500' : 'text-slate-400'}`, fill: carpet.isFavorite ? 'currentColor' : 'none' })
                    )
                ),
                isEditing ? (
                    e('div', null, 
                        ...editFields.map(f => e(FormInput, { key: f.name, ...f, value: currentCarpet[f.name as keyof Carpet], onChange: handleChange })),
                        e(MultiTagInput, {
                            label: t('sizes'),
                            values: currentCarpet.size,
                            onValuesChange: (newSizes: string[]) => setEditedCarpet(prev => prev ? { ...prev, size: newSizes } : null),
                            placeholder: t('enter_custom_size'),
                        }),
                        e('div', { className: 'flex flex-wrap gap-2 my-2' },
                            ...STANDARD_CARPET_SIZES.map(s => e('button', {
                                type: 'button',
                                onClick: () => {
                                    if (!currentCarpet.size.includes(s)) {
                                        setEditedCarpet(prev => prev ? { ...prev, size: [...prev.size, s] } : null);
                                    }
                                },
                                className: 'px-2 py-1 text-xs bg-slate-200 dark:bg-slate-600 rounded'
                            }, `+ ${s}`))
                        ),
                         e(MultiTagInput, {
                            label: t('yarn_types'),
                            values: currentCarpet.yarnType,
                            onValuesChange: (newYarns: string[]) => setEditedCarpet(prev => prev ? { ...prev, yarnType: newYarns } : null),
                            placeholder: t('select_yarn_type'),
                            options: STANDARD_YARN_TYPES
                        })
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
    const [carpetData, setCarpetData] = useState<Partial<Carpet>>({ name: '', brand: '', model: '', price: 0, size: [], pattern: '', texture: '', yarnType: [], type: '', description: '', barcodeId: '', qrCodeId: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
    const [barcodeScanType, setBarcodeScanType] = useState<'barcode' | 'qr_code'>('barcode');
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCarpetData(prev => ({ ...prev, [name]: name === 'price' ? Number(value) : value }));
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
            
            e(MultiTagInput, {
                label: t('sizes'),
                values: carpetData.size || [],
                onValuesChange: (newSizes) => setCarpetData(prev => ({ ...prev, size: newSizes })),
                placeholder: t('enter_custom_size')
            }),
            e('div', { className: 'flex flex-wrap gap-2 -mt-2 mb-2' },
                ...STANDARD_CARPET_SIZES.map(s => e('button', {
                    type: 'button',
                    key: s,
                    onClick: () => {
                        if (!carpetData.size?.includes(s)) {
                           setCarpetData(prev => ({ ...prev, size: [...(prev.size || []), s]}));
                        }
                    },
                    className: 'px-2 py-1 text-xs bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500'
                }, `+ ${s}`))
            ),

            e(MultiTagInput, {
                label: t('yarn_types'),
                values: carpetData.yarnType || [],
                onValuesChange: (newYarns) => setCarpetData(prev => ({ ...prev, yarnType: newYarns })),
                placeholder: t('select_yarn_type'),
                options: STANDARD_YARN_TYPES
            }),
            
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
    const { language, setLanguage, theme, setTheme, t } = useSettings();
    const { carpets, replaceAllCarpets } = useCarpets();
    const toast = useToast();
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
            toast.addToast(t('export_success'), 'success');
        } catch (err) {
            console.error("Export failed", err);
            toast.addToast(t('export_error'), 'error');
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
                toast.addToast(t('import_success'), 'success');
            } catch (err) {
                console.error("Import failed", err);
                toast.addToast(t('import_error'), 'error');
            }
        };
        reader.readAsText(file);
    };

    const SettingsSection = ({ title, children }: { title: string, children?: React.ReactNode }) =>
        e('div', { className: 'mb-6' },
            e('h3', { className: 'text-lg font-semibold border-b border-slate-300 dark:border-slate-600 pb-2 mb-3' }, title),
            children
        );
        
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

const Toast = ({ message, type, onRemove }: { message: string, type: 'success' | 'error', onRemove: () => void }) => {
    const isSuccess = type === 'success';
    const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;

    useEffect(() => {
        const timer = setTimeout(onRemove, 3000);
        return () => clearTimeout(timer);
    }, [onRemove]);
    
    return e(motion.div, {
        className: `flex items-center w-full max-w-sm p-4 rounded-lg shadow-lg text-white ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`,
        layout: true,
        initial: { opacity: 0, y: -50, scale: 0.3 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
    },
        e(Icon, { className: 'h-6 w-6' }),
        e('div', { className: 'ml-3 text-sm font-medium' }, message),
        e('button', { onClick: onRemove, className: 'ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-full inline-flex hover:bg-white/20' }, e(XMarkIcon, { className: 'h-5 w-5' }))
    );
};

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();
    return e('div', { className: 'fixed top-5 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm flex flex-col items-center space-y-2' },
        e(AnimatePresence, null, 
            ...toasts.map(toast => e(Toast, {
                key: toast.id,
                ...toast,
                onRemove: () => removeToast(toast.id)
            }))
        )
    );
};

function App() {
  const { carpets, loading, error: dbError, toggleFavorite, updateCarpet, deleteCarpet } = useCarpets();
  const { t } = useSettings();
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCarpet, setSelectedCarpet] = useState<Carpet | null>(null);

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

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -50 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4
  };

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
    e(ToastContainer, null),
    e('main', { className: 'p-4 pb-24 max-w-2xl mx-auto overflow-hidden' }, 
        e(AnimatePresence, { mode: 'wait' }, 
            e(motion.div, {
                key: currentView,
                initial: "initial",
                animate: "in",
                exit: "out",
                variants: pageVariants,
                transition: pageTransition,
            }, renderContent())
        )
    ),
    e(BottomNav, { currentView, setCurrentView }),
    e(CarpetDetailModal, { 
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
      onToggleFavorite: toggleFavorite
    })
  );
}

export default App;