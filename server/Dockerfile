# --- Back-end: API Node/Express ---
FROM node:22-alpine

WORKDIR /app

# Dependências primeiro (melhor cache). Todas são JS puro — sem toolchain nativo.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Código da aplicação
COPY . .

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# docker-start.js popula o banco de demonstração na primeira subida
# (quando o volume ainda está vazio) e então inicia a API.
CMD ["node", "docker-start.js"]
