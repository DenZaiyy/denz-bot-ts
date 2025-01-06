.PHONY: setup deploy restart logs rebuild prettier

setup:
	# Installation de Docker et Docker Compose
	sudo apt-get update
	sudo apt-get install -y docker.io docker-compose
	sudo systemctl enable docker
	sudo systemctl start docker
	# Création du fichier .env.local à partir de .env.example si non existant
	test -f .env.local || cp .env.example .env.local

deploy:
	docker-compose --env-file .env.local down
	docker-compose --env-file .env.local up -d

rebuild:
	docker-compose --env-file .env.local up -d --build

restart:
	docker-compose restart

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -af

prettier:
	npx prettier --write ./src
