export type Language = 'en' | 'tr';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // General
    'appTitle': 'Carpet Catalog',
    'loading': 'Loading...',
    'error': 'An error occurred',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'confirm': 'Confirm',
    'close': 'Close',
    'editCarpet': 'Edit Carpet',
    'searchPlaceholder': 'Search by name, brand, or barcode...',
    'noCarpets': 'No carpets found.',
    'addFirstCarpet': 'Add your first carpet to get started!',
    'longPressForMore': 'Long press for more options',
    'home': 'Home',
    'search': 'Search',
    'add': 'Add',

    // Add/Edit Carpet
    'addCarpet': 'Add Carpet',
    'findMatch': 'Find Match',
    'scanBarcode': 'Scan Barcode',
    'uploadImage': 'Upload an Image',
    'or': 'OR',
    'dropImage': 'Drop image here',
    'analyzingImage': 'Analyzing image with AI... This may take a moment.',
    'analysisFailed': 'AI analysis failed. Please fill in the details manually.',
    'fillDetails': 'Please fill in the carpet details:',
    'name': 'Name',
    'brand': 'Brand',
    'model': 'Model',
    'price': 'Price',
    'size': 'Size',
    'pattern': 'Pattern',
    'texture': 'Texture',
    'yarnType': 'Yarn Type',
    'type': 'Type',
    'description': 'Description',
    'barcodeId': 'Barcode ID',

    // Carpet Details
    'carpetDetails': 'Carpet Details',
    'addedOn': 'Added on',

    // Find Match
    'findMatchingCarpet': 'Find Matching Carpet',
    'uploadCarpetToMatch': 'Upload an image of a carpet to find a match in your catalog.',
    'findingMatch': 'Searching for a match using AI...',
    'matchFound': 'Match Found!',
    'noMatchFound': 'No suitable match was found in your catalog.',
    'thisIsTheBestMatch': 'This seems to be the best match:',

    // Barcode Scanning
    'scanProductBarcode': 'Scan Product Barcode',
    'noBarcodeScanned': 'No barcode scanned.',
    'startingCamera': 'Starting camera...',
    'waitingForBarcode': 'Waiting for Barcode...',
    'barcodeNotFoundInCatalog': 'This barcode does not match any carpet in your catalog.',
    'cameraAccessDenied': 'Camera access was denied. Please enable it in your browser settings.',
    'barcodeApiNotSupported': 'Barcode scanning is not supported by your browser.',

    // Settings
    'settings': 'Settings',
    'language': 'Language',
    'theme': 'Theme',
    'light': 'Light',
    'dark': 'Dark',
    'dataManagement': 'Data Management',
    'exportData': 'Export Data (Backup)',
    'importData': 'Import Data (Restore)',
    'confirmImportMessage': 'Are you sure? Importing a new file will overwrite all your current carpet data. This action cannot be undone.',
    'importFailedError': 'Import failed. The file might be corrupted or in the wrong format.',

    // Favorite
    'addToFavorites': 'Add to favorites',
    'removeFromFavorites': 'Remove from favorites',
    'favorites': 'Favorites',
    'showAll': 'Show All',
    'showFavorites': 'Show Favorites Only',
    
    // Delete Confirmation
    'confirmDeleteTitle': 'Are you sure?',
    'confirmDeleteMessage': 'Are you sure you want to delete this carpet? This action cannot be undone.'
  },
  tr: {
    // General
    'appTitle': 'Halı Kataloğu',
    'loading': 'Yükleniyor...',
    'error': 'Bir hata oluştu',
    'save': 'Kaydet',
    'cancel': 'İptal',
    'delete': 'Sil',
    'confirm': 'Onayla',
    'close': 'Kapat',
    'editCarpet': 'Halıyı Düzenle',
    'searchPlaceholder': 'İsim, marka veya barkoda göre ara...',
    'noCarpets': 'Hiç halı bulunamadı.',
    'addFirstCarpet': 'Başlamak için ilk halınızı ekleyin!',
    'longPressForMore': 'Daha fazla seçenek için uzun basın',
    'home': 'Ana Sayfa',
    'search': 'Ara',
    'add': 'Ekle',


    // Add/Edit Carpet
    'addCarpet': 'Halı Ekle',
    'findMatch': 'Eşleşeni Bul',
    'scanBarcode': 'Barkod ile Tara',
    'uploadImage': 'Bir Resim Yükle',
    'or': 'VEYA',
    'dropImage': 'Resmi buraya bırakın',
    'analyzingImage': 'Resim yapay zeka ile analiz ediliyor... Bu biraz zaman alabilir.',
    'analysisFailed': 'Yapay zeka analizi başarısız oldu. Lütfen detayları manuel olarak doldurun.',
    'fillDetails': 'Lütfen halı detaylarını doldurun:',
    'name': 'İsim',
    'brand': 'Marka',
    'model': 'Model',
    'price': 'Fiyat',
    'size': 'Boyut',
    'pattern': 'Desen',
    'texture': 'Doku',
    'yarnType': 'İplik Tipi',
    'type': 'Tip',
    'description': 'Açıklama',
    'barcodeId': 'Barkod Numarası',

    // Carpet Details
    'carpetDetails': 'Halı Detayları',
    'addedOn': 'Eklenme tarihi',

    // Find Match
    'findMatchingCarpet': 'Benzer Halıyı Bul',
    'uploadCarpetToMatch': 'Kataloğunuzda bir eşleşme bulmak için bir halı resmi yükleyin.',
    'findingMatch': 'Yapay zeka kullanılarak eşleşme aranıyor...',
    'matchFound': 'Eşleşme Bulundu!',
    'noMatchFound': 'Kataloğunuzda uygun bir eşleşme bulunamadı.',
    'thisIsTheBestMatch': 'En iyi eşleşme bu gibi görünüyor:',

    // Barcode Scanning
    'scanProductBarcode': 'Ürün Barkodunu Tara',
    'noBarcodeScanned': 'Barkod okutulmadı.',
    'startingCamera': 'Kamera başlatılıyor...',
    'waitingForBarcode': 'Barkod bekleniyor...',
    'barcodeNotFoundInCatalog': 'Bu barkod kataloğunuzdaki hiçbir halıyla eşleşmiyor.',
    'cameraAccessDenied': 'Kamera erişimine izin verilmedi. Lütfen tarayıcı ayarlarınızdan izin verin.',
    'barcodeApiNotSupported': 'Barkod okuma özelliği tarayıcınız tarafından desteklenmiyor.',

    // Settings
    'settings': 'Ayarlar',
    'language': 'Dil',
    'theme': 'Tema',
    'light': 'Açık',
    'dark': 'Koyu',
    'dataManagement': 'Veri Yönetimi',
    'exportData': 'Verileri Dışa Aktar (Yedekle)',
    'importData': 'İçe Aktar (Yedeği Geri Yükle)',
    'confirmImportMessage': 'Emin misiniz? Yeni bir dosya içe aktarmak mevcut tüm halı verilerinizin üzerine yazacaktır. Bu işlem geri alınamaz.',
    'importFailedError': 'İçe aktarma başarısız. Dosya bozuk veya yanlış formatta olabilir.',

    // Favorite
    'addToFavorites': 'Favorilere ekle',
    'removeFromFavorites': 'Favorilerden kaldır',
    'favorites': 'Favoriler',
    'showAll': 'Tümünü Göster',
    'showFavorites': 'Sadece Favorileri Göster',

    // Delete Confirmation
    'confirmDeleteTitle': 'Emin misiniz?',
    'confirmDeleteMessage': 'Bu halıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
  }
};