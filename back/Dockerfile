# Estadi de construcció
FROM node:24-alpine AS builder

WORKDIR /app

# Copiem fitxers de dependències
COPY package*.json ./

# Instal·lem totes les dependències (incloent devDependencies per al build)
RUN npm install

# Copiem la resta del codi
COPY . .

# Generem el build de TypeScript
RUN npm run build

# Estadi de producció
FROM node:24-alpine

# Instal·lem curl per al healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copiem fitxers de dependències
COPY package*.json ./

# Instal·lem només dependències de producció
RUN npm install --omit=dev

# Copiem el codi compilat i les dades persistents de l'estadi anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

# Exposem el port intern (configurat al .env, per defecte 3033)
EXPOSE 3033

# Comanda per iniciar l'aplicació
CMD ["npm", "start"]
