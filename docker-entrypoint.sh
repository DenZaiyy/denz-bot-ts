#!/bin/sh

# Attendre que la base de données soit prête
echo "Waiting for database to be ready..."
sleep 10

# Exécuter les migrations Prisma
echo "Running Prisma migrations..."
npx prisma db push --accept-data-loss
npx prisma generate

# Démarrer le serveur Express en arrière-plan
echo "Starting Express server..."
node dist/index.js &

# Démarrer le bot Discord
echo "Starting Discord bot..."
node dist/bot.js

# Garder le conteneur en vie
tail -f /dev/null 