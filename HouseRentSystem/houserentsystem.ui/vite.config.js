import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 56127,
        //proxy: {
        //    '/weatherforecast': {
        //        target: 'https://localhost:7194', // http://localhost:5286
        //        changeOrigin: true,
        //        rewrite: (path) => path,
        //    },
        //},
    },
});