/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "#3b82f6",
                "primary-dark": "#2563eb",
                "background-light": "#f3f4f6",
                "background-dark": "#0f172a",
                "card-light": "#ffffff",
                "card-dark": "#1e293b",
                "text-light": "#111827",
                "text-dark": "#f3f4f6",
                "muted-light": "#6b7280",
                "muted-dark": "#9ca3af",
                "accent-blue": "#336699",
                "danger-light": "#fee2e2",
                "danger-text": "#b91c1c",
                "success-light": "#dcfce7",
                "success-text": "#15803d",
            },
            fontFamily: {
                display: ["Inter", "sans-serif"],
                body: ["Inter", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.5rem",
                'xl': '1rem',
                '2xl': '1.5rem',
            },
        },
    },
    plugins: [],
}
