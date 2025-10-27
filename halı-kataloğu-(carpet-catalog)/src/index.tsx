import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <StrictMode>
            <SettingsProvider>
                <ToastProvider>
                    <App />
                </ToastProvider>
            </SettingsProvider>
        </StrictMode>
    );
}