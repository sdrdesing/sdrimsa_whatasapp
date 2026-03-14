import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.js'],
            refresh: true,
        }),
        vue(),
    ],

    build: {
        outDir: 'public/build',
        emptyOutDir: true,
        manifest: true,
        assetsDir: 'assets',
    },

    server: {
        host: '0.0.0.0', // para docker
        port: 5173,
        strictPort: true,

        hmr: {
            host: 'localhost', // lo que usará el navegador
        },

        watch: {
            usePolling: true,
        },
    },
})