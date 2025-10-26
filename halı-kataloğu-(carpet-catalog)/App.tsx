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

  return e('header', { className: 'bg-slate-100 dark:bg-slate-900 px-4 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800' },
    e('h1', { className: 'text-3xl font-bold text-center mb-4' }, viewTitles[currentView] || title),
    showSearch && e('div', { className: 'relative' },
      e(SearchIcon, { className: 'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400' }),
      e('input', {
        type: 'text',
        value: searchQuery,
        onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(ev.target.value),
        placeholder: t('search_placeholder'),
        className: 'w-full p-3 pl-11 rounded-full bg-slate-200 dark:bg-slate-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500',
      }),
      searchQuery && e('button', {
        onClick: () => setSearchQuery(''),
        className: 'absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700'
      }, e(XMarkIcon, { className: 'h-5 w-5 text-slate-500 dark:text-slate-400' }))
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

  return e('nav', { className: 'fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)]' },
    e('div', { className: 'flex justify-around items-center h-16' },
      ...navItems.map(item => {
        const isActive = currentView === item.id;
        if (item.id === 'add') {
          return e('div', { key: 'add-wrapper', className: 'relative -mt-8' },
            e('button', {
              key: item.id,
              onClick: () => handleNavClick(item.id),
              'aria-label': item.label,
              className: `w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800`,
            },
              e(item.icon, { className: 'h-8 w-8' })
            )
          );
        }
        return e('button', {
          key: item.id,
          onClick: () => handleNavClick(item.id),
          className: `flex flex-col items-center justify-center w-full py-2 px-1 text-xs relative transition-colors ${isActive ? 'text-blue-500 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`,
        },
          e(item.icon, { className: 'h-6 w-6 mb-1' }),
          item.label,
          isActive && e(motion.div, {
            className: 'absolute bottom-0 h-1 w-6 bg-blue-500 rounded-full',
            layoutId: 'active-nav-indicator',
          })
        );
      })
    )
  );
};

const CarpetCard = ({ carpet, onCarpetClick }: { carpet: Carpet, onCarpetClick: (c: Carpet) => void }) => {
    return e(motion.div, { 
        className: 'bg-slate-300 dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden cursor-pointer group relative',
        onClick: () => onCarpetClick(carpet),
        whileHover: { y: -5 },
        whileTap: { scale: 0.98 },
        layout: true,
    },
        e('img', { src: carpet.imageUrl, alt: carpet.name, className: 'w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300' }),
        e('div', {className: 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent'}),
        e('div', { className: 'absolute bottom-0 left-0 w-full p-4' },
            e('h3', { className: 'font-bold text-lg text-white truncate' }, carpet.name),
            e('p', { className: 'text-sm text-slate-300 truncate' }, carpet.brand)
        ),
        carpet.isFavorite && e('div', { className: 'absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full p-1.5' }, e(HeartIcon, { className: 'h-5 w-5 text-red-500', fill: 'currentColor' }))
    );
};

const EmptyState = ({ icon, title, message, actionButton }: { icon: React.FC<any>, title: string, message: string, actionButton?: React.ReactNode }) => {
    const IconComponent = icon;
    return e('div', { className: 'flex flex-col items-center justify-center text-center p-8 mt-10' },
        e('div', { className: 'relative flex items-center justify-center h-28 w-28 mb-6' },
            e('div', { className: 'absolute -inset-2 bg-slate-200 dark:bg-slate-800 rounded-full opacity-50 blur-2xl' }),
            e(IconComponent, { className: 'relative h-20 w-20 text-slate-400 dark:text-slate-600' })
        ),
        e('h2', { className: 'text-2xl font-bold mb-2' }, title),
        e('p', { className: 'text-slate-500 dark:text-slate-400 mb-6 max-w-xs' }, message),
        actionButton
    );
};

const CarpetGrid = ({ carpets, onCarpetClick, isFavorites = false, setCurrentView }: { carpets: Carpet[], onCarpetClick: (c: Carpet) => void, isFavorites?: boolean, setCurrentView?: (v: string) => void }) => {
    const { t } = useSettings();

    if (carpets.length === 0) {
        if (isFavorites) {
            return e(EmptyState, {
                icon: HeartIcon,
                title: t('no_favorites_found'),
                message: t('empty_favorites_message')
            });
        }
        return e(EmptyState, {
            icon: SearchIcon,
            title: t('no_carpets_found'),
            message: t('empty_home_message'),
            actionButton: setCurrentView && e('button', {
                onClick: () => setCurrentView('add'),
                className: 'px-6 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition-colors'
            }, t('add_first_carpet'))
        });
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
            className: `mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md transition-colors hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer ${previewUrl ? 'h-48 p-2' : 'h-32'}`,
            onClick: () => fileInputRef.current?.click(),
            onDrop: handleDrop,
            onDragOver: (e: React.DragEvent) => e.preventDefault(),
        },
            e('input', { ref: fileInputRef, type: 'file', accept: 'image/*', className: 'hidden', onChange: handleFileChange }),
            previewUrl ? 
                e('img', { src: previewUrl, alt: 'Carpet preview', className: 'h-full w-full object-contain rounded-md' }) :
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
            className: `mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${type === 'textarea' ? 'min-h-[100px]' : ''}`,
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
            className: 'flex-grow p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
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
            className: 'flex-grow p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
        });
        
    return e('div', { className: 'mb-4' },
        e('label', { className: 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1' }, label),
        e('div', { className: 'flex flex-wrap gap-2 p-2 min-h-[44px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md' },
            ...values.map(value => e('span', {
                key: value,
                className: 'flex items-center bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm font-medium px-2.5 py-1 rounded-full'
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
                className: 'px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-r-md hover:bg-slate-300 dark:hover:bg-slate-600'
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
                className: 'bg-slate-100 dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto',
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
            e('p', { className: 'mb-6 text-slate-600 dark:text-slate-400' }, message),
            e('div', { className: 'flex justify-end space-x-4' },
                e('button', {
                    onClick: onClose,
                    className: 'px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700'
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
        return e('div', { key: label, className: 'py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center' },
            e('p', { className: 'text-sm font-medium text-slate-500 dark:text-slate-400' }, label),
            e('p', { className: 'text-md text-slate-800 dark:text-slate-200 text-right' }, displayValue)
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
        { name: 'brand', label: t('brand'), type: 'text' },
        { name: 'model', label: t('model'), type: 'text' },
        { name: 'price', label: t('price'), type: 'number' },
        { name: 'pattern', label: t('pattern'), type: 'text' },
        { name: 'texture', label: t('texture'), type: 'text' },
        { name: 'type', label: t('type'), type: 'text' },
        { name: 'barcodeId', label: t('barcode_id'), type: 'text' },
        { name: 'qrCodeId', label: t('qr_code_id'), type: 'text' },
    ];

    return e(Modal, { isOpen: !!carpet, onClose },
        e('div', { className: 'relative' },
            e('img', { src: carpet.imageUrl, alt: carpet.name, className: 'w-full h-64 object-cover' }),
            e('button', { onClick: onClose, className: 'absolute top-3 right-3 p-2 bg-black/50 rounded-full' }, e(XMarkIcon, { className: 'h-6 w-6 text-white' })),
            e('div', { className: 'p-6' },
                e('div', { className: 'flex justify-between items-start mb-4' },
                    isEditing ?
                        e(FormInput, { label: t('name'), name: 'name',