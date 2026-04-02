** Arquivo responsável por descrever como será pensádo e executado a decisão de possibilidade de faltas.

- Primeiro caso: Há uma unica disciplina no dia na qual o aluno ainda tem disponibilidade de faltar, logo esse dia ele pode faltar.

- Segundo caso: Há uma unica disciplina no dia na qual o aluno já atingiu o limite de faltas, logo esse dia ele não pode faltar.

- Terceiro caso: Há mais de uma disciplina no dia nas quais o aluno tem disponibilidade de faltar em todas, logo esse dia ele pode faltar.

- Quarto caso: Há mais de uma disciplina no dia nas quais o aluno já atingiu o limite de faltas em todas, logo esse dia ele não pode faltar.

- Quinto caso: Há mais de uma disciplina no dia nas quais o aluno atingiu o limite de falta em uma ou mais e em uma ou mais ainda não atingiu o limite de faltas, logo devido ao fato de ja ter atingido o limite de faltas em ao menos uma disciplina do dia ele não poderá faltar esse dia.

** OTIMIZAÇÃO DE FALTAS — Lógica detalhada (a implementar)

O objetivo é: dado o estado atual de faltas do aluno, determinar a sequência ótima de dias futuros
que o aluno pode faltar, maximizando o total de dias faltados sem ultrapassar o limite de nenhuma
disciplina e sem faltar de forma "picada" (os casos 1–5 acima já garantem que um dia só é faltável
se TODAS as disciplinas daquele dia ainda têm budget disponível).

---

CONCEITOS FUNDAMENTAIS

Budget de uma disciplina (B_i):
  B_i = faltasMaximas_i - faltasUsadas_i (faltas já registradas + faltasIniciais)

Teto de um slot (T_s):
  Cada "slot" é um padrão fixo de disciplinas que ocorre num mesmo dia da semana
  (ex: toda segunda = {MatA, Física}).
  T_s = min(B_i para toda disciplina i presente no slot)
  → A disciplina mais restrita do dia limita quantas vezes aquele padrão pode ser faltado.

Budget consumido:
  Toda vez que o aluno falta um slot, B_i é decrementado em 1 para cada disciplina do slot.

---

FORMULAÇÃO DO PROBLEMA

Variável de decisão:
  x_t ∈ {0, 1} → 1 se o aluno falta no dia t, 0 se não falta

Restrição por disciplina:
  Para cada disciplina i:
    Σ x_t (para todo dia t em que disciplina i aparece) ≤ B_i

Objetivo:
  Maximizar Σ x_t

Este é um problema de Programação Linear Inteira (ILP). Para o caso real (4–6 disciplinas,
~16 semanas), o espaço é pequeno o suficiente para ser resolvido de forma exata ou com greedy.

---

ALGORITMO GREEDY (solução prática)

O greedy funciona bem porque a estrutura do problema é regular (os slots se repetem semanalmente).

Passo 1 — Agrupar dias futuros por tipo de slot:
  Identificar os padrões distintos de disciplinas por dia da semana.
  Ex: { "segunda": {MatA, Física}, "quarta": {MatA, Cálculo}, "sexta": {Física} }

Passo 2 — Calcular o teto atual de cada slot:
  T_s = min(B_i) para as disciplinas do slot s.

Passo 3 — Calcular o "custo de oportunidade" de cada slot:
  Custo_s = quanto cada falta nesse slot consome do budget das suas disciplinas em relação
  à demanda total futura dessas disciplinas em outros slots.
  → Disciplinas que aparecem em muitos outros slots têm budget "compartilhado": gastar nelas
    aqui pode bloquear faltas em outros slots futuramente.

Passo 4 — Ordenar slots por prioridade de pular:
  Priorizar pular (faltar) slots onde a disciplina mais restrita (menor B_i) aparece em MENOS
  outros slots futuros — pois essas disciplinas têm poucas oportunidades de ser consumidas e
  devem ser aproveitadas antes que o budget expire.
  Fórmula de prioridade: prioridade_s = T_s / max(aparições_futuras de cada disciplina do slot)
  → Slots com prioridade alta devem ser faltados primeiro.

Passo 5 — Selecionar dias a faltar:
  Iterar pelos próximos dias em ordem de prioridade (maior prioridade primeiro).
  Para cada dia: se T_s > 0, marcar como "dia recomendado para faltar" e decrementar B_i de
  todas as disciplinas do slot.
  Repetir até que todos os budgets estejam zerados ou não haja mais dias disponíveis.

---

EXEMPLO ILUSTRADO

Disciplinas: MatA (B=3), Física (B=2)
Slots futuros: 4x segunda {MatA, Física}, 4x quinta {MatA}

Greedy correto (priorizar segundo, pois Física só aparece lá):
  Pular 2 segundas → MatA: B=1, Física: B=0
  Pular 1 quinta   → MatA: B=0
  Total = 3 dias faltados ✓

Greedy ingênuo (pular quintas primeiro, pois MatA tem B maior):
  Pular 3 quintas  → MatA: B=0
  0 segundas disponíveis (MatA zerou, bloqueia o slot)
  Física nunca chegou a B=0 — budget desperdiçado
  Total = 3 dias faltados, mas Física ficou com B=2 sobrando ✗

---

LIMITAÇÃO CONHECIDA

O greedy pode não encontrar o ótimo global em casos com 3+ disciplinas e dependências cruzadas
complexas. Para esses casos, a solução exata via backtracking (branch & bound) sobre os slots
futuros ainda é viável dado o tamanho pequeno do problema universitário típico.

---

STATUS: A implementar no backend (FaltaService.calcularDiasDisponiveis), cruzando os dias
futuros de todas as disciplinas do usuário em vez de calculá-las independentemente.