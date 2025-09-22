// src/app/page.tsx
import { Metadata } from 'next';
import RadioPlayer from '@/components/RadioPlayer';

export const metadata: Metadata = {
  title: 'Radio Exitosa - La Voz que Integra al Perú',
  description: 'Escucha Radio Exitosa en vivo, la estación líder en noticias, información y debate en todo Perú. La Voz que Integra al Perú.',
};

export default function Home() {
  return <RadioPlayer />;
}