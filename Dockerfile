# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependencias primero (cache de capas)
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Instalar pnpm si se usa lockfile de pnpm, sino npm
RUN if [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && pnpm install --frozen-lockfile; \
    else \
      npm ci; \
    fi

COPY . .

# Variables de entorno para el build (Dokploy las inyecta como build args)
ARG VITE_BACK_URL
ARG VITE_API_BASE_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_UPLOAD_IMAGE_ENDPOINT

ENV VITE_BACK_URL=$VITE_BACK_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_UPLOAD_IMAGE_ENDPOINT=$VITE_UPLOAD_IMAGE_ENDPOINT

RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:alpine

# Configuracion personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos del build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
