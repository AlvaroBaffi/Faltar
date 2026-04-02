-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Disciplina" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "horas" INTEGER NOT NULL,
    "porcentagemFalta" REAL NOT NULL,
    "diasSemana" TEXT NOT NULL,
    "faltasIniciais" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Disciplina_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Disciplina" ("createdAt", "diasSemana", "horas", "id", "nome", "porcentagemFalta", "updatedAt", "userId") SELECT "createdAt", "diasSemana", "horas", "id", "nome", "porcentagemFalta", "updatedAt", "userId" FROM "Disciplina";
DROP TABLE "Disciplina";
ALTER TABLE "new_Disciplina" RENAME TO "Disciplina";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
