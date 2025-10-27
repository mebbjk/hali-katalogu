// FIX: Using direct imports for type definitions to ensure they are loaded by TypeScript.
// This can resolve issues where triple-slash reference directives are not being processed
// correctly due to project configuration problems (e.g., in tsconfig.json).
import 'vite/client';
import 'vite-plugin-pwa/client';
