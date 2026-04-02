'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import BottomNav from '@/components/BottomNav';

interface Disciplina {
  id: string;
  nome: string;
  horas: number;
  porcentagemFalta: number;
  diasSemana: string[];
}

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  universidade: string;
  limiteFaltas: number | null;
}

interface FaltaInfo {
  disciplinaNome: string;
  faltasUsadas: number;
  faltasMaximas: number;
  porcentagemAtual: number;
  diasPermitidos: string[];
  diasSemana: string[];
}

interface Falta {
  id: string;
  userId: string;
  disciplinaId: string;
  data: string;
}

const DIAS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const DIAS_LABELS: Record<string, string> = {
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
};

const DIAS_SEMANA_MAP: Record<number, string> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado',
};

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][data.getDay()];
  return `${diaSemana}, ${dia}/${mes}`;
}

export default function DisciplinasPage() {
  const router = useRouter();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [faltasInfo, setFaltasInfo] = useState<Record<string, FaltaInfo>>({});
  const [faltasList, setFaltasList] = useState<Falta[]>([]);
  const [faltasHoje, setFaltasHoje] = useState<Set<string>>(new Set());
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState<string | null>(null);
  const [registrandoTodas, setRegistrandoTodas] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [faltaPlanejadaId, setFaltaPlanejadaId] = useState<string | null>(null);
  const [faltaPlanejadaData, setFaltaPlanejadaData] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    nome: '',
    horas: 60,
    porcentagemFalta: 25,
    diasSemana: [] as string[],
  });

  const [limiteFaltas, setLimiteFaltas] = useState(25);

  const loadData = useCallback(async () => {
    try {
      const [disc, prof, faltas, todasFaltas] = await Promise.all([
        api.disciplinas.list(),
        api.auth.getProfile(),
        api.faltas.calcular(),
        api.faltas.list(),
      ]);
      setDisciplinas(disc);
      setProfile(prof);
      setLimiteFaltas(prof.limiteFaltas ?? 25);
      setFaltasInfo(faltas);
      setFaltasList(todasFaltas);

      const hoje = new Date().toISOString().split('T')[0];
      const idsHoje = new Set<string>(
        todasFaltas
          .filter((f: any) => f.data?.split('T')[0] === hoje)
          .map((f: any) => f.disciplinaId)
      );
      setFaltasHoje(idsHoje);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleDia = (dia: string) => {
    setForm((prev) => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter((d) => d !== dia)
        : [...prev.diasSemana, dia],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.disciplinas.update(editingId, form);
      } else {
        await api.disciplinas.create(form);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.disciplinas.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (disc: Disciplina) => {
    setForm({
      nome: disc.nome,
      horas: disc.horas,
      porcentagemFalta: disc.porcentagemFalta,
      diasSemana: disc.diasSemana,
    });
    setEditingId(disc.id);
    setShowModal(true);
  };

  const handleSaveConfig = async () => {
    try {
      await api.auth.updateProfile({ limiteFaltas });
      setProfile((prev) => (prev ? { ...prev, limiteFaltas } : null));
      setShowConfigModal(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRegistrarFalta = async (disciplinaId: string) => {
    setRegistrando(disciplinaId);
    setError('');
    setSuccessMsg('');
    try {
      const hoje = new Date().toISOString().split('T')[0];
      await api.faltas.create({ disciplinaId, data: hoje });
      setSuccessMsg('Falta registrada!');
      setTimeout(() => setSuccessMsg(''), 2500);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegistrando(null);
    }
  };

  const handleRegistrarFaltaPlanejada = async (disciplinaId: string) => {
    if (!faltaPlanejadaData) return;
    setRegistrando(disciplinaId);
    setError('');
    setSuccessMsg('');
    try {
      await api.faltas.create({ disciplinaId, data: faltaPlanejadaData });
      setSuccessMsg('Falta planejada registrada!');
      setTimeout(() => setSuccessMsg(''), 2500);
      setFaltaPlanejadaId(null);
      setFaltaPlanejadaData('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegistrando(null);
    }
  };

  const handleRemoverUltimaFalta = async (disciplinaId: string) => {
    setRemovendo(disciplinaId);
    setError('');
    setSuccessMsg('');
    try {
      const faltasDaDisc = faltasList
        .filter((f) => f.disciplinaId === disciplinaId)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      if (faltasDaDisc.length === 0) return;
      await api.faltas.delete(faltasDaDisc[0].id);
      setSuccessMsg('Falta removida!');
      setTimeout(() => setSuccessMsg(''), 2500);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRemovendo(null);
    }
  };

  const hojeNomeDia = DIAS_SEMANA_MAP[new Date().getDay()];

  const disciplinasHoje = disciplinas.filter((d) => d.diasSemana.includes(hojeNomeDia));
  const todasFaltasHojeRegistradas = disciplinasHoje.length > 0 && disciplinasHoje.every((d) => faltasHoje.has(d.id));

  const handleRegistrarTodasHoje = async () => {
    setRegistrandoTodas(true);
    setError('');
    setSuccessMsg('');
    const hoje = new Date().toISOString().split('T')[0];
    const pendentes = disciplinasHoje.filter((d) => !faltasHoje.has(d.id));
    try {
      await Promise.all(pendentes.map((d) => api.faltas.create({ disciplinaId: d.id, data: hoje })));
      setSuccessMsg(`Faltas registradas em ${pendentes.length} matéria(s)!`);
      setTimeout(() => setSuccessMsg(''), 2500);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegistrandoTodas(false);
    }
  };

  const resetForm = () => {
    setForm({ nome: '', horas: 60, porcentagemFalta: 25, diasSemana: [] });
    setEditingId(null);
    setError('');
  };

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
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-jojo text-2xl text-jojo-gold">「MATÉRIAS」</h1>
            <p className="text-purple-300 text-sm">{profile?.universidade}</p>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-purple-800/50 border border-purple-600 rounded-xl p-2 hover:border-jojo-gold transition-colors"
            title="Configurações"
          >
            <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Limite info */}
      <div className="max-w-lg mx-auto px-4 mt-4">
        <div className="bg-purple-900/40 border border-purple-700/50 rounded-xl p-3 flex items-center justify-between">
          <span className="text-purple-300 text-sm">Limite de faltas:</span>
          <span className="font-jojo text-jojo-gold text-lg">{profile?.limiteFaltas ?? 25}%</span>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="max-w-lg mx-auto px-4 mt-3">
          <div className="bg-green-500/20 border border-green-500 text-green-300 p-3 rounded-xl text-sm text-center font-bold">
            {successMsg}
          </div>
        </div>
      )}

      {/* Disciplinas List */}
      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {disciplinas.length === 0 && (
          <div className="text-center py-12">
            <div className="text-purple-500 font-jojo text-xl mb-2">Nenhuma matéria cadastrada!</div>
            <p className="text-purple-400 text-sm">Adicione suas matérias para começar</p>
          </div>
        )}

        {disciplinas.map((disc) => {
          const info = faltasInfo[disc.id];
          const faltasUsadas = info?.faltasUsadas ?? 0;
          const faltasMaximas = info?.faltasMaximas ?? 0;
          const porcentagem = faltasMaximas > 0 ? (faltasUsadas / faltasMaximas) * 100 : 0;
          const corBarra = porcentagem >= 80 ? 'bg-red-500' : porcentagem >= 50 ? 'bg-yellow-500' : 'bg-green-500';
          const isExpanded = expandedId === disc.id;

          return (
            <div
              key={disc.id}
              className="bg-gradient-to-r from-purple-900/60 to-purple-800/40 border-2 border-purple-600/50 rounded-2xl overflow-hidden hover:border-jojo-gold/50 transition-all group"
            >
              {/* Header - always visible */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer select-none"
                onClick={() => setExpandedId(isExpanded ? null : disc.id)}
              >
                <svg
                  className={`w-4 h-4 text-purple-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <h3 className="font-jojo text-lg text-jojo-gold flex-1 truncate">{disc.nome}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-bold ${porcentagem >= 80 ? 'text-red-400' : porcentagem >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {faltasUsadas}/{faltasMaximas}
                  </span>
                  {faltasUsadas > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoverUltimaFalta(disc.id); }}
                      disabled={removendo === disc.id}
                      className="text-purple-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Remover última falta"
                    >
                      {removendo === disc.id ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Compact falta bar + button */}
              <div className="px-4 pb-3 -mt-1">
                <div className="w-full bg-purple-950/50 rounded-full h-1.5 mb-3">
                  <div className={`${corBarra} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min(porcentagem, 100)}%` }} />
                </div>

                {disc.diasSemana.includes(hojeNomeDia) ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRegistrarFalta(disc.id); }}
                        disabled={registrando === disc.id && faltaPlanejadaId !== disc.id}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-2 px-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                      >
                        {registrando === disc.id && faltaPlanejadaId !== disc.id ? (
                          <span className="animate-pulse text-sm">Registrando...</span>
                        ) : (
                          <>
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm">Faltar Hoje</span>
                          </>
                        )}
                      </button>
                      {faltaPlanejadaId === disc.id ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setFaltaPlanejadaId(null); setFaltaPlanejadaData(''); }}
                          className="bg-purple-800 hover:bg-purple-700 text-purple-300 hover:text-white font-bold px-3 py-2 rounded-xl transition-all active:scale-95"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setFaltaPlanejadaId(disc.id); setFaltaPlanejadaData(''); }}
                          className="bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-bold px-3 py-2 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20"
                          title="Planejar Falta"
                        >
                          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm">Planejar</span>
                        </button>
                      )}
                    </div>
                    {faltaPlanejadaId === disc.id && (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={faltaPlanejadaData}
                          onChange={(e) => setFaltaPlanejadaData(e.target.value)}
                          className="flex-1 bg-purple-950/50 border-2 border-purple-600 rounded-xl px-3 py-2 text-white text-sm focus:border-jojo-gold focus:outline-none transition-colors"
                        >
                          <option value="" disabled>Selecione um dia</option>
                          {(info?.diasPermitidos ?? []).map((dia) => (
                            <option key={dia} value={dia}>{formatarData(dia)}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRegistrarFaltaPlanejada(disc.id)}
                          disabled={registrando === disc.id || !faltaPlanejadaData}
                          className="bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-bold px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {registrando === disc.id ? '...' : 'OK'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : faltaPlanejadaId === disc.id ? (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={faltaPlanejadaData}
                      onChange={(e) => setFaltaPlanejadaData(e.target.value)}
                      className="flex-1 bg-purple-950/50 border-2 border-purple-600 rounded-xl px-3 py-2 text-white text-sm focus:border-jojo-gold focus:outline-none transition-colors"
                    >
                      <option value="" disabled>Selecione um dia</option>
                      {(info?.diasPermitidos ?? []).map((dia) => (
                        <option key={dia} value={dia}>{formatarData(dia)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRegistrarFaltaPlanejada(disc.id)}
                      disabled={registrando === disc.id || !faltaPlanejadaData}
                      className="bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-bold px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registrando === disc.id ? '...' : 'OK'}
                    </button>
                    <button
                      onClick={() => { setFaltaPlanejadaId(null); setFaltaPlanejadaData(''); }}
                      className="text-purple-400 hover:text-white px-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFaltaPlanejadaId(disc.id); setFaltaPlanejadaData(''); }}
                    className="w-full bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-bold py-2 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Registrar Falta Planejada
                  </button>
                )}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-purple-700/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm">{disc.horas}h • {disc.porcentagemFalta}% por falta</p>
                      <div className="flex gap-1 mt-2">
                        {disc.diasSemana.map((dia) => (
                          <span
                            key={dia}
                            className="bg-purple-700/50 text-purple-200 text-xs px-2 py-1 rounded-lg font-bold"
                          >
                            {DIAS_LABELS[dia] || dia}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(disc)}
                        className="text-purple-300 hover:text-jojo-gold p-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(disc.id)}
                        className="text-purple-300 hover:text-red-400 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Detailed falta info */}
                  {info && (
                    <div className="bg-purple-950/30 rounded-xl p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-300">Faltas usadas: <span className="font-bold text-white">{faltasUsadas}</span> / {faltasMaximas}</span>
                        <span className={`font-bold ${porcentagem >= 80 ? 'text-red-400' : porcentagem >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {Math.round(porcentagem)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAB - Faltar em Todas Hoje */}
      {disciplinasHoje.length > 0 && (
        <button
          onClick={handleRegistrarTodasHoje}
          disabled={todasFaltasHojeRegistradas || registrandoTodas}
          className={`fixed bottom-20 left-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 z-40 ${
            todasFaltasHojeRegistradas
              ? 'bg-gray-700 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-red-600 to-red-500 hover:scale-110 shadow-red-500/30'
          }`}
          title={todasFaltasHojeRegistradas ? 'Faltas de hoje já registradas' : `Faltar em Todas Hoje (${disciplinasHoje.length})`}
        >
          {registrandoTodas ? (
            <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : todasFaltasHojeRegistradas ? (
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </button>
      )}

      {/* FAB - Add button */}
      <button
        onClick={() => {
          resetForm();
          setShowModal(true);
        }}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-jojo-gold to-yellow-500 rounded-full shadow-lg shadow-yellow-500/30 flex items-center justify-center text-jojo-darkPurple hover:scale-110 transition-transform active:scale-95 z-40"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Modal - Add/Edit Disciplina */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-purple-900 to-jojo-dark border-2 border-jojo-gold/30 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-jojo text-2xl text-jojo-gold">
                  {editingId ? '「EDITAR」' : '「NOVA MATÉRIA」'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-purple-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-purple-300 text-sm mb-1 font-bold">Nome da Matéria</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full bg-purple-950/50 border-2 border-purple-600 rounded-xl px-4 py-3 text-white placeholder-purple-400 focus:border-jojo-gold focus:outline-none transition-colors"
                    placeholder="Ex: Cálculo 1"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-300 text-sm mb-1 font-bold">Horas Totais</label>
                    <input
                      type="number"
                      value={form.horas}
                      onChange={(e) => setForm({ ...form, horas: Number(e.target.value) })}
                      className="w-full bg-purple-950/50 border-2 border-purple-600 rounded-xl px-4 py-3 text-white focus:border-jojo-gold focus:outline-none transition-colors"
                      min={1}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-purple-300 text-sm mb-1 font-bold">% por Falta</label>
                    <input
                      type="number"
                      value={form.porcentagemFalta}
                      onChange={(e) => setForm({ ...form, porcentagemFalta: Number(e.target.value) })}
                      className="w-full bg-purple-950/50 border-2 border-purple-600 rounded-xl px-4 py-3 text-white focus:border-jojo-gold focus:outline-none transition-colors"
                      min={0}
                      step={0.1}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-purple-300 text-sm mb-2 font-bold">Dias da Semana</label>
                  <div className="flex flex-wrap gap-2">
                    {DIAS.map((dia) => (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => toggleDia(dia)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                          form.diasSemana.includes(dia)
                            ? 'bg-jojo-gold text-jojo-darkPurple shadow-md shadow-yellow-500/20'
                            : 'bg-purple-800/50 text-purple-300 border border-purple-600 hover:border-purple-400'
                        }`}
                      >
                        {DIAS_LABELS[dia]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-jojo-gold to-yellow-500 text-jojo-darkPurple font-jojo text-xl py-3 rounded-xl hover:from-yellow-400 hover:to-jojo-gold transition-all shadow-lg shadow-yellow-500/20 active:scale-95"
                >
                  {editingId ? 'ATUALIZAR!' : 'CADASTRAR!'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Config */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-purple-900 to-jojo-dark border-2 border-jojo-gold/30 rounded-t-3xl sm:rounded-3xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-jojo text-2xl text-jojo-gold">「CONFIGURAÇÕES」</h2>
                <button onClick={() => setShowConfigModal(false)} className="text-purple-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-purple-300 text-sm mb-1 font-bold">
                    Limite de Faltas (%)
                  </label>
                  <input
                    type="number"
                    value={limiteFaltas}
                    onChange={(e) => setLimiteFaltas(Number(e.target.value))}
                    className="w-full bg-purple-950/50 border-2 border-purple-600 rounded-xl px-4 py-3 text-white focus:border-jojo-gold focus:outline-none transition-colors"
                    min={0}
                    max={100}
                  />
                  <p className="text-purple-500 text-xs mt-1">
                    Porcentagem máxima de faltas permitida pela sua faculdade
                  </p>
                </div>

                <button
                  onClick={handleSaveConfig}
                  className="w-full bg-gradient-to-r from-jojo-gold to-yellow-500 text-jojo-darkPurple font-jojo text-xl py-3 rounded-xl hover:from-yellow-400 hover:to-jojo-gold transition-all shadow-lg shadow-yellow-500/20 active:scale-95"
                >
                  SALVAR!
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
