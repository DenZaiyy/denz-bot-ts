FROM node:20-alpine

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installation des dépendances et génération de Prisma
RUN npm install
RUN npx prisma generate
RUN npm install -g nodemon

# Copie du reste des fichiers du projet
COPY . .
RUN npm run build

# Point d'entrée pour démarrer Express et le bot Discord
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 443 8081 8080 80

ENTRYPOINT ["docker-entrypoint.sh"]
