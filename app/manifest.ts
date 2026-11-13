import type { MetadataRoute } from 'next'
import { APP_DESCRIPTION, APP_NAME } from '@/lib/app'

/** Permite instalar la app en el celular ("Agregar a pantalla de inicio"). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#0e0e13',
    theme_color: '#0e0e13',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  }
}
