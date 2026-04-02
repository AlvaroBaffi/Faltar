'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import BottomNav from '@/components/BottomNav';

interface CalcResult {
  [disciplinaId: string]: {
    disciplinaNome: string;
    faltasUsadas: number;
    faltasMaximas: number;
    porcentagemAtual: number;
    diasPermitidos: string[];
    diasSemana: string[];
  };
}

interface Falta {
  id: string;
  userId: string;
  disciplinaId: string;
  data: string;
}

interface Disciplina {
  id: string;
  nome: string;
  horas: number;
  porcentagemFalta: number;
  diasSemana: string[];
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarioPage() {
  const router = useRouter();
  const [calcResult, setCalcResult] = useState<CalcResult>({});
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showFaltaModal, setShowFaltaModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const [calc, faltasList, discList] = await Promise.all([
        api.faltas.calcular(),
        api.faltas.list(),
        api.disciplinas.list(),
      ]);
      setCalcResult(calc);
      setFaltas(faltasList);
      setDisciplinas(discList);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Collect all "dias permitidos" (days that the student can skip)
  const diasPermitidosSet = new Set<string>();
  const diasPermitidosByDisc: Record<string, string[]> = {};
  Object.entries(calcResult).forEach(([discId, data]) => {
    data.diasPermitidos.forEach((d) => diasPermitidosSet.add(d));
    diasPermitidosByDisc[discId] = data.diasPermitidos;
  });

  // Collect all "faltas" dates
  const faltasDatesSet = new Set<string>();
  faltas.forEach((f) => {
    const d = new Date(f.data).toISOString().split('T')[0];
    faltasDatesSet.add(d);
  });

  const getDayStatus = (dayStr: string) => {
    const hasFalta = faltasDatesSet.has(dayStr);
    const canSkip = diasPermitidosSet.has(dayStr);
    return { hasFalta, canSkip };
  };

  const handleDayClick = (dayStr: string) => {
    setSelectedDate(dayStr);
    setSelectedDisciplinaId(disciplinas.length > 0 ? disciplinas[0].id : '');
    setShowFaltaModal(true);
  };

  const handleAddFalta = async () => {
    if (!selectedDate || !selectedDisciplinaId) return;
    try {
      await api.faltas.create({ disciplinaId: selectedDisciplinaId, data: selectedDate });
      setShowFaltaModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveFalta = async (faltaId: string) => {
    try {
      await api.faltas.delete(faltaId);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Get faltas for the selected date
  const faltasForSelectedDate = selectedDate
    ? faltas.filter((f) => new Date(f.data).toISOString().split('T')[0] === selectedDate)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-jojo-gold font-jojo text-3xl animate-menacing">ゴゴゴ...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 speed-lines">
      {/* Header */}
      <div className="bg-gradient-to-r from-jojo-darkPurple via-purple-900 to-jojo-darkPurple border-b-2 border-jojo-gold/30 p-4">
        <div className="max-w-lg mx-auto">
          <h1 className="font-jojo text-2xl text-jojo-gold">「CALENDÁRIO」</h1>
          <p className="text-purple-300 text-sm">Veja os dias que pode faltar!</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-lg mx-auto px-4 mt-4 space-y-2">
        {Object.entries(calcResult).map(([discId, data]) => {
          const percent = data.faltasMaximas > 0 ? (data.faltasUsadas / data.faltasMaximas) * 100 : 0;
          const isWarning = percent >= 70;
          const isDanger = percent >= 90;

          return (
            <div
              key={discId}
              className={`bg-purple-900/40 border rounded-xl p-3 ${
                isDanger
                  ? 'border-red-500/70'
                  : isWarning
                    ? 'border-yellow-500/50'
                    : 'border-purple-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-jojo text-sm text-jojo-gold">{data.disciplinaNome}</span>
                <span
                  className={`text-sm font-bold ${
                    isDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400'
                  }`}
                >
                  {data.faltasUsadas}/{data.faltasMaximas} faltas
                </span>
              </div>
              <div className="mt-2 h-2 bg-purple-950 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDanger
                      ? 'bg-gradient-to-r from-red-500 to-red-400'
                      : isWarning
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                        : 'bg-gradient-to-r from-green-500 to-green-400'
                  }`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendar */}
      <div className="max-w-lg mx-auto px-4 mt-4">
        <div className="bg-purple-900/40 border border-purple-700/50 rounded-2xl p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="text-purple-300 hover:text-jojo-gold p-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="font-jojo text-xl text-jojo-gold">
              {MONTH_NAMES[month]} {year}
            </h3>
            <button onClick={nextMonth} className="text-purple-300 hover:text-jojo-gold p-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map((day) => (
              <div key={day} className="text-center text-purple-400 text-xs font-bold py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first of the month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const { hasFalta, canSkip } = getDayStatus(dateStr);
              const isToday =
                new Date().toISOString().split('T')[0] === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(dateStr)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all relative ${
                    hasFalta
                      ? 'bg-red-500/30 border border-red-500 text-red-300'
                      : canSkip
                        ? 'bg-green-500/20 border border-green-500/50 text-green-300 hover:bg-green-500/30'
                        : 'text-purple-300 hover:bg-purple-800/50'
                  } ${isToday ? 'ring-2 ring-jojo-gold' : ''}`}
                >
                  {day}
                  {hasFalta && (
                    <span className="absolute -top-1 -right-1 text-[8px]">❌</span>
                  )}
                  {canSkip && !hasFalta && (
                    <span className="absolute -top-1 -right-1 text-[8px]">✅</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500/30 border border-green-500/50 rounded" />
              <span className="text-purple-300">Pode faltar</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500/30 border border-red-500 rounded" />
              <span className="text-purple-300">Faltou</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded ring-2 ring-jojo-gold" />
              <span className="text-purple-300">Hoje</span>
            </div>
          </div>
        </div>
      </div>

      {/* Falta Modal */}
      {showFaltaModal && selectedDate && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-purple-900 to-jojo-dark border-2 border-jojo-gold/30 rounded-t-3xl sm:rounded-3xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-jojo text-xl text-jojo-gold">
                  「{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}」
                </h2>
                <button
                  onClick={() => setShowFaltaModal(false)}
                  className="text-purple-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Existing faltas for this date */}
              {faltasForSelectedDate.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-purple-300 text-sm font-bold">Faltas registradas:</p>
                  {faltasForSelectedDate.map((f) => {
                    const discName =
                      calcResult[f.disciplinaId]?.disciplinaNome ||
                      disciplinas.find((d) => d.id === f.disciplinaId)?.nome ||
                      'Disciplina';
                    return (
                      <div
                        key={f.id}
                        className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2"
                      >
                        <span className="text-red-300 text-sm">{discName}</span>
                        <button
                          onClick={() => handleRemoveFalta(f.id)}
                          className="text-red-400 hover:text-red-300 text-xs font-bold"
                        >
                          REMOVER
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Falta */}
              <div className="space-y-3">
                <p className="text-purple-300 text-sm font-bold">Registrar nova falta:</p>
                <select
                  value={selectedDisciplinaId}
                  onChange={(e) => setSelectedDisciplinaId(e.target.value)}
                  className="w-full bg-purple-950/50 border-2 border-purple-600 rounded-xl px-4 py-3 text-white focus:border-jojo-gold focus:outline-none transition-colors"
                >
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAddFalta}
                  disabled={!selectedDisciplinaId}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-jojo text-lg py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
                >
                  REGISTRAR FALTA!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
