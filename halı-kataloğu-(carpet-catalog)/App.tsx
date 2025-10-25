import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSettings } from './hooks/useSettings';
import { useCarpets } from './hooks/useCarpets';
import { Carpet } from './types';
import * as Icons from './components/icons';
import { motion, AnimatePresence } from 'framer-motion';

// Using React.createElement throughout the file to avoid JSX transform issues.

const App: React.FC = () => {
  const { t, theme } = useSettings();
  const { carpets, loading, error, addCarpet, updateCarpet, deleteCarpet, toggleFavorite, getDetailsFromImage, findMatchByImage, replaceAllCarpets } = useCarpets();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isMatchModalOpen, setMatchModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isBarcodeScanModalOpen, setBarcodeScanModalOpen] = useState(false);
  const [viewingCarpet, setViewingCarpet] = useState<Carpet | null>(null);
  const [deletingCarpet, setDeletingCarpet] = useState<Carpet | null>(null);

  const filteredCarpets = useMemo(() => {
    return carpets
      .filter(carpet => (showFavorites ? carpet.isFavorite : true))
      .filter(carpet =>
        [carpet.name, carpet.brand, carpet.model, carpet.pattern, carpet.description, carpet.barcodeId]
          .some(field => field && field.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [carpets, searchTerm, showFavorites]);

  const handleCarpetFoundByBarcode = (carpetId: string) => {
    const foundCarpet = carpets.find(c => c.id === carpetId);
    if (foundCarpet) {
      setBarcodeScanModalOpen(false);
      setViewingCarpet(foundCarpet);
    }
  };

  return React.createElement('div', { 
    key: theme, // Force re-render on theme change to fix JIT compiler issue
    className: "bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen font-sans" 
  },
    React.createElement(Header, {}),
    React.createElement('main', { className: "container mx-auto p-4 pb-28" },
      React.createElement(AnimatePresence, null,
          isSearchVisible && React.createElement(motion.div, {
              initial: { opacity: 0, y: -20 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -20 },
              className: "mb-6"
          }, React.createElement(SearchBar, { searchTerm, setSearchTerm }))
      ),
      error && React.createElement('div', { className: "text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg mb-4" }, `${t('error')}: ${error}`),
      loading && carpets.length === 0
        ? React.createElement('div', { className: "text-center p-10" }, t('loading'))
        : filteredCarpets.length > 0
          ? React.createElement(CarpetGrid, { carpets: filteredCarpets, onView: setViewingCarpet, onToggleFavorite: toggleFavorite })
          : React.createElement(EmptyState, { onAdd: () => setAddModalOpen(true), hasSearch: searchTerm.length > 0 || showFavorites })
    ),
    React.createElement(BottomNavBar, {
        showFavorites: showFavorites,
        onShowFavorites: setShowFavorites,
        isSearchVisible: isSearchVisible,
        onToggleSearch: () => setIsSearchVisible(prev => !prev),
        onAdd: () => setAddModalOpen(true),
        onMatch: () => setMatchModalOpen(true),
        onBarcodeScan: () => setBarcodeScanModalOpen(true),
        onSettings: () => setSettingsModalOpen(true)
    }),
    React.createElement(AnimatePresence, null,
      isAddModalOpen && React.createElement(AddCarpetModal, {
        onClose: () => setAddModalOpen(false),
        onAddCarpet: addCarpet,
        getDetailsFromImage: getDetailsFromImage,
      }),
      isMatchModalOpen && React.createElement(FindMatchModal, {
        onClose: () => setMatchModalOpen(false),
        findMatchByImage: findMatchByImage,
        onViewMatch: (carpet) => {
          setMatchModalOpen(false);
          setViewingCarpet(carpet);
        },
      }),
      isBarcodeScanModalOpen && React.createElement(BarcodeScanModal, {
        onClose: () => setBarcodeScanModalOpen(false),
        onCarpetFound: handleCarpetFoundByBarcode,
        carpets: carpets
      }),
      viewingCarpet && React.createElement(CarpetDetailModal, {
        carpet: viewingCarpet,
        onClose: () => setViewingCarpet(null),
        onDelete: (carpet) => {
          setViewingCarpet(null);
          setDeletingCarpet(carpet);
        },
        onUpdate: updateCarpet,
      }),
      deletingCarpet && React.createElement(ConfirmDeleteModal, {
        carpet: deletingCarpet,
        onClose: () => setDeletingCarpet(null),
        onConfirmDelete: () => {
          deleteCarpet(deletingCarpet.id);
          setDeletingCarpet(null);
        },
      }),
      isSettingsModalOpen && React.createElement(SettingsModal, {
        onClose: () => setSettingsModalOpen(false),
        carpets: carpets,
        replaceAllCarpets: replaceAllCarpets,
      })
    )
  );
};

const Header: React.FC = () => {
  const { t } = useSettings();
  return React.createElement('header', { className: "bg-white/80 dark:bg-slate-800/70 backdrop-blur-lg sticky top-0 z-20 shadow-sm" },
    React.createElement('div', { className: "container mx-auto flex justify-center items-center p-4" },
      React.createElement('h1', { className: "text-2xl font-bold text-slate-900 dark:text-white" },
        t('appTitle')
      )
    )
  );
};

const BottomNavBar: React.FC<{
  showFavorites: boolean;
  onShowFavorites: (show: boolean) => void;
  isSearchVisible: boolean;
  onToggleSearch: () => void;
  onAdd: () => void;
  onMatch: () => void;
  onBarcodeScan: () => void;
  onSettings: () => void;
}> = (props) => {
    const { t } = useSettings();
    const [isFabMenuOpen, setFabMenuOpen] = useState(false);

    const fabActions = [
        { icon: Icons.WandSparkles, label: t('findMatch'), action: props.onMatch },
        { icon: Icons.QrCodeIcon, label: t('scanBarcode'), action: props.onBarcodeScan }
    ];

    const navItems = [
        { name: 'home', icon: Icons.HomeIcon, action: () => props.onShowFavorites(false), active: !props.showFavorites },
        { name: 'favorites', icon: Icons.HeartIcon, action: () => props.onShowFavorites(true), active: props.showFavorites },
        { name: 'add', icon: Icons.PlusIcon, action: props.onAdd, active: false },
        { name: 'search', icon: Icons.SearchIcon, action: props.onToggleSearch, active: props.isSearchVisible },
        { name: 'settings', icon: Icons.Cog6ToothIcon, action: props.onSettings, active: false }
    ];

    return React.createElement('footer', { className: 'fixed bottom-0 left-0 right-0 z-30' },
      // FAB extended menu
      React.createElement('div', { className: "absolute bottom-20 right-1/2 translate-x-1/2 flex flex-col items-center gap-3" },
          React.createElement(AnimatePresence, null, isFabMenuOpen &&
              fabActions.map((item, index) =>
                  React.createElement(motion.button, {
                      key: item.label,
                      onClick: () => { item.action(); setFabMenuOpen(false); },
                      initial: { opacity: 0, y: 20 },
                      animate: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: 20 },
                      transition: { duration: 0.2, delay: index * 0.05 },
                      className: "flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-lg hover:bg-slate-200 dark:hover:bg-slate-600",
                      title: item.label
                  }, React.createElement(item.icon, { className: "w-6 h-6" }))
              )
          )
      ),
      // Main Nav Bar
      React.createElement('div', { className: 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)]' },
          React.createElement('div', { className: 'container mx-auto flex justify-around items-center h-16' },
              navItems.map(item => {
                  if (item.name === 'add') {
                      return React.createElement('div', { key: item.name, className: '-mt-6' },
                          React.createElement(motion.button, {
                              // Fix: `onContextMenu` simulates long-press, `onTap` handles click. Removed redundant `onClick`.
                              onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); setFabMenuOpen(p => !p); },
                              onTap: () => { if (isFabMenuOpen) setFabMenuOpen(false); else item.action(); },
                              className: "w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform active:scale-95",
                              whileTap: { scale: 0.95 },
                              title: t('addCarpet') + ` (${t('longPressForMore')})`
                          },
                              React.createElement(motion.div, { animate: { rotate: isFabMenuOpen ? 45 : 0 } },
                                  React.createElement(item.icon, { className: "w-8 h-8" })
                              )
                          )
                      );
                  }
                  return React.createElement('button', {
                      key: item.name,
                      onClick: item.action,
                      className: `flex flex-col items-center justify-center w-16 h-16 transition-colors ${item.active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`
                  },
                      React.createElement(item.icon, { className: 'w-6 h-6' }),
                      React.createElement('span', { className: 'text-xs mt-1' }, t(item.name))
                  );
              })
          )
      )
    );
};

const SearchBar: React.FC<{ searchTerm: string, setSearchTerm: (term: string) => void }> = ({ searchTerm, setSearchTerm }) => {
  const { t } = useSettings();
  return React.createElement('div', { className: "relative" },
    React.createElement(Icons.SearchIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" }),
    React.createElement('input', {
      type: "text",
      placeholder: t('searchPlaceholder'),
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
    })
  );
};

const CarpetGrid: React.FC<{ carpets: Carpet[], onView: (carpet: Carpet) => void, onToggleFavorite: (id: string) => void }> = ({ carpets, onView, onToggleFavorite }) =>
  React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" },
    React.createElement(AnimatePresence, null,
      carpets.map(carpet =>
        React.createElement(motion.div, {
          key: carpet.id,
          layout: true,
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.8 },
          transition: { duration: 0.3 },
          className: "bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300 group",
          // Fix: Use `onTap` for framer-motion gesture handling, which is equivalent to `onClick`.
          onTap: () => onView(carpet)
        },
          React.createElement('div', { className: "relative" },
            React.createElement('img', { className: "w-full h-48 object-cover", src: carpet.imageUrl, alt: carpet.name }),
            React.createElement('button', {
              onClick: (e) => { e.stopPropagation(); onToggleFavorite(carpet.id); },
              className: "absolute top-2 right-2 p-2 bg-black/40 rounded-full text-white hover:bg-pink-500 transition-colors",
              title: carpet.isFavorite ? "Remove from favorites" : "Add to favorites"
            },
              React.createElement(Icons.HeartIcon, { className: `w-5 h-5 ${carpet.isFavorite ? 'fill-white' : 'fill-none'}` })
            )
          ),
          React.createElement('div', { className: "p-4" },
            React.createElement('h3', { className: "font-semibold text-lg truncate group-hover:text-blue-500" }, carpet.name),
            React.createElement('p', { className: "text-slate-500 dark:text-slate-400 text-sm" }, carpet.brand),
            React.createElement('p', { className: "font-bold text-lg mt-2" }, `$${carpet.price}`)
          )
        )
      )
    )
  );

const EmptyState: React.FC<{ onAdd: () => void, hasSearch: boolean }> = ({ onAdd, hasSearch }) => {
  const { t } = useSettings();
  return React.createElement('div', { className: "text-center py-20 px-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg" },
    React.createElement('h2', { className: "text-xl font-semibold mb-2" }, t('noCarpets')),
    !hasSearch && React.createElement('p', { className: "text-slate-500 dark:text-slate-400 mb-6" }, t('addFirstCarpet')),
    !hasSearch && React.createElement('button', {
        onClick: onAdd,
        className: "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700 mx-auto"
      },
        React.createElement(Icons.PlusIcon, { className: "w-5 h-5" }),
        React.createElement('span', null, t('addCarpet'))
    )
  );
};

const ModalWrapper: React.FC<{ onClose: () => void; title: string, className?: string, children: React.ReactNode }> = ({ children, onClose, title, className = 'max-w-md' }) =>
  React.createElement(motion.div, {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4",
    // Fix: Using `onTap` for framer-motion components to handle click/tap events consistently.
    onTap: onClose
  },
    React.createElement(motion.div, {
      initial: { scale: 0.9, y: 20 },
      animate: { scale: 1, y: 0 },
      exit: { scale: 0.9, y: 20 },
      transition: { type: 'spring', stiffness: 300, damping: 30 },
      className: `bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full overflow-hidden ${className}`,
      // Fix: Using `onTap` to prevent event propagation on the modal content.
      onTap: e => e.stopPropagation()
    },
      React.createElement('div', { className: "flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700" },
        React.createElement('h2', { className: "text-xl font-bold" }, title),
        React.createElement('button', { onClick: onClose, className: "p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" },
          React.createElement(Icons.XMarkIcon, { className: "w-6 h-6" })
        )
      ),
      children
    )
  );

const AddCarpetModal: React.FC<{
  onClose: () => void;
  onAddCarpet: (data: Partial<Carpet>, file: File) => Promise<Carpet>;
  getDetailsFromImage: (file: File) => Promise<Partial<Carpet>>;
}> = ({ onClose, onAddCarpet, getDetailsFromImage }) => {
  const { t } = useSettings();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [details, setDetails] = useState<Partial<Carpet>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isScanning) return;
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const scan = async () => {
      if (!('BarcodeDetector' in window)) {
        setError(t('barcodeApiNotSupported'));
        setIsScanning(false);
        return;
      }
      if (videoRef.current) {
        const barcodeDetector = new (window as any).BarcodeDetector();
        const checkBarcode = async () => {
          if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                setDetails(prev => ({...prev, barcodeId: barcodes[0].rawValue}));
                setIsScanning(false); // Stop scanning on success
              }
            } catch (e) {
                console.error("Barcode detection failed", e);
            }
          }
          if (isScanning) { // Check if still in scanning mode
             animationFrameId = requestAnimationFrame(checkBarcode);
          }
        };
        checkBarcode();
      }
    };

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          scan();
        }
      })
      .catch(err => {
        console.error("Camera error:", err);
        setError(t('cameraAccessDenied'));
        setIsScanning(false);
      });

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning, t]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Image size should be less than 10MB."); return; }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setDetails({});
    setError(null);
    setLoading(true);
    getDetailsFromImage(file).then(setDetails).catch(() => setError(t('analysisFailed'))).finally(() => setLoading(false));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: name === 'price' ? parseInt(value) || 0 : value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    setLoading(true);
    try {
      await onAddCarpet(details, imageFile);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add carpet.");
      setLoading(false);
    }
  };

  const fields: (keyof Carpet)[] = ['name', 'brand', 'model', 'price', 'size', 'pattern', 'texture', 'yarnType', 'type', 'description'];

  const renderForm = () => React.createElement('form', { onSubmit: handleSubmit },
    React.createElement('div', { className: "p-6 max-h-[70vh] overflow-y-auto" },
      !preview ? React.createElement('div', {
        className: "border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-10 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50",
        onClick: () => fileInputRef.current?.click()
      },
        React.createElement(Icons.CameraIcon, { className: "w-12 h-12 mx-auto text-slate-400 mb-2" }),
        React.createElement('p', { className: "font-semibold" }, t('uploadImage')),
        React.createElement('input', { type: "file", accept: "image/*", ref: fileInputRef, onChange: e => handleFileChange(e.target.files?.[0] || null), className: "hidden" })
      ) : React.createElement('div', null,
        React.createElement('img', { src: preview, alt: "Carpet preview", className: "w-full h-48 object-contain rounded-lg mb-4 bg-slate-100 dark:bg-slate-900" }),
        loading && React.createElement('div', { className: "flex items-center gap-2 text-blue-500" }, React.createElement(Icons.Spinner, { className: "w-5 h-5 animate-spin" }), t('analyzingImage')),
        error && React.createElement('div', { className: "text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg" }, error),
        React.createElement('div', { className: "mt-4 space-y-4" },
          React.createElement('div', { className: "p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" },
            React.createElement('label', { className: "block text-sm font-medium text-slate-600 dark:text-slate-300" }, t('barcodeId')),
            React.createElement('div', { className: "flex items-center justify-between gap-2 mt-1"},
              React.createElement('p', { className: "font-mono text-sm truncate" }, details.barcodeId || t('noBarcodeScanned')),
              React.createElement('button', { type: 'button', onClick: () => setIsScanning(true), className: 'flex items-center gap-2 px-3 py-1 text-sm rounded-md font-semibold bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-500'},
                React.createElement(Icons.BarcodeIcon, { className: 'w-4 h-4' }),
                t('scanProductBarcode')
              )
            )
          ),
          React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
            fields.map(field =>
              React.createElement('div', { key: field, className: field === 'description' ? 'sm:col-span-2' : '' },
                React.createElement('label', { htmlFor: field, className: "block text-sm font-medium text-slate-600 dark:text-slate-300 capitalize" }, t(field)),
                field === 'description'
                  ? React.createElement('textarea', { id: field, name: field, value: details[field] || '', onChange: handleInputChange, rows: 3, className: "mt-1 block w-full rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" })
                  : React.createElement('input', { type: field === 'price' ? 'number' : 'text', id: field, name: field, value: String(details[field] ?? ''), onChange: handleInputChange, className: "mt-1 block w-full rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" })
              )
            )
          )
        )
      )
    ),
    React.createElement('div', { className: "p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3" },
      React.createElement('button', { type: "button", onClick: onClose, className: "px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold" }, t('cancel')),
      React.createElement('button', { type: "submit", disabled: !imageFile || loading, className: "px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center gap-2" },
        loading && React.createElement(Icons.Spinner, { className: "w-5 h-5 animate-spin" }),
        t('save')
      )
    )
  );

  const renderScanner = () => React.createElement('div', { className: "p-4 relative" },
      React.createElement('video', { ref: videoRef, className: "w-full rounded-lg bg-black" }),
      React.createElement('div', { className: "absolute inset-0 flex items-center justify-center p-4"},
           React.createElement('div', { className: 'w-full h-1/3 border-4 border-dashed border-white/50 rounded-lg' })
      ),
      React.createElement('p', { className: "text-center mt-4 font-semibold" }, t('waitingForBarcode')),
      React.createElement('div', { className: "p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3" },
        React.createElement('button', { type: "button", onClick: () => setIsScanning(false), className: "px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold" }, t('cancel')),
      )
  );

  return React.createElement(ModalWrapper, {
    onClose,
    title: t('addCarpet'),
    className: "max-w-xl",
    children: isScanning ? renderScanner() : renderForm()
  });
};

const FindMatchModal: React.FC<{
  onClose: () => void;
  findMatchByImage: (file: File) => Promise<Carpet | null>;
  onViewMatch: (carpet: Carpet) => void;
}> = ({ onClose, findMatchByImage, onViewMatch }) => {
  const { t } = useSettings();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<Carpet | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
    setMatch(null);
    setLoading(true);
    try {
      const result = await findMatchByImage(file);
      if (result) { setMatch(result); } else { setError(t('noMatchFound')); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find a match.");
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(ModalWrapper, {
    onClose,
    title: t('findMatchingCarpet'),
    children: React.createElement('div', { className: "p-6" },
      !preview && React.createElement('div', { className: "text-center" },
        React.createElement('p', { className: "mb-4" }, t('uploadCarpetToMatch')),
        React.createElement('button', { onClick: () => fileInputRef.current?.click(), className: "px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold flex items-center gap-2 mx-auto" },
          React.createElement(Icons.CameraIcon, { className: "w-5 h-5" }),
          t('uploadImage')
        ),
        React.createElement('input', { type: "file", accept: "image/*", ref: fileInputRef, onChange: e => handleFileChange(e.target.files?.[0] || null), className: "hidden" })
      ),
      preview && React.createElement('div', null,
        React.createElement('img', { src: preview, alt: "Carpet to match", className: "w-full h-40 object-contain rounded-lg mb-4 bg-slate-100 dark:bg-slate-900" }),
        loading && React.createElement('div', { className: "flex items-center gap-2 text-blue-500" }, React.createElement(Icons.Spinner, { className: "w-5 h-5 animate-spin" }), t('findingMatch')),
        error && React.createElement('div', { className: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 p-3 rounded-lg" }, error),
        match && React.createElement('div', { className: "mt-4" },
          React.createElement('h3', { className: "font-semibold text-lg text-green-600 dark:text-green-400" }, t('matchFound')),
          React.createElement('p', null, t('thisIsTheBestMatch')),
          React.createElement('div', { className: "mt-2 p-2 border border-slate-300 dark:border-slate-700 rounded-lg flex items-center gap-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50", onClick: () => onViewMatch(match) },
            React.createElement('img', { src: match.imageUrl, alt: match.name, className: "w-16 h-16 object-cover rounded" }),
            React.createElement('div', null,
              React.createElement('p', { className: "font-bold" }, match.name),
              React.createElement('p', { className: "text-sm text-slate-500" }, match.brand)
            )
          )
        )
      )
    )
  });
};

const CarpetDetailModal: React.FC<{ carpet: Carpet, onClose: () => void, onDelete: (carpet: Carpet) => void, onUpdate: (carpet: Carpet) => void }> = ({ carpet, onClose, onDelete, onUpdate }) => {
  const { t } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCarpet, setEditedCarpet] = useState(carpet);

  useEffect(() => setEditedCarpet(carpet), [carpet]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedCarpet(prev => ({ ...prev, [name]: name === 'price' ? parseInt(value) || 0 : value }));
  }

  const handleSave = () => {
    onUpdate(editedCarpet);
    setIsEditing(false);
  }

  const fields: (keyof Carpet)[] = ['name', 'brand', 'model', 'price', 'size', 'pattern', 'texture', 'yarnType', 'type', 'description', 'barcodeId'];

  return React.createElement(ModalWrapper, {
    onClose,
    title: isEditing ? t('editCarpet') : t('carpetDetails'),
    className: "max-w-2xl",
    children: React.createElement('div', null,
      React.createElement('img', { className: "w-full h-64 object-cover", src: carpet.imageUrl, alt: carpet.name }),
      React.createElement('div', { className: "p-6 max-h-[50vh] overflow-y-auto" },
        isEditing ? React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
          fields.map(field =>
            React.createElement('div', { key: field, className: field === 'description' ? 'sm:col-span-2' : '' },
              React.createElement('label', { htmlFor: `edit-${field}`, className: "block text-sm font-medium text-slate-600 dark:text-slate-300 capitalize" }, t(field)),
              field === 'description'
                ? React.createElement('textarea', { id: `edit-${field}`, name: field, value: editedCarpet[field] || '', onChange: handleInputChange, rows: 3, className: "mt-1 block w-full rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" })
                : React.createElement('input', { type: field === 'price' ? 'number' : 'text', id: `edit-${field}`, name: field, value: String(editedCarpet[field] ?? ''), onChange: handleInputChange, className: "mt-1 block w-full rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" })
            )
          )
        ) : React.createElement(React.Fragment, null,
          React.createElement('h2', { className: "text-3xl font-bold" }, carpet.name),
          React.createElement('p', { className: "text-slate-500 dark:text-slate-400 mb-4" }, `${carpet.brand} - ${carpet.model}`),
          React.createElement('p', { className: "mb-4" }, carpet.description),
          React.createElement('div', { className: "grid grid-cols-2 gap-x-4 gap-y-2 text-sm" },
            fields.filter(f => !['name', 'brand', 'model', 'description'].includes(f)).map(field =>
              React.createElement('div', { key: field },
                React.createElement('span', { className: "font-semibold capitalize" }, `${t(field)}:`),
                React.createElement('span', { className: "ml-2 text-slate-600 dark:text-slate-300" }, String(carpet[field] || 'N/A'))
              )
            )
          )
        )
      ),
      React.createElement('div', { className: "p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center gap-2" },
        React.createElement('button', { onClick: () => onDelete(carpet), className: "px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 font-semibold flex items-center gap-2" },
          React.createElement(Icons.TrashIcon, { className: "w-5 h-5" }), ` ${t('delete')}`
        ),
        React.createElement('div', { className: "flex gap-2" },
          isEditing
            ? React.createElement(React.Fragment, null,
              React.createElement('button', { onClick: () => setIsEditing(false), className: "px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold" }, t('cancel')),
              React.createElement('button', { onClick: handleSave, className: "px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold" }, t('save'))
            )
            : React.createElement(React.Fragment, null,
              React.createElement('button', { onClick: onClose, className: "px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold" }, t('close')),
              React.createElement('button', { onClick: () => setIsEditing(true), className: "px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold" }, t('editCarpet'))
            )
        )
      )
    )
  });
};

const ConfirmDeleteModal: React.FC<{ carpet: Carpet, onClose: () => void, onConfirmDelete: () => void }> = ({ carpet, onClose, onConfirmDelete }) => {
  const { t } = useSettings();
  return React.createElement(ModalWrapper, {
    onClose,
    title: t('confirmDeleteTitle'),
    children: [
      React.createElement('div', { className: "p-6", key: 'content' },
        React.createElement('p', null, t('confirmDeleteMessage')),
        React.createElement('div', { className: "font-semibold my-4 p-2 bg-slate-100 dark:bg-slate-700 rounded text-center" }, carpet.name)
      ),
      React.createElement('div', { className: "p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3", key: 'actions' },
        React.createElement('button', { onClick: onClose, className: "px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold" }, t('cancel')),
        React.createElement('button', { onClick: onConfirmDelete, className: "px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold" }, t('delete'))
      )
    ]
  });
}

const SettingsModal: React.FC<{ onClose: () => void, carpets: Carpet[], replaceAllCarpets: (carpets: Carpet[]) => void }> = ({ onClose, carpets, replaceAllCarpets }) => {
  const { t, language, setLanguage, theme, setTheme } = useSettings();
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const jsonData = JSON.stringify(carpets, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hali-katalogu-yedek.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        const importedCarpets = JSON.parse(text as string);
        if(window.confirm(t('confirmImportMessage'))) {
            replaceAllCarpets(importedCarpets);
            onClose();
        }
      } catch (error) {
        alert(t('importFailedError'));
      }
    };
    reader.readAsText(file);
  };

  return React.createElement(ModalWrapper, {
    onClose,
    title: t('settings'),
    children: [
      React.createElement('div', { className: "p-6 divide-y divide-slate-200 dark:divide-slate-700", key: 'content' },
        React.createElement('div', { className: "pb-4" },
          React.createElement('label', { className: "block font-semibold mb-2" }, t('language')),
          React.createElement('select', { value: language, onChange: e => setLanguage(e.target.value as any), className: "w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none" },
            // Fix: Pass children as a separate argument to `React.createElement` for intrinsic elements
            // to potentially resolve type inference issues with props.
            React.createElement('option', { value: "en" }, "English"),
            React.createElement('option', { value: "tr" }, "Türkçe")
          )
        ),
        React.createElement('div', { className: "py-4" },
          React.createElement('label', { className: "block font-semibold mb-2" }, t('theme')),
          React.createElement('select', { value: theme, onChange: e => setTheme(e.target.value as any), className: "w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none" },
            // Fix: Pass children as a separate argument to `React.createElement` for intrinsic elements.
            React.createElement('option', { value: "light" }, t('light')),
            React.createElement('option', { value: "dark" }, t('dark'))
          )
        ),
        React.createElement('div', { className: "pt-4" },
          React.createElement('h3', { className: "font-semibold mb-2" }, t('dataManagement')),
          React.createElement('div', { className: "flex gap-4" },
              React.createElement('button', { onClick: handleExport, className: "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500" },
                  React.createElement(Icons.ArrowDownTrayIcon, { className: "w-5 h-5"}),
                  t('exportData')
              ),
              React.createElement('button', { onClick: handleImportClick, className: "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500" },
                  React.createElement(Icons.ArrowUpTrayIcon, { className: "w-5 h-5"}),
                  t('importData')
              ),
              React.createElement('input', { type: 'file', accept: '.json', ref: importInputRef, onChange: handleFileImport, className: "hidden" })
          )
        )
      ),
      React.createElement('div', { className: "p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end", key: 'actions' },
        React.createElement('button', { onClick: onClose, className: "px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700" }, t('close'))
      )
    ]
  });
};

const BarcodeScanModal: React.FC<{ onClose: () => void, onCarpetFound: (id: string) => void, carpets: Carpet[] }> = ({ onClose, onCarpetFound, carpets }) => {
    const { t } = useSettings();
    const [status, setStatus] = useState(t('startingCamera'));
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let animationFrameId: number;
        let stream: MediaStream | null = null;

        const scan = async () => {
            if (!('BarcodeDetector' in window)) {
                setStatus(t('barcodeApiNotSupported'));
                return;
            }
            if (videoRef.current) {
                const barcodeDetector = new (window as any).BarcodeDetector();

                const checkBarcode = async () => {
                    if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
                        try {
                            const barcodes = await barcodeDetector.detect(videoRef.current);
                            if (barcodes.length > 0) {
                                const barcodeValue = barcodes[0].rawValue;
                                const foundCarpet = carpets.find(c => c.barcodeId === barcodeValue);
                                if (foundCarpet) {
                                    onCarpetFound(foundCarpet.id);
                                } else {
                                    setStatus(t('barcodeNotFoundInCatalog'));
                                    setTimeout(() => setStatus(t('waitingForBarcode')), 2000);
                                }
                            }
                        } catch (e) {
                            console.error("Barcode detection failed", e);
                        }
                    }
                    animationFrameId = requestAnimationFrame(checkBarcode);
                };
                checkBarcode();
            }
        };

        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(s => {
                stream = s;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                    setStatus(t('waitingForBarcode'));
                    scan();
                }
            })
            .catch(err => {
                console.error("Camera error:", err);
                setStatus(t('cameraAccessDenied'));
            });

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [carpets, onCarpetFound, t]);

    return React.createElement(ModalWrapper, {
      onClose,
      title: t('scanBarcode'),
      children: React.createElement('div', { className: "p-4 relative" },
            React.createElement('video', { ref: videoRef, className: "w-full rounded-lg bg-black" }),
            React.createElement('div', { className: "absolute inset-0 flex items-center justify-center p-4"},
                 React.createElement('div', { className: 'w-full h-1/3 border-4 border-dashed border-white/50 rounded-lg' })
            ),
            React.createElement('p', { className: "text-center mt-4 font-semibold" }, status)
        )
    });
};

export default App;
