import './globals.css';
import type { Metadata } from 'next';
import { AntdProvider } from './providers';

export const metadata: Metadata = {
  title: 'Rumbo Fino - Backoffice Web Administrativo',
  description: 'Consola web de gestión de flota ejecutiva, expedientes digitales, turnos y despacho para Rumbo Fino.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-executive-dark text-slate-100 min-h-screen">
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
