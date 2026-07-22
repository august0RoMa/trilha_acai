# --- Front-end: build do Vite + nginx servindo estático + proxy /api ---

# Estágio 1: build do bundle React/Vite
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# A URL da API é embutida em tempo de build. "/api" faz o front chamar a
# própria origem, e o nginx encaminha para o back-end (ver nginx.conf).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Estágio 2: nginx servindo o dist + reverse proxy para a API
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
