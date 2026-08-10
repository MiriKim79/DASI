import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 개발 시 /api 요청을 FastAPI(8000)로 프록시한다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
