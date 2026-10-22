# Web Programming · Products CRUD

**Full-stack web application with a Spring Boot REST API and a plain JavaScript (Vanilla JS) client for managing a product catalog. It runs standalone, with no external database server.**

[![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![H2 Database](https://img.shields.io/badge/H2%20Database-In--Memory-1F6FEB?style=for-the-badge)](https://www.h2database.com/)
[![Maven](https://img.shields.io/badge/Maven-3.9.9-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)](https://maven.apache.org/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)

</div>

---

## Table of contents

- [Key features](#key-features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local installation and setup](#local-installation-and-setup)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Run from the terminal](#2-run-from-the-terminal)
  - [3. Run from IntelliJ IDEA](#3-run-from-intellij-idea)
  - [Ports and URLs](#ports-and-urls)
- [REST API documentation](#rest-api-documentation)
  - [`Product` model](#product-model)
  - [Endpoints](#endpoints)
  - [Validation rules](#validation-rules)
  - [cURL examples](#curl-examples)
- [Database console (H2 Console)](#database-console-h2-console)
- [Project structure](#project-structure)

---

## Key features

- **Decoupled architecture.** The backend exposes a JSON REST API (`/api/products`). The frontend is a static client built with HTML5, CSS3 and plain JavaScript, with no frameworks and no build step, that consumes it using `fetch`.
- **In-memory database (H2).** No need to install PostgreSQL, MySQL or any other server: the application starts right away on any machine with a JDK.
- **Automatic schema.** Hibernate generates the tables from the JPA entities on startup (`ddl-auto=create-drop`).
- **Automatic sample data.** The `DataSeeder` component (`CommandLineRunner`) inserts 6 sample products on every startup, so the endpoints have data ready to consume.
- **Full CRUD.** Create, list, view, edit and delete products, with validation on both the server and the client.
- **Local assets.** Catalog images use an SVG placeholder served by the application itself (`assets/placeholder.svg`), with no dependency on CDNs.
- **Responsive design.** The grid adapts to desktop (3 columns), tablet (2), mobile portrait (1) and mobile landscape (4). Includes automatic dark mode (`prefers-color-scheme`).
- **Accessibility.** Uses native `<dialog>` elements, ARIA roles, keyboard navigation and status messages with `role="status"`.
- **Additional page: Rick and Morty Explorer.** A catalog with search, pagination and a detail view that consumes the public API at [rickandmortyapi.com](https://rickandmortyapi.com/). It retries with exponential *backoff* when the API rate-limits requests (HTTP 429).

> [!NOTE]
> The products CRUD works completely offline. The **Rick and Morty** page does require an internet connection, since it consumes an external public API.

---

## Tech stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | Java 17+ | Main language |
| | Spring Boot 3.5.6 | Application framework and embedded Tomcat server |
| | Spring Web (MVC) | REST controllers and static content serving |
| | Spring Data JPA / Hibernate 6 | Persistence and repositories (`JpaRepository`) |
| **Frontend** | HTML5 | Semantic structure of `index.html` and `rickandmorty.html` |
| | CSS3 | Grid layout, media queries, CSS variables and dark mode |
| | JavaScript (Vanilla, ES2020) | API client with `fetch`, DOM rendering and dialogs |
| **Persistence and tools** | H2 Database 2.x | In-memory relational database |
| | Maven Wrapper (`mvnw`) 3.9.9 | Build and dependency management, no Maven install required |
| | H2 Console | Browser-based database inspection |

---

## Prerequisites

| Requirement | Version | Notes |
| :--- | :--- | :--- |
| **JDK** | 17 or higher | Recommended: [Eclipse Temurin](https://adoptium.net/) 17 or 21 |
| **IDE** (optional) | IntelliJ IDEA (Community or Ultimate) | Also works with NetBeans, Eclipse or VS Code |
| **Git** | Any recent version | To clone the repository |

> [!IMPORTANT]
> You do **not** need to install Maven, PostgreSQL or any database server. The Maven wrapper automatically downloads the correct version the first time.

Check your Java version:

```bash
java -version
```

If it shows `1.8` or any version below 17, set the `JAVA_HOME` variable to point to a JDK 17+.

---

## Local installation and setup

### 1. Clone the repository

```bash
git clone https://github.com/DavidJostin/programacion-web.git
cd programacion-web
```

### 2. Run from the terminal

**Option A: run directly with Maven**

```bash
# Linux / macOS / Git Bash
./mvnw spring-boot:run
```

```powershell
# Windows (PowerShell or CMD)
.\mvnw.cmd spring-boot:run
```

**Option B: package as an executable JAR and run it**

```bash
# 1. Compile and package
./mvnw clean package

# 2. Run the generated JAR
java -jar target/crud-1.0-SNAPSHOT.jar
```

When the application is ready, you will see a line similar to this in the console:

```text
Tomcat started on port 8082 (http) with context path '/'
Started CrudApplication in 3.2 seconds
```

### 3. Run from IntelliJ IDEA

1. **File → Open…** and select the project folder (the one containing `pom.xml`). IntelliJ will detect it as a Maven project.
2. Check the SDK under **File → Project Structure → Project → SDK**: it must be **17 or higher**.
3. Wait for Maven to finish downloading the dependencies (progress bar at the bottom).
4. Open `src/main/java/com/example/crud/CrudApplication.java` and click the ▶ **Run** button next to the `main` method.

### Ports and URLs

By default, the application runs on port **`8082`** (configurable in `application.properties` via `server.port`).

| Resource | URL |
| :--- | :--- |
| Page 1: Products CRUD | <http://localhost:8082/> |
| Page 2: Rick and Morty Explorer | <http://localhost:8082/rickandmorty.html> |
| Products REST API | <http://localhost:8082/api/products> |
| H2 Console | <http://localhost:8082/h2-console> |

> [!TIP]
> To change the port without editing files, pass it as an argument: `java -jar target/crud-1.0-SNAPSHOT.jar --server.port=9090`

---

## REST API documentation

**Base URL:** `http://localhost:8082/api/products`
**Format:** `application/json`

### `Product` model

| Field | Type | Required | Constraints |
| :--- | :--- | :---: | :--- |
| `id` | `Long` | — | Auto-generated (`IDENTITY`). Ignored in request bodies |
| `name` | `String` | ✅ | Not blank |
| `price` | `Double` | ✅ | `>= 0` |
| `category` | `String` | ❌ | — |
| `stock` | `Integer` | ❌ | `>= 0` if provided |
| `description` | `String` | ❌ | Max. 1000 characters |
| `imageUrl` | `String` | ❌ | Max. 500 characters |

```json
{
  "id": 1,
  "name": "Laptop Pro 14",
  "price": 1299.99,
  "category": "Computers",
  "stock": 12,
  "description": "14-inch laptop with 16 GB RAM, 512 GB SSD and all-day battery life.",
  "imageUrl": "https://picsum.photos/seed/laptop/600/400"
}
```

### Endpoints

| Method | Endpoint | Description | Responses |
| :---: | :--- | :--- | :--- |
| ![GET](https://img.shields.io/badge/GET-0969DA?style=flat-square) | `/api/products` | Lists all products | `200 OK` |
| ![GET](https://img.shields.io/badge/GET-0969DA?style=flat-square) | `/api/products/{id}` | Gets a product by its ID | `200 OK` · `404 Not Found` |
| ![POST](https://img.shields.io/badge/POST-1A7F37?style=flat-square) | `/api/products` | Creates a new product | `201 Created` · `400 Bad Request` |
| ![PUT](https://img.shields.io/badge/PUT-9A6700?style=flat-square) | `/api/products/{id}` | Replaces an existing product | `200 OK` · `400 Bad Request` · `404 Not Found` |
| ![DELETE](https://img.shields.io/badge/DELETE-CF222E?style=flat-square) | `/api/products/{id}` | Deletes a product | `204 No Content` · `404 Not Found` |

### Validation rules

If validation fails, the API responds with `400 Bad Request` and a JSON body describing the error:

```json
{ "error": "Price must be zero or greater" }
```

| Condition | Message |
| :--- | :--- |
| `name` null or blank | `Name is required` |
| `price` null or negative | `Price must be zero or greater` |
| `stock` negative | `Stock must be zero or greater` |

### cURL examples

```bash
# List products
curl http://localhost:8082/api/products

# Get a product
curl http://localhost:8082/api/products/1

# Create a product
curl -X POST http://localhost:8082/api/products \
     -H "Content-Type: application/json" \
     -d '{"name":"USB-C Hub","price":39.90,"category":"Accessories","stock":50}'

# Update a product
curl -X PUT http://localhost:8082/api/products/1 \
     -H "Content-Type: application/json" \
     -d '{"name":"Laptop Pro 14 (2026)","price":1199.99,"category":"Computers","stock":10}'

# Delete a product
curl -X DELETE http://localhost:8082/api/products/1
```

> [!WARNING]
> `PUT` replaces the entire resource: any fields you don't send will be set to `null`.

---

## Database console (H2 Console)

The H2 web console is enabled so you can inspect and query the database while the application is running.

1. With the application running, open <http://localhost:8082/h2-console>.
2. Enter the following connection details:

   | Field | Value |
   | :--- | :--- |
   | **Driver Class** | `org.h2.Driver` |
   | **JDBC URL** | `jdbc:h2:mem:crud_db` |
   | **User Name** | `sa` |
   | **Password** | *(leave empty)* |

3. Click **Connect** and run, for example:

   ```sql
   SELECT * FROM PRODUCT;
   ```

> [!CAUTION]
> The database lives **in memory**: all changes are lost when the application stops, and the 6 sample products are recreated on every startup. To keep data between runs, change the URL to a file, for example `jdbc:h2:file:./data/crud_db`, and set `ddl-auto` to `update`.

**Relevant configuration** (`src/main/resources/application.properties`):

```properties
server.port=8082

spring.datasource.url=jdbc:h2:mem:crud_db;DB_CLOSE_DELAY=-1
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true

spring.h2.console.enabled=true
```

---

## Project structure

```text
programacion-web/
├── .mvn/wrapper/
│   └── maven-wrapper.properties      # Maven version used by the wrapper
├── src/
│   └── main/
│       ├── java/com/example/crud/
│       │   ├── CrudApplication.java       # Entry point (@SpringBootApplication)
│       │   ├── DataSeeder.java            # Loads sample data on startup
│       │   ├── controller/
│       │   │   └── ProductController.java # REST API /api/products
│       │   ├── model/
│       │   │   └── Product.java           # JPA entity
│       │   └── repository/
│       │       └── ProductRepository.java # Spring Data JpaRepository
│       └── resources/
│           ├── application.properties     # Configuration (port, H2, JPA)
│           └── static/                    # Frontend served at the root "/"
│               ├── index.html             # Page 1: Products CRUD
│               ├── rickandmorty.html      # Page 2: Rick and Morty Explorer
│               ├── css/
│               │   └── styles.css         # Responsive styles and dark mode
│               ├── js/
│               │   ├── products.js        # Products API client
│               │   └── rickandmorty.js    # Rick and Morty public API client
│               └── assets/
│                   └── placeholder.svg    # Local default image
├── legacy-javaee/                    # Previous Java EE version (reference only, not compiled)
├── mvnw / mvnw.cmd                   # Maven Wrapper (Unix / Windows)
└── pom.xml                           # Maven dependencies and build
```
