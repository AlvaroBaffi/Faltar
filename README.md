** Contexto:

- Atualmente os estudantes da grande maioria das faculdades precisam sempre estar calculando e organizando a quantidade de faltas que têm durante o semestre. O problema encontra-se principalmente no momento em que não é possível faltar um dia, pois uma das aulas que tem no dias vai acabar estourando o limite de faltas.

---

** Ideia:

- A ideia é criar um mini projeto para controlar a quantidade de faltas e ajudar os alunos a descidirem os dias que podem faltar sem estourar o limite de faltas imposto pela faculdade.

- O sistema deve ter uma tela de login e registro de usuário para autenticar o usuário.

- O sistema deve ser pesado em mobile first.

- o sistema deve permitir que o aluno insira o limite de faltas da sua faculdade, seja esse limite em porcentágem ou quantidade de dias faltados.

- O sistema deve permitir que o aluno cadastre uma disciplina com quantidade de horas, por exemplo, calculo 1 - 120 horas, porcentagem por falta e dias da semana que tem aulas dessa disciplina.

- O sistema deve permitir que o aluno insira uma porcentagem ou quantidade de faltas que já tem e quantos dias faltou.

- O sistema deve realizar o calculo e indicar os dias nos quais o aluno pode faltar de forma quem ele consiga atingir o máximo de falta sem estourar o limite(REGRA MAIS IMPORTANTE).

- O sistema deve ter APENAS duas telas. Uma para cadastrar e atualizar os dados a respeito de uma determinada disciplina e outra que mostre um calendário com indicativo dos dias que pode faltar e uma local para inserir as faltas conforme for ocorrendo. 

- O calculo deve ser refeito toda vez que o aluno registrar uma falta no sistema.

** BANCO DE DADOS:

- Tabela User: 
    * nome;
    * email;
    * senha;
    * universidade;

- Tabela Disciplinas:
    * nome;
    * horas;
    * porcentagem de falta;

- Tabela Relação de Faltas:
    * userId;
    * disciplinaId;
    * quantidadeDeFaltas;

** ESTILO DO SISTEMA:

- Deve seguir um estilo do sistema deve ser cartunizado(estilo jojo's bizarre adventure).
- utilize nextJs com tailwind.
- Mobile first.
- deve ser simples e intuitivo.
- caso necessário crie modais para inserir as faltas.

** BACKEND: 

- Para o banco utilize o ORM Prisma.
- NestJs para o backend.
- utilize a arquitetura DDD.
- Utilizaremos .env para guardadar as informações sensíveis do projeto.
