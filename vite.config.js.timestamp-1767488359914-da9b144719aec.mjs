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
      protocol: "ws"
    },
    watch: { usePolling: true, interval: 100 }
  } : void 0
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvdmFyL3d3d1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Zhci93d3cvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Zhci93d3cvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBsYXJhdmVsIGZyb20gJ2xhcmF2ZWwtdml0ZS1wbHVnaW4nO1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgbGFyYXZlbCh7XG4gICAgICAgICAgICBpbnB1dDogJ3Jlc291cmNlcy9qcy9hcHAuanMnLFxuICAgICAgICAgICAgcmVmcmVzaDogZmFsc2UsIC8vIHNpbiBITVIgZW4gcHJvZHVjY2lcdTAwRjNuXG4gICAgICAgIH0pLFxuICAgICAgICB2dWUoKSxcbiAgICBdLFxuICAgIGJ1aWxkOiB7XG4gICAgICAgIG91dERpcjogJ3B1YmxpYy9idWlsZCcsXG4gICAgICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgICAgICBtYW5pZmVzdDogdHJ1ZSxcbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgaW5wdXQ6ICdyZXNvdXJjZXMvanMvYXBwLmpzJyxcbiAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgIGRpcjogJ3B1YmxpYy9idWlsZCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICAvLyBDb25maWd1cmFjaVx1MDBGM24gcGFyYSBhc3NldHMgZXN0XHUwMEUxdGljb3NcbiAgICAgICAgYXNzZXRzRGlyOiAnYXNzZXRzJyxcbiAgICAgICAgYXNzZXRzSW5saW5lTGltaXQ6IDAsXG4gICAgfSxcbiAgICBiYXNlOiAnL2J1aWxkLycsXG4gICAgc2VydmVyOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnID8ge1xuICAgICAgICBob3N0OiAnMC4wLjAuMCcsXG4gICAgICAgIHBvcnQ6IDUxNzMsXG4gICAgICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgICAgIGhtcjoge1xuICAgICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3dzJyxcbiAgICAgICAgfSxcbiAgICAgICAgd2F0Y2g6IHsgdXNlUG9sbGluZzogdHJ1ZSwgaW50ZXJ2YWw6IDEwMCB9LFxuICAgIH0gOiB1bmRlZmluZWQsXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBNLFNBQVMsb0JBQW9CO0FBQ3ZPLE9BQU8sYUFBYTtBQUNwQixPQUFPLFNBQVM7QUFFaEIsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN2QyxTQUFTO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDSixPQUFPO0FBQUEsTUFDUCxTQUFTO0FBQUE7QUFBQSxJQUNiLENBQUM7QUFBQSxJQUNELElBQUk7QUFBQSxFQUNSO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDSCxRQUFRO0FBQUEsSUFDUixhQUFhO0FBQUEsSUFDYixVQUFVO0FBQUEsSUFDVixlQUFlO0FBQUEsTUFDWCxPQUFPO0FBQUEsTUFDUCxRQUFRO0FBQUEsUUFDSixLQUFLO0FBQUEsTUFDVDtBQUFBLElBQ0o7QUFBQTtBQUFBLElBRUEsV0FBVztBQUFBLElBQ1gsbUJBQW1CO0FBQUEsRUFDdkI7QUFBQSxFQUNBLE1BQU07QUFBQSxFQUNOLFFBQVEsU0FBUyxnQkFBZ0I7QUFBQSxJQUM3QixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsTUFDRCxNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsSUFDZDtBQUFBLElBQ0EsT0FBTyxFQUFFLFlBQVksTUFBTSxVQUFVLElBQUk7QUFBQSxFQUM3QyxJQUFJO0FBQ1IsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
