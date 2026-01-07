// vite.config.js
import { defineConfig } from "file:///var/www/node_modules/vite/dist/node/index.js";
import laravel from "file:///var/www/node_modules/laravel-vite-plugin/dist/index.js";
import vue from "file:///var/www/node_modules/@vitejs/plugin-vue/dist/index.mjs";
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    laravel({
      input: "resources/js/app.js",
      refresh: false
      // sin HMR en producción
    }),
    vue()
  ],
  build: {
    outDir: "public/build",
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: "resources/js/app.js",
      output: {
        dir: "public/build"
      }
    },
    // Configuración para assets estáticos
    assetsDir: "assets",
    assetsInlineLimit: 0
  },
  base: "/build/",
  server: mode === "development" ? {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "localhost",
      port: 5173,
      protocol: "ws"
    },
    watch: { usePolling: true, interval: 100 }
  } : void 0
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvdmFyL3d3d1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Zhci93d3cvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Zhci93d3cvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBsYXJhdmVsIGZyb20gJ2xhcmF2ZWwtdml0ZS1wbHVnaW4nO1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgbGFyYXZlbCh7XG4gICAgICAgICAgICBpbnB1dDogJ3Jlc291cmNlcy9qcy9hcHAuanMnLFxuICAgICAgICAgICAgcmVmcmVzaDogZmFsc2UsIC8vIHNpbiBITVIgZW4gcHJvZHVjY2lcdTAwRjNuXG4gICAgICAgIH0pLFxuICAgICAgICB2dWUoKSxcbiAgICBdLFxuICAgIGJ1aWxkOiB7XG4gICAgICAgIG91dERpcjogJ3B1YmxpYy9idWlsZCcsXG4gICAgICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgICAgICBtYW5pZmVzdDogdHJ1ZSxcbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgaW5wdXQ6ICdyZXNvdXJjZXMvanMvYXBwLmpzJyxcbiAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgIGRpcjogJ3B1YmxpYy9idWlsZCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICAvLyBDb25maWd1cmFjaVx1MDBGM24gcGFyYSBhc3NldHMgZXN0XHUwMEUxdGljb3NcbiAgICAgICAgYXNzZXRzRGlyOiAnYXNzZXRzJyxcbiAgICAgICAgYXNzZXRzSW5saW5lTGltaXQ6IDAsXG4gICAgfSxcbiAgICBiYXNlOiAnL2J1aWxkLycsXG4gICAgc2VydmVyOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnID8ge1xuICAgICAgICBob3N0OiAnMC4wLjAuMCcsXG4gICAgICAgIHBvcnQ6IDUxNzMsXG4gICAgICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgICAgIGhtcjoge1xuICAgICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAgICBwb3J0OiA1MTczLFxuICAgICAgICAgICAgcHJvdG9jb2w6ICd3cycsXG4gICAgICAgIH0sXG4gICAgICAgIHdhdGNoOiB7IHVzZVBvbGxpbmc6IHRydWUsIGludGVydmFsOiAxMDAgfSxcbiAgICB9IDogdW5kZWZpbmVkLFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwTSxTQUFTLG9CQUFvQjtBQUN2TyxPQUFPLGFBQWE7QUFDcEIsT0FBTyxTQUFTO0FBRWhCLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDdkMsU0FBUztBQUFBLElBQ0wsUUFBUTtBQUFBLE1BQ0osT0FBTztBQUFBLE1BQ1AsU0FBUztBQUFBO0FBQUEsSUFDYixDQUFDO0FBQUEsSUFDRCxJQUFJO0FBQUEsRUFDUjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0gsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsVUFBVTtBQUFBLElBQ1YsZUFBZTtBQUFBLE1BQ1gsT0FBTztBQUFBLE1BQ1AsUUFBUTtBQUFBLFFBQ0osS0FBSztBQUFBLE1BQ1Q7QUFBQSxJQUNKO0FBQUE7QUFBQSxJQUVBLFdBQVc7QUFBQSxJQUNYLG1CQUFtQjtBQUFBLEVBQ3ZCO0FBQUEsRUFDQSxNQUFNO0FBQUEsRUFDTixRQUFRLFNBQVMsZ0JBQWdCO0FBQUEsSUFDN0IsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osS0FBSztBQUFBLE1BQ0QsTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLElBQ2Q7QUFBQSxJQUNBLE9BQU8sRUFBRSxZQUFZLE1BQU0sVUFBVSxJQUFJO0FBQUEsRUFDN0MsSUFBSTtBQUNSLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
