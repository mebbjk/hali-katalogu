import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { ToastProvider } from './src/contexts/ToastContext';
import './src/index.css';

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