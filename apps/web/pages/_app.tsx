import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ToasterProvider, Toaster } from '../components/ui/sonner';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToasterProvider>
      <Component {...pageProps} />
      <Toaster />
    </ToasterProvider>
  );
}
