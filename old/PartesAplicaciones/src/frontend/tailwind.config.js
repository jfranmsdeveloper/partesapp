/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#F97316', // Orange-500
                    light: '#FB923C', // Orange-400
                    dark: '#EA580C', // Orange-600
                },
                secondary: {
                    DEFAULT: '#3B82F6', // Blue-500
                    light: '#60A5FA', // Blue-400
                    dark: '#2563EB', // Blue-600
                }
            }
        },
    },
    plugins: [],
}
