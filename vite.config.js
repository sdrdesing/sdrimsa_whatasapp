import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
    return {
        plugins: [
            laravel({
                input: 'resources/js/app.js',
                refresh: false, // no necesita HMR en producción
            }),
            vue({
                template: {
                    transformAssetUrls: {
                        base: null,
                        includeAbsolute: false,
                    },
                },
            }),
        ],
        build: {
            outDir: 'public/build',  // carpeta donde se generan los assets
            emptyOutDir: true,
            manifest: true,           // Vite genera manifest.json para Laravel
            rollupOptions: {
                input: 'resources/js/app.js', // tu entry point
            },
        },
        base: '/build/', // muy importante: permite que Laravel/Nginx encuentre los assets
        server: mode === 'development' ? {
            host: '0.0.0.0',
            port: 5173,
            strictPort: true,
            hmr: {
                host: 'localhost',
                protocol: 'ws',
            },
            watch: {
                usePolling: true,
                interval: 100,
            },
        } : undefined,
    };
});
