'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    universidade: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.auth.register(form);
        localStorage.setItem('token', res.access_token);
      } else {
        const res = await api.auth.login({ email: form.email, senha: form.senha });
        localStorage.setItem('token', res.access_token);
      }
      router.push('/disciplinas');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 speed-lines">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-jojo text-6xl text-jojo-gold drop-shadow-lg tracking-wider mb-2 relative inline-block menacing">
            FALTAR!
          </h1>
          <p className="text-purple-300 font-body text-lg">
            Controle suas faltas com o poder de um Stand!
          </p>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-b from-purple-900/80 to-jojo-dark/90 backdrop-blur-sm border-2 border-jojo-gold/30 rounded-2xl p-6 shadow-2xl shadow-purple-900/50">
          <h2 className="font-jojo text-3xl text-center text-jojo-gold mb-6">
            {isRegister ? '「REGISTRO」' : '「LOGIN」'}
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4 text-center text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-purple-300 text-sm mb-1 font-bold">Nome</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full bg-purple-950/50 border-2 border-purple-600 rounded-xl px-4 py-3 text-white placeholder-purple-400 focus:border-jojo-gold focus:outline-none transition-colors"
                    placeholder="Seu nome..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-purple-300 text-sm mb-1 font-bold">Universidade</label>
                  <input
                    type="text"
                    value={form.universidade}
                    onChange={(e) => setForm({ ...form, universidade: e.target.value })}
                    className="w-full bg-purple-950/50 border-2 border-purple-600 rounded-xl px-4 py-3 text-white placeholder-purple-400 focus:border-jojo-gold focus:outline-none transition-colors"
                    placeholder="Sua universidade..."
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-purple-300 text-sm mb-1 font-bold">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-purple-950/50 border-2 border-purple-600 rounded-xl px-4 py-3 text-white placeholder-purple-400 focus:border-jojo-gold focus:outline-none transition-colors"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-purple-300 text-sm mb-1 font-bold">Senha</label>
              <input
                type="password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                className="w-full bg-purple-950/50 border-2 border-purple-600 rounded-xl px-4 py-3 text-white placeholder-purple-400 focus:border-jojo-gold focus:outline-none transition-colors"
                placeholder="••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-jojo-gold to-yellow-500 text-jojo-darkPurple font-jojo text-xl py-3 rounded-xl hover:from-yellow-400 hover:to-jojo-gold transition-all duration-300 shadow-lg shadow-yellow-500/20 disabled:opacity-50 active:scale-95"
            >
              {loading ? 'ゴゴゴ...' : isRegister ? 'REGISTRAR!' : 'ENTRAR!'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-purple-300 hover:text-jojo-gold transition-colors text-sm"
            >
              {isRegister
                ? 'Já tem uma conta? Faça login!'
                : 'Não tem conta? Registre-se!'}
            </button>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="text-center mt-6 text-purple-500 font-jojo text-sm tracking-widest">
          ゴ ゴ ゴ ゴ ゴ ゴ ゴ
        </div>
      </div>
    </div>
  );
}
