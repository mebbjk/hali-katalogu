import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Corrected the import path for the App component to point to the actual component in the src directory.
import App from './src/App';
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