// jest.config.cjs — Configuración de Jest en CommonJS
// MOTIVO: evita la dependencia de ts-node para parsear jest.config.ts.
// Con Node 20 en CI (GitHub Actions), Jest no encuentra ts-node y falla:
//   "Error: Jest: 'ts-node' is required for the TypeScript configuration files."
// Al usar .cjs, Jest lee la config nativamente sin transpiladores adicionales.

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": "@swc/jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/__tests__/**/*.test.{ts,tsx}"],
};

module.exports = config;
