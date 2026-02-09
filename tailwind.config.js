/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0f172a", // Slate 900
                paper: "#1e293b", // Slate 800
                primary: "#6366f1", // Indigo 500
                secondary: "#8b5cf6", // Violet 500
                accent: "#ec4899", // Pink 500
                text: "#f8fafc", // Slate 50
                muted: "#94a3b8", // Slate 400
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
