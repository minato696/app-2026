import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { StationProvider } from '@/contexts/StationContext';

const inter = Inter({ subsets: ['latin'] });

// Configuración de viewport separada
export const viewport: Viewport = {
  themeColor: '#D70007', // Color rojo de Radio Exitosa
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: '%s | La Voz que Integra al Perú',
    default: 'Radio Exitosa - La Voz que Integra al Perú',
  },
  description: 'Radio Exitosa, la estación de radio líder en noticias, información y debate en Perú. La Voz que Integra al Perú.',
  keywords: 'radio, Perú, emisora, Radio Exitosa, noticias, información, debate, actualidad, FM, La Voz que Integra al Perú',
  authors: [{ name: 'Radio Exitosa' }],
  creator: 'Radio Exitosa',
  publisher: 'Radio Exitosa',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Establecer metadataBase para imágenes de Open Graph y Twitter
  metadataBase: new URL('http://192.168.10.230:9544'),
  icons: {
    // Definir todos los favicons necesarios
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    // Para dispositivos Apple
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' }
    ],
    // Para Android
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ]
  },
  // Open Graph para compartir en redes sociales
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: 'https://radioexitosa.pe/',
    siteName: 'Radio Exitosa',
    title: 'Radio Exitosa - La Voz que Integra al Perú',
    description: 'Escucha Radio Exitosa en vivo - La Voz que Integra al Perú - Noticias, información y debate en todo el Perú',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Radio Exitosa - La Voz que Integra al Perú',
      }
    ],
  },
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Radio Exitosa - La Voz que Integra al Perú',
    description: 'Escucha Radio Exitosa en vivo - La Voz que Integra al Perú - Noticias, información y debate en todo el Perú',
    images: ['/twitter-image.jpg'],
    creator: '@radioexitosa',
  },
  // Añadir manifest
  manifest: '/manifest.json',
  // Verificaciones de propiedad de sitio web (si es necesario)
  verification: {
    google: 'tu-código-de-verificación-google',
    // Otros verificadores: yandex, bing, etc.
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <StationProvider>
          {children}
        </StationProvider>
      </body>
    </html>
  );
}