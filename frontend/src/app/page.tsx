'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/disciplinas');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-jojo-gold font-jojo text-4xl animate-menacing">
        ゴゴゴ CARREGANDO... ゴゴゴ
      </div>
    </div>
  );
}
