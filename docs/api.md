# Documentation des APIs

Toutes les requêtes ci-dessous doivent être envoyées à l'**API Gateway**, exposé sur `http://localhost:8080`.
L'API Gateway se charge de router la requête (`/api/users`, `/api/products`, `/api/orders`) vers le bon microservice en interne.

---

## 👤 Service "Users" (Étudiant B)

**Point d'entrée Nginx** : `/api/users`

| Méthode | Route Externe via Gateway | Description | Statut HTTP |
|---------|---------------------------|-------------|-------------|
| GET | `/api/users/` | Lister tous les utilisateurs | 200 OK |
| GET | `/api/users/{id}` | Obtenir le détail d'un utilisateur | 200 / 404 |
| POST | `/api/users/` | Créer un utilisateur | 201 Created |
| PUT | `/api/users/{id}` | Modifier un utilisateur | 200 / 404 |
| DELETE | `/api/users/{id}` | Supprimer un utilisateur | 200 / 404 |
| POST | `/api/users/login` | Authentifier un utilisateur | 200 / 401 |
| GET | `/api/users/health` | Vérifier l'état de santé du service | 200 OK |

### Création d'un Utilisateur `POST /api/users/`
Body requis (JSON) :
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "my_secure_password"
}
```

### Authentification (Login) `POST /api/users/login`
Body requis (JSON) - L'utilisateur peut fournir **soit** son `username`, **soit** son `email`, en plus du mot de passe.
```json
{
  "email": "john@example.com",
  "password": "my_secure_password"
}
```

---

## 📦 Service "Products" (Étudiant A)

**Point d'entrée Nginx** : `/api/products`

| Méthode | Route Externe via Gateway | Description | Statut HTTP |
|---------|---------------------------|-------------|-------------|
| GET | `/api/products/` | Lister tous les produits | 200 OK |
| GET | `/api/products/{id}` | Obtenir le détail d'un produit | 200 / 404 |
| POST | `/api/products/` | Créer un produit | 201 Created |
| PUT | `/api/products/{id}` | Modifier un produit | 200 / 404 |
| DELETE | `/api/products/{id}` | Supprimer un produit | 200 / 404 |
| GET | `/api/products/health` | Vérifier l'état de santé du service | 200 OK |

### Création d'un Produit `POST /api/products/`

{
  "name": "Super Produit",
  "price": 29.99,
  "stock": 150
}
```

---

## 🛒 Service "Orders" (Étudiant A)

**Point d'entrée Nginx** : `/api/orders`

| Méthode | Route Externe via Gateway | Description | Statut HTTP |
|---------|---------------------------|-------------|-------------|
| GET | `/api/orders/` | Lister toutes les commandes | 200 OK |
| GET | `/api/orders/{id}` | Obtenir le détail d'une commande | 200 / 404 |
| POST | `/api/orders/` | Créer une commande (et décrémenter le stock) | 201 Created |
| GET | `/api/orders/user/{user_id}` | Obtenir toutes les commandes d'un utilisateur | 200 / 404 |
| GET | `/api/orders/health` | Vérifier l'état de santé du service | 200 OK |

### Création d'une Commande `POST /api/orders/`

{
  "user_id": 1,
  "product_id": 4,
  "quantity": 2
}
```
