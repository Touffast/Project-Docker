# Project-Docker

Plateforme e-commerce en microservices (Users, Products, Orders) avec gateway Nginx.

## Lancer le projet

```bash
docker compose up --build
```

Le gateway expose le port 80.

## Endpoints via gateway

- `http://localhost/api/users/health`
- `http://localhost/api/products/health`
- `http://localhost/api/orders/health`

## Tester rapidement

Ouvre `tester.html` pour piloter toutes les APIs via une interface dynamique.

## Auteurs

Alleman Robin & Riegert Samuel

