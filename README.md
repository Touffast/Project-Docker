# Projet Docker - Microservices from Scratch

Projet réalisé dans le cadre d'un cours sur l'architecture Microservices et Docker. 
Ce dépôt contient une infrastructure e-commerce complète, segmentée en plusieurs microservices avec leurs bases de données, et protégée derrière une API Gateway Nginx.

**Équipe :** 
- Étudiant A : Alleman Robin (Services Métier)
- Étudiant B : Riegert Samuel (Utilisateurs & Infrastructure)

## 🚀 Lancement Rapide du Projet

Assurez-vous d'avoir [Docker](https://www.docker.com/) et Docker Compose installés sur votre machine.

1. **Cloner ce dépôt** et ouvrir un terminal à la racine du dossier.
2. **Lancer l'environnement complet** en arrière-plan avec la commande suivante :
   ```bash
   docker compose up -d --build
   ```
3. L'application est alors accessible via l'**API Gateway Nginx** sur le port `8080`.
   - Point d'entrée : `http://localhost:8080`
   - Test frontend web : Ouvre `tester.html` pour piloter toutes les APIs via une interface dynamique.

### 🛑 Arrêt de l'environnement

Pour couper correctement l'entièreté des services :
```bash
docker compose down
```
*(Si vous souhaitez détruire les volumes de bases de données et repartir à zéro, rajoutez `-v` à la commande).*

---

## 📚 Documentation Technique

Toute la documentation de l'architecture et des APIs se trouve dans le répertoire `/docs` :
- 🏗️ [Schéma et Explications de l'Architecture](./docs/architecture.md)
- 📡 [Documentation des 3 APIs et des Endpoints](./docs/api.md)

L'API Gateway centralise le routage sur le port 8080 via ces chemins principaux :
- `/api/users/*` → Redirige vers le microservice Users (Node)
- `/api/products/*` → Redirige vers le microservice Products (Node)
- `/api/orders/*` → Redirige vers le microservice Orders (Node)

---

### Endpoints de santé rapides (Health)
Vérifiez l'état de l'infrastructure via les routes :
- `http://localhost:8080/api/users/health`
- `http://localhost:8080/api/products/health`
- `http://localhost:8080/api/orders/health`
