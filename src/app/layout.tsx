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
  icons: {
    // Usar el favicon de Exitosa Noticias
    icon: [
      {
        url: 'https://statics.exitosanoticias.pe/exitosa/img/global/favicon.png',
        type: 'image/png'
      }
    ],
    // Para dispositivos Apple
    apple: [
      {
        url: 'https://statics.exitosanoticias.pe/exitosa/img/global/favicon.png',
        sizes: '180x180'
      }
    ],
    // Para Android
    other: [
      {
        url: 'https://statics.exitosanoticias.pe/exitosa/img/global/favicon.png',
        sizes: '192x192',
        type: 'image/png'
      }
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
      <head>
        {/* Favicon adicional como link tag para mayor compatibilidad */}
        <link rel="icon" href="https://statics.exitosanoticias.pe/exitosa/img/global/favicon.png" />
        <link rel="shortcut icon" href="https://statics.exitosanoticias.pe/exitosa/img/global/favicon.png" />
      </head>
      <body className={inter.className}>
        <StationProvider>
          {children}
        </StationProvider>
      </body>
    </html>
  );
}