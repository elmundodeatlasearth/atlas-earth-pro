# 🛡️ ATLAS ACTUAL: The Definitive Truth

Una aplicación SaaS de nivel empresarial para rastrear y proyectar ganancias de Atlas Earth con seguridad de grado militar.

## 🎯 Características Principales

- **Seguridad de Nivel Militar**: Cifrado AES-256, RLS en Supabase, CSP, HSTS
- **Arquitectura Stitch**: Capa de orquestación segura entre cliente y servidor
- **UI Premium**: Glassmorphism, animaciones tácticas, radar de seguridad en tiempo real
- **Responsivo**: Optimizado para móviles, tablets y escritorio
- **PWA Ready**: Instalable como aplicación nativa

## 🏗️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Hosting**: Vercel (Edge Network)
- **Seguridad**: AES-256, PKCE, Row Level Security
- **Orquestación**: Antigravity AI + Stitch Service Layer

## 🚀 Instalación Rápida

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd calculadora-atlas-earth

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 4. Iniciar servidor de desarrollo
npm run dev
```

## 🔐 Configuración de Seguridad

### 1. Supabase Setup

```bash
# Ejecutar el schema SQL en tu proyecto de Supabase
# Navega a: SQL Editor > New Query
# Pega el contenido de supabase-schema.sql
```

### 2. Variables de Entorno

Actualiza `.env` con tus credenciales reales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-key-aqui
VITE_ENCRYPTION_KEY=genera-una-clave-segura-de-32-caracteres
```

### 3. Deployment a Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**IMPORTANTE**: Configura las variables de entorno en Vercel Dashboard antes del deploy.

## 📋 Características de Seguridad

### 🔒 Security Protocols
- **AES-256 Encryption**: Used for all sensitive data storage.
- **Row Level Security (RLS)**: Supabase implementation.
- **Rate Limiting**: Token Bucket algorithm protecting API endpoints. (Implemented)
- **2FA Verification**: Framework ready for multi-factor authentication. (Implemented)
- **Secure Stitch Service**: Authenticated cloud synchronization.

### 📱 Mobile Experience (PWA)
- **Installable**: Works as a native app on iOS and Android.
- **Offline Capable**: Access core features without internet.
- **Touch Optimized**: Military-grade tactical UI designed for field use.

### 🗺️ Project Roadmap
- [x] **Phase 1**: Core Calculator Logic & Basic UI
- [x] **Phase 2**: Advanced Features (Boost, Badges, Tier Data)
- [x] **Phase 3**: Analytics Dashboard & Visualizations
- [x] **Phase 4**: Goal Planner & Strategy Engine
- [x] **Phase 5**: Subscriptions & Payment Integration
- [x] **Phase 6**: Security Hardening & Cloud Sync
- [x] **Phase 7**: Final Polish & Routing Architecture
- [x] **Phase 8**: PWA Mobile App Conversionddleware
- [ ] IP Whitelisting/Blacklisting
- [ ] 2FA (Two-Factor Authentication)
- [ ] Webhook Verification para pagos

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── layout/          # MainLayout, Sidebar
│   └── ui/              # Componentes reutilizables
├── context/
│   └── SecurityContext.tsx  # Orquestación de seguridad global
├── features/
│   ├── auth/            # Login, Register
│   ├── calculator/      # Profit Calculator
│   └── stats/           # Charts & Analytics
├── lib/
│   ├── security/        # Encryption, Audit
│   └── supabase.ts      # Cliente Supabase hardened
├── services/
│   └── stitch.ts        # Capa de integración segura
└── utils/
    └── calculations.ts  # Lógica de cálculo
```

## 🎨 Características UI

- **Scanner Táctico**: Radar animado que visualiza la integridad de la sesión
- **Indicadores de Seguridad**: Estado en tiempo real del cifrado AES-256
- **Glassmorphism**: Efectos de vidrio esmerilado en todas las tarjetas
- **Micro-animaciones**: Transiciones suaves tipo military-grade

## 🧪 Testing

```bash
# Build de producción
npm run build

# Preview de build
npm run preview
```

## 📊 Base de Datos

Todas las tablas incluyen:
- UUID como clave primaria
- Timestamps automáticos
- RLS habilitado por defecto
- Índices optimizados

## 🤝 Contribuir

Este proyecto está diseñado con los más altos estándares de seguridad. Cualquier PR debe:
1. Pasar auditoría de seguridad
2. Incluir tests
3. Mantener 100% TypeScript strict mode

## 📜 Licencia

Propietario - © 2026

## 🆘 Soporte

Para reportar vulnerabilidades de seguridad, NO usar issues públicos.
Contactar directamente al equipo de seguridad.

---

**⚠️ ADVERTENCIA**: Esta aplicación maneja datos financieros. Asegúrate de configurar correctamente todas las variables de entorno antes de desplegar a producción.
