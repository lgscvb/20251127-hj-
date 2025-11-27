import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',  // 监听所有外部 IP
    port: 3000,       // 可以根据需要更改端口
  },
  define: {
    'process.env.API_URL': JSON.stringify(process.env.API_URL || '/api')
  }
});
