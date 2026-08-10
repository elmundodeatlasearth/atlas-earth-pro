# 🌎 Atlas Earth PRO — Calculadora Estratégica Definitiva

Una aplicación web premium para jugadores de **Atlas Earth** que te permite calcular tu renta exacta, simular inversiones, auditar tu cuenta y recibir recomendaciones de estrategia impulsadas por IA.

## 🚀 Características

| Plan | Características |
|---|---|
| **FREE** | Renta diaria, total de parcelas, multiplicador de Tier |
| **PRO** ($4.99/mes) | Dashboard completo (semanal/mensual/anual), simulador de inversión, auditoría en 5 pasos, historial con gráficos, perfiles en nube, exportación CSV, estrategia inteligente, IA (5 créditos/mes) |
| **ULTRA** ($9.99/mes) | Todo lo de PRO + optimizador Explorer Club avanzado, análisis ROI, comparativa multi-país, IA (50 créditos/mes) |

## 🛠️ Stack Técnico

- **Frontend**: Next.js 16 + React 19 + TypeScript 5
- **Estilos**: Tailwind CSS 4 + CSS personalizado con glassmorphism y animaciones premium
- **Base de Datos**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Pagos**: Stripe Webhooks
- **IA**: Morph LLM para asistente de estrategia
- **PWA**: Service Worker + Manifest para instalación en dispositivos
- **Tests**: Jest + SWC (91 tests)
- **CI/CD**: GitHub Actions (lint + tests + deploy Pages)

## 📋 Prerrequisitos

- Node.js 20+
- Una cuenta en [Supabase](https://supabase.com)
- Una cuenta en [Stripe](https://stripe.com) (para pagos)
- Una API Key de [Morph](https://morph.so) (para IA)

## 🔧 Desarrollo Local

```bash
# 1. Clonar e instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 3. Aplicar migraciones (Dashboard → SQL Editor)
#    Supabase → SQL Editor → ejecutar en orden:
#    supabase/migrations/001_init.sql
#    supabase/migrations/002_fix_rls_and_schema.sql
#    supabase/migrations/003_monthly_credits_and_security.sql
#    supabase/migrations/004_persistent_rate_limiting.sql
#    (Guía completa: scripts/SQL-EDITOR-GUIDE.md)

# 4. Desplegar edge functions (requiere Supabase CLI)
#    powershell -ExecutionPolicy Bypass -File scripts/deploy-supabase.ps1

# 5. Iniciar servidor de desarrollo
npm run dev

# 6. Abrir http://localhost:3000
```

## 🗄️ Base de Datos (Supabase)

Migraciones idempotentes en `supabase/migrations/`:

| Migración | Qué hace |
|---|---|
| `001_init.sql` | Tablas `usuarios_atlas` + `historial_atlas` + RLS básico |
| `002_fix_rls_and_schema.sql` | RLS correcto, triggers, 3 créditos al registrarse |
| `003_monthly_credits_and_security.sql` | Créditos mensuales (PRO=5/ULTRA=50), RPCs seguros, historial borrable |
| `004_persistent_rate_limiting.sql` | Rate limiting persistente anti-abuso (tabla + RPC atómico) |

> [!IMPORTANT]
> La 003 es **crítica**: elimina la política que permitía a cualquier usuario
> auto-concederse ULTRA con un simple `UPDATE`. Aplícala antes de producción.

## 🚢 Deploy

El proyecto exporta a **estático** (`output: "export"` en `next.config.ts`).
Dos opciones:

- **GitHub Pages** (recomendado): el workflow `.github/workflows/ci.yml`
  hace lint + tests + build + deploy automático con cada push a `main`.
- **Vercel**: configura `SPA` con las env vars del proyecto.

```bash
npm run build    # Build de producción (export estático → /out)
npm run deploy   # gh-pages -d out
```

Edge functions (Supabase):
```bash
supabase functions deploy ai-advisor --project-ref TU_REF --no-verify-jwt
supabase functions deploy stripe-webhook --project-ref TU_REF --no-verify-jwt
supabase functions deploy admin-list-users --project-ref TU_REF --no-verify-jwt
```

## 🧪 Tests & Calidad

```bash
npm test         # 91 tests (6 suites)
npm run lint     # 0 errores
npm run build    # type-check + export estático
```

Suites:
- `atlasMath.test.ts` — motor de cálculos (renta, tiers, ROI)
- `atlasMathEdge.test.ts` — casos límite (colapso, escalera, países)
- `permissions.test.ts` — permisos FREE/PRO/ULTRA
- `persistencia.test.ts` — perfiles locales, restauración segura
- `sanitize.test.ts` — sanitización de HTML de la IA
- `contratoIA.test.ts` — contrato frontend ↔ edge function ai-advisor

## 📁 Estructura del Proyecto

```
src/
├── app/                  # Páginas Next.js (App Router)
│   ├── layout.tsx        # Layout principal con PWA + fonts
│   ├── page.tsx          # Página principal con tabs
│   ├── globals.css       # Estilos globales y animaciones
│   └── admin/            # Panel CRM admin (rol "admin")
├── components/           # Componentes React
│   ├── sidebar.tsx       # Barra lateral con inputs y auth
│   ├── dashboard-tab.tsx # Tab de dashboard
│   ├── simulador-tab.tsx # Tab de simulador de inversión
│   ├── auditoria-tab.tsx # Tab de auditoría completa
│   ├── ia-tab.tsx        # Tab de asistente IA (créditos)
│   ├── historial-tab.tsx # Tab de historial y progreso
│   ├── tier-comparativa.tsx # Comparativa de tiers por país
│   ├── HoneycombBackground.tsx # Fondo animado
│   └── ...
├── hooks/                # Custom hooks
│   ├── useAtlasState.ts  # Orquestador de estado global
│   ├── useAtlasInputs.ts # Estado de inputs del usuario
│   ├── useAtlasCalculations.ts # Cálculos memorizados
│   ├── useAtlasAuth.ts   # Autenticación Supabase
│   └── usePermissions.ts # Sistema de permisos FREE/PRO/ULTRA
├── utils/                # Utilidades
│   ├── atlasMath.ts      # Motor de cálculos principal
│   ├── supabase.ts       # Cliente Supabase
│   ├── sanitize.ts       # Sanitización HTML
│   ├── persistencia.ts   # Perfiles locales seguros
│   └── export-csv.ts     # Exportación CSV
└── __tests__/            # Tests (91)

supabase/
├── migrations/           # 001-004 (idempotentes)
└── functions/
    ├── ai-advisor/       # IA + rate limiting + créditos mensuales
    ├── stripe-webhook/   # Webhook de pagos
    └── admin-list-users/ # CRM admin (service_role + rol verificado)

scripts/
├── deploy-supabase.ps1     # Deploy edge functions
├── SQL-EDITOR-GUIDE.md     # Cómo aplicar migraciones
└── STRIPE-WEBHOOK-GUIDE.md # Cómo configurar Stripe
```

## 📄 Licencia

Uso privado — Proyecto personal.
