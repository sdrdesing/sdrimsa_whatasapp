import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => ({
    plugins: [
        laravel({
            input: 'resources/js/app.js',
            refresh: false, // sin HMR en producción
        }),
        vue(),
    ],
    build: {
        outDir: 'public/build',
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: 'resources/js/app.js',
            output: {
                dir: 'public/build',
            },
        },
        // Configuración para assets estáticos
        assetsDir: 'assets',
        assetsInlineLimit: 0,
    },
    base: '/build/',
    server: mode === 'development' ? {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        hmr: {
            host: 'localhost',
            protocol: 'ws',
        },
        watch: { usePolling: true, interval: 100 },
    } : undefined,
}));
