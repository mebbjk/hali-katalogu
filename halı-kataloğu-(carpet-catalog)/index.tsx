import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';

const rootElement = document.getElementById('root');

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <SettingsProvider>
                <ToastProvider>
                    <App />
                </ToastProvider>
            </SettingsProvider>
        </React.StrictMode>
    );
}
