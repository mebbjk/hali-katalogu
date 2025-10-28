// FIX: Import the Language type from the central types file.
import type { Language } from '../types';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // General
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'loading': 'Loading...',
    'error': 'An error occurred',
    'no_carpets_found': 'No carpets found.',
    'confirm_delete': 'Are you sure you want to delete',
    'yes_delete': 'Yes, Delete',
    'no_photo': 'No Photo',
    
    // Tabs & Titles
    'app_title': 'Carpet Catalog',
    'home': 'Home',
    'favorites': 'Favorites',
    'search': 'Search',
    'settings': 'Settings',
    'edit_carpet': 'Edit Carpet',
    'add_carpet': 'Add Carpet',
    'language': 'Language',
    'theme': 'Theme',
    'light': 'Light',
    'dark': 'Dark',
    
    // Search View
    'search_by_text': 'Search by name, brand, code...',
    'scan_barcode_qr': 'Scan Barcode / QR',

    // Carpet Properties
    'name': 'Name',
    'brand': 'Brand',
    'model': 'Model',
    'price': 'Price',
    'size': 'Size',
    'pattern': 'Pattern',
    'texture': 'Texture',
    'yarn_type': 'Yarn Type',
    'type': 'Type',
    'description': 'Description',
    'barcodeId': 'Barcode ID',
    'qrCodeId': 'QR Code ID',
    
    // Carpet Form
    'take_photo': 'Take Photo',
    'select_from_gallery': 'From Gallery',
    'analyzing_image': 'Analyzing...',
    'ai_fill_details': 'Fill Details with AI',
    'fixed_sizes': 'Standard Sizes',
    'custom_size': 'Custom Size (e.g., 100x200 cm)',
    'custom_yarn_type': 'Custom Yarn Type',
    'add_yarn_type': 'Add Type',

    // Import/Export
    'import_export_data': 'Import / Export Data',
    'export_data': 'Export Data',
    'import_data': 'Import Data',
    'import_warning': 'This will replace all your current data. Are you sure?',
    'toast_import_error': 'Failed to import data. Invalid file format.',
    
    // Toasts & Messages
    'toast_carpet_added': 'Carpet added successfully!',
    'toast_carpet_updated': 'Carpet updated successfully!',
    'toast_carpet_deleted': 'Carpet deleted.',
    'toast_import_success': 'Data imported successfully!',
    'toast_export_success': 'Data exported successfully!',
    'toast_ai_error': 'AI analysis failed.',
    'toast_generic_error': 'An unexpected error occurred.',
    'scan_success': 'Scan successful',
    'scan_error': 'Could not read a code from the image.',
    'toast_ai_fill_success': 'Details filled by AI!',
    'toast_image_required': 'Please select an image first.',
    'toast_new_carpet_image_required': 'An image is required for a new carpet.',
  },
  tr: {
    // General
    'save': 'Kaydet',
    'cancel': 'İptal',
    'delete': 'Sil',
    'edit': 'Düzenle',
    'add': 'Ekle',
    'loading': 'Yükleniyor...',
    'error': 'Bir hata oluştu',
    'no_carpets_found': 'Hiç halı bulunamadı.',
    'confirm_delete': 'Bu halıyı silmek istediğinizden emin misiniz:',
    'yes_delete': 'Evet, Sil',
    'no_photo': 'Fotoğraf Yok',

    // Tabs & Titles
    'app_title': 'Halı Kataloğu',
    'home': 'Ana Sayfa',
    'favorites': 'Favoriler',
    'search': 'Ara',
    'settings': 'Ayarlar',
    'edit_carpet': 'Halıyı Düzenle',
    'add_carpet': 'Halı Ekle',
    'language': 'Dil',
    'theme': 'Tema',
    'light': 'Açık',
    'dark': 'Koyu',
    
    // Search View
    'search_by_text': 'İsim, marka, kod ile ara...',
    'scan_barcode_qr': 'Barkod / QR Tara',

    // Carpet Properties
    'name': 'İsim',
    'brand': 'Marka',
    'model': 'Model',
    'price': 'Fiyat',
    'size': 'Boyut',
    'pattern': 'Desen',
    'texture': 'Doku',
    'yarn_type': 'İplik Türü',
    'type': 'Tür',
    'description': 'Açıklama',
    'barcodeId': 'Barkod ID',
    'qrCodeId': 'QR Kod ID',
    
    // Carpet Form
    'take_photo': 'Fotoğraf Çek',
    'select_from_gallery': 'Galeriden Seç',
    'analyzing_image': 'Analiz ediliyor...',
    'ai_fill_details': 'Detayları YZ ile Doldur',
    'fixed_sizes': 'Standart Boyutlar',
    'custom_size': 'Özel Boyut (örn: 100x200 cm)',
    'custom_yarn_type': 'Özel İplik Türü',
    'add_yarn_type': 'Tür Ekle',

    // Import/Export
    'import_export_data': 'Veri İçe / Dışa Aktar',
    'export_data': 'Veriyi Dışa Aktar',
    'import_data': 'Veri İçe Aktar',
    'import_warning': 'Bu, mevcut tüm verilerinizi değiştirecektir. Emin misiniz?',
    'toast_import_error': 'Veri içe aktarılamadı. Geçersiz dosya formatı.',
    
    // Toasts & Messages
    'toast_carpet_added': 'Halı başarıyla eklendi!',
    'toast_carpet_updated': 'Halı başarıyla güncellendi!',
    'toast_carpet_deleted': 'Halı silindi.',
    'toast_import_success': 'Veri başarıyla içe aktarıldı!',
    'toast_export_success': 'Veri başarıyla dışa aktarıldı!',
    'toast_ai_error': 'YZ analizi başarısız oldu.',
    'toast_generic_error': 'Beklenmedik bir hata oluştu.',
    'scan_success': 'Tarama başarılı',
    'scan_error': 'Resimden bir kod okunamadı.',
    'toast_ai_fill_success': 'Detaylar YZ ile başarıyla dolduruldu!',
    'toast_image_required': 'Lütfen önce bir resim seçin.',
    'toast_new_carpet_image_required': 'Yeni halı için bir resim gereklidir.',
  },
};
