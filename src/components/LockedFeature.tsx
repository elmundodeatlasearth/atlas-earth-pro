// src/components/LockedFeature.tsx
// Componente reutilizable que muestra un bloqueo elegante con preview + upgrade prompt
"use client";

interface LockedFeatureProps {
  title: string;
  description: string;
  preview?: React.ReactNode;
  requiredPlan?: "PRO" | "ULTRA";
  compact?: boolean;
}

const PLANS = {
  PRO: {
    label: "PRO",
    price: "$4.99/mes",
    color: "from-amber-500 to-orange-600",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/20",
    bgGradient: "from-amber-900/10 to-orange-900/5",
    link: process.env.NEXT_PUBLIC_STRIPE_PRO_LINK || "#",
  },
  ULTRA: {
    label: "ULTRA",
    price: "$9.99/mes",
    color: "from-purple-600 to-pink-600",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/20",
    bgGradient: "from-purple-900/10 to-pink-900/5",
    link: process.env.NEXT_PUBLIC_STRIPE_ULTRA_LINK || "#",
  },
} as const;

export default function LockedFeature({
  title,
  description,
  preview,
  requiredPlan = "PRO",
  compact = false,
}: LockedFeatureProps) {
  const plan = PLANS[requiredPlan];

  if (compact) {
    return (
      <div className={`relative rounded-xl border ${plan.borderColor} overflow-hidden group`}>
        {/* Preview semi-transparente */}
        {preview && (
          <div className="relative pointer-events-none select-none">
            <div className="blur-[2px] opacity-40 scale-[0.98]">
              {preview}
            </div>
            {/* Overlay gradiente */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black/80" />
          </div>
        )}
        {/* Candado flotante */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
          <div className="text-2xl animate-pulse-glow">🔒</div>
          <div className={`text-xs font-bold ${plan.textColor}`}>{title}</div>
          <p className="text-[10px] text-gray-500 text-center max-w-[220px]">{description}</p>
          <a
            href={plan.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 px-4 py-1.5 rounded-lg bg-gradient-to-r ${plan.color} 
              text-[10px] font-bold text-black hover:scale-105 active:scale-95 
              transition-all duration-200 shadow-lg ${requiredPlan === "ULTRA" ? "shadow-purple-900/40" : "shadow-amber-900/40"}`}
          >
            Desbloquear con {plan.label} {plan.price}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border ${plan.borderColor} overflow-hidden group
      bg-gradient-to-br ${plan.bgGradient} backdrop-blur-sm`}>
      {/* Preview */}
      {preview && (
        <div className="relative pointer-events-none select-none">
          <div className="blur-sm opacity-30 scale-[0.97]">
            {preview}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black/90" />
        </div>
      )}

      {/* Lock overlay */}
      <div className="flex flex-col items-center text-center gap-3 p-6 md:p-8">
        <div className="text-4xl animate-bounce-glow">🔒</div>
        <h3 className={`text-base font-black ${plan.textColor}`}>
          {title}
        </h3>
        <p className="text-sm text-gray-400 max-w-md leading-relaxed">
          {description}
        </p>
        <a
          href={plan.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-2 px-8 py-3 rounded-xl bg-gradient-to-r ${plan.color} 
            text-sm font-black text-black hover:scale-105 active:scale-95 
            transition-all duration-200 shadow-2xl 
            ${requiredPlan === "ULTRA" ? "shadow-purple-900/40 hover:shadow-purple-900/60" : "shadow-amber-900/40 hover:shadow-amber-900/60"}`}
        >
          👑 Desbloquear con {plan.label} — {plan.price}
        </a>
        <div className={`text-[10px] ${plan.textColor} opacity-60 font-semibold uppercase tracking-widest`}>
          Característica exclusiva {plan.label}
        </div>
      </div>
    </div>
  );
}
