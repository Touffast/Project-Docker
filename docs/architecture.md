# Schéma d'Architecture - Projet Docker "Microservices from Scratch"

## Vue d'ensemble de l'Infrastructure

L'application est décomposée en 3 microservices métier totalement indépendants, et orchestrés via Docker Compose sur un réseau commun nommé `ecommerce-network`. Chaque service API possède sa propre base de données isolée et n'est pas accessible de l'extérieur sans passer par le point d'entrée unique (API Gateway Nginx).

```mermaid
graph TD
    Client["💻 Client (Navigateur / Curl / Postman)"] -->|Port 8080| Gateway

    subgraph "Infrastructure Docker (Réseau : ecommerce-network)"
        Gateway["🚦 API Gateway (Nginx)"]
        
        Gateway -->|/api/users/*| UsersAPI
        Gateway -->|/api/products/*| ProductsAPI
        Gateway -->|/api/orders/*| OrdersAPI

        subgraph "Services Métier"
            UsersAPI["👤 Users API (Node/Express) - Port 5001"]
            ProductsAPI["📦 Products API (Node/Express) - Port 5002"]
            OrdersAPI["🛒 Orders API (Node/Express) - Port 5003"]
        end

        subgraph "Bases de Données Isolées (PostgreSQL)"
            UsersAPI -->|users-net| DBUsers[("💽 DB Users")]
            ProductsAPI -->|products-net| DBProducts[("💽 DB Products")]
            OrdersAPI -->|orders-net| DBOrders[("💽 DB Orders")]
        end
    end

    %% Styles
    classDef client fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef gateway fill:#ff9900,stroke:#333,stroke-width:2px,color:#fff;
    classDef service fill:#4472c4,stroke:#333,stroke-width:2px,color:#fff;
    classDef db fill:#548235,stroke:#333,stroke-width:2px,color:#fff;

    class Client client;
    class Gateway gateway;
    class UsersAPI,ProductsAPI,OrdersAPI service;
    class DBUsers,DBProducts,DBOrders db;
```

## Communications Inter-Services

- Le service **Orders API** (port `5003`) a besoin de récupérer des informations sur un produit lors de la création d'une commande (vérification du stock et calcul du prix). Pour cela, il communique de manière synchrone (HTTPS/HTTP) avec le service **Products API**, via le réseau interne Docker (`ecommerce-network`).
- Il n'y a **aucun lien direct** entre les différentes bases de données. Pour des raisons d'indépendance, les bases de données sont placées sur des sous-réseaux Docker exclusifs (`users-net`, `products-net`, `orders-net`).
