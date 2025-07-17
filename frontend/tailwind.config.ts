import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx,html,css}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx,html,css}",
    './src/**/*.{js,ts,jsx,tsx,html,css}',  // Include all directories where Tailwind classes might appear
    "./out/**/*.{js,ts,jsx,tsx,mdx,html,css}", // Include the output directory
     './node_modules/antd/**/*.{js,ts,jsx,tsx}',  // Ant Design components
     './public/antd.css',  // Ant Design components
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
} satisfies Config;
