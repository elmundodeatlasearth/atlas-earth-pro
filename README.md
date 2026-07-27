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
- **Tests**: Jest + SWC
- **CI/CD**: GitHub Actions

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

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir http://localhost:3000
```

## 🗄️ Base de Datos (Supabase)

Crea las siguientes tablas en tu proyecto Supabase:

### `usuarios_atlas`
```sql
CREATE TABLE usuarios_atlas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  is_vip BOOLEAN DEFAULT false,
  is_ultra BOOLEAN DEFAULT false,
  ai_credits INTEGER DEFAULT 0,
  profile_name TEXT,
  profile_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `historial_atlas`
```sql
CREATE TABLE historial_atlas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  fecha DATE NOT NULL,
  ab_generado INTEGER DEFAULT 0,
  usd_generado REAL DEFAULT 0,
  diamantes_obtenidos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, fecha)
);
```

## 🚢 Deploy

El proyecto está configurado para deploy en **Vercel**:

```bash
npm run build    # Build de producción
npm run start    # Iniciar servidor de producción
```

Para deploy manual a Vercel:
```bash
npx vercel --prod
```

## 🧪 Tests

```bash
npm test         # Ejecutar tests
npm run lint     # Verificar linting
```

## 📁 Estructura del Proyecto

```
src/
├── app/                  # Páginas Next.js (App Router)
│   ├── layout.tsx        # Layout principal con Supabase Auth
│   ├── page.tsx          # Página principal con tabs
│   ├── globals.css       # Estilos globales y animaciones
│   └── admin/            # Panel de administración
├── components/           # Componentes React
│   ├── sidebar.tsx       # Barra lateral con inputs y auth
│   ├── dashboard-tab.tsx # Tab de dashboard
│   ├── simulador-tab.tsx # Tab de simulador de inversión
│   ├── auditoria-tab.tsx # Tab de auditoría completa
│   ├── ia-tab.tsx        # Tab de asistente IA
│   ├── historial-tab.tsx # Tab de historial y progreso
│   ├── tier-comparativa.tsx # Comparativa de tiers por país
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
│   └── export-csv.ts     # Exportación CSV
└── __tests__/            # Tests
    └── atlasMath.test.ts # Tests del motor de cálculos

supabase/
└── functions/
    ├── ai-advisor/       # Edge Function: Asistente IA
    └── stripe-webhook/   # Edge Function: Webhook de pagos
```

## 📄 Licencia

Uso privado — Proyecto personal.
