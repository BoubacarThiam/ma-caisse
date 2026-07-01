import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En développement, XAMPP sert PHP sur localhost:80.
// Vite proxifie /backend/* vers XAMPP pour éviter les problèmes CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/backend': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
  // En production sur hébergement mutualisé, l'app est dans un sous-dossier
  // Modifier la valeur de `base` si nécessaire (ex: '/ma-caisse/')
  base: '/',
})
