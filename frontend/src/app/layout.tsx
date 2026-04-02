import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Faltar - Controle de Faltas',
  description: 'Controle suas faltas na faculdade com estilo!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-body text-white min-h-screen">{children}</body>
    </html>
  );
}
