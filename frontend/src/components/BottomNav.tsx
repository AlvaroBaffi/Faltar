'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-jojo-dark to-purple-900/95 border-t-2 border-jojo-gold/30 backdrop-blur-sm z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        <button
          onClick={() => router.push('/disciplinas')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${
            pathname === '/disciplinas'
              ? 'text-jojo-gold scale-110'
              : 'text-purple-400 hover:text-purple-200'
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-xs font-jojo mt-1">Matérias</span>
        </button>

        <button
          onClick={() => router.push('/calendario')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${
            pathname === '/calendario'
              ? 'text-jojo-gold scale-110'
              : 'text-purple-400 hover:text-purple-200'
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-jojo mt-1">Calendário</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center p-2 rounded-xl text-purple-400 hover:text-red-400 transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs font-jojo mt-1">Sair</span>
        </button>
      </div>
    </nav>
  );
}
