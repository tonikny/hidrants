# Estadi de construcció
FROM node:24-alpine AS builder

WORKDIR /app

# Copiem fitxers de dependències
COPY package*.json ./

# Instal·lem dependències
RUN npm install

# Copiem el codi
COPY . .

# Build de l'aplicació Vite
RUN npm run build

# Estadi de producció amb Nginx
FROM nginx:alpine

# Copiem els fitxers estàtics del build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiem la configuració personalitzada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposem el port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
