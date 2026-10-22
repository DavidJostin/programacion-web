# Programación Web · Products CRUD

**Aplicación web full-stack con una API REST en Spring Boot y un cliente en JavaScript puro (Vanilla JS) para gestionar un catálogo de productos. Se ejecuta de forma autónoma, sin servidor de base de datos externo.**

[![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![H2 Database](https://img.shields.io/badge/H2%20Database-In--Memory-1F6FEB?style=for-the-badge)](https://www.h2database.com/)
[![Maven](https://img.shields.io/badge/Maven-3.9.9-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)](https://maven.apache.org/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)

</div>

---

## Tabla de contenidos

- [Características principales](#características-principales)
- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
  - [1. Clonar el repositorio](#1-clonar-el-repositorio)
  - [2. Ejecutar desde la terminal](#2-ejecutar-desde-la-terminal)
  - [3. Ejecutar desde IntelliJ IDEA](#3-ejecutar-desde-intellij-idea)
  - [Puertos y URLs](#puertos-y-urls)
- [Documentación de la API REST](#documentación-de-la-api-rest)
  - [Modelo `Product`](#modelo-product)
  - [Endpoints](#endpoints)
  - [Reglas de validación](#reglas-de-validación)
  - [Ejemplos con cURL](#ejemplos-con-curl)
- [Consola de base de datos (H2 Console)](#consola-de-base-de-datos-h2-console)
- [Estructura del proyecto](#estructura-del-proyecto)

---

## Características principales

- **Arquitectura desacoplada.** El backend expone una API REST JSON (`/api/products`). El frontend es un cliente estático en HTML5, CSS3 y JavaScript puro, sin frameworks ni build step, que la consume con `fetch`.
- **Base de datos en memoria (H2).** No hace falta instalar PostgreSQL, MySQL ni ningún otro servidor: la aplicación arranca a la primera en cualquier equipo con un JDK.
- **Esquema automático.** Hibernate genera las tablas a partir de las entidades JPA al iniciar (`ddl-auto=create-drop`).
- **Datos de ejemplo automáticos.** El componente `DataSeeder` (`CommandLineRunner`) inserta 6 productos de muestra en cada arranque, así que los endpoints tienen datos listos para consumir.
- **CRUD completo.** Permite crear, listar, consultar, editar y eliminar productos, con validación en el servidor y en el cliente.
- **Assets locales.** Las imágenes del catálogo usan un placeholder SVG servido por la propia aplicación (`assets/placeholder.svg`), sin depender de CDNs.
- **Diseño responsive.** La cuadrícula se adapta a escritorio (3 columnas), tablet (2), móvil vertical (1) y móvil horizontal (4). Incluye modo oscuro automático (`prefers-color-scheme`).
- **Accesibilidad.** Usa diálogos nativos `<dialog>`, roles ARIA, navegación por teclado y mensajes de estado con `role="status"`.
- **Página adicional: Rick and Morty Explorer.** Un catálogo con búsqueda, paginación y vista de detalle que consume la API pública [rickandmortyapi.com](https://rickandmortyapi.com/). Reintenta con *backoff* exponencial si la API limita las peticiones (HTTP 429).

> [!NOTE]
> El CRUD de productos funciona completamente offline. La página **Rick and Morty** sí necesita conexión a internet, porque consume una API pública externa.

---

## Stack tecnológico

| Capa | Tecnología | Uso |
| :--- | :--- | :--- |
| **Backend** | Java 17+ | Lenguaje principal |
| | Spring Boot 3.5.6 | Framework de aplicación y servidor Tomcat embebido |
| | Spring Web (MVC) | Controladores REST y servicio de contenido estático |
| | Spring Data JPA / Hibernate 6 | Persistencia y repositorios (`JpaRepository`) |
| **Frontend** | HTML5 | Estructura semántica de `index.html` y `rickandmorty.html` |
| | CSS3 | Grid layout, media queries, variables CSS y modo oscuro |
| | JavaScript (Vanilla, ES2020) | Cliente de la API con `fetch`, renderizado del DOM y diálogos |
| **Persistencia y herramientas** | H2 Database 2.x | Base de datos relacional en memoria |
| | Maven Wrapper (`mvnw`) 3.9.9 | Build y gestión de dependencias, sin instalar Maven |
| | H2 Console | Inspección de la base de datos desde el navegador |

---

## Requisitos previos

| Requisito | Versión | Notas |
| :--- | :--- | :--- |
| **JDK** | 17 o superior | Recomendado: [Eclipse Temurin](https://adoptium.net/) 17 o 21 |
| **IDE** (opcional) | IntelliJ IDEA (Community o Ultimate) | También funciona con NetBeans, Eclipse o VS Code |
| **Git** | Cualquier versión reciente | Para clonar el repositorio |

> [!IMPORTANT]
> **No** necesitas instalar Maven, PostgreSQL ni ningún servidor de base de datos. El wrapper de Maven descarga automáticamente la versión correcta la primera vez.

Comprueba tu versión de Java:

```bash
java -version
```

Si muestra `1.8` o una versión anterior a la 17, configura la variable `JAVA_HOME` para que apunte a un JDK 17+.

---

## Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone https://github.com/DavidJostin/programacion-web.git
cd programacion-web
```

### 2. Ejecutar desde la terminal

**Opción A: ejecutar directamente con Maven**

```bash
# Linux / macOS / Git Bash
./mvnw spring-boot:run
```

```powershell
# Windows (PowerShell o CMD)
.\mvnw.cmd spring-boot:run
```

**Opción B: empaquetar como JAR ejecutable y lanzarlo**

```bash
# 1. Compilar y empaquetar
./mvnw clean package

# 2. Ejecutar el JAR generado
java -jar target/crud-1.0-SNAPSHOT.jar
```

Cuando la aplicación esté lista verás en la consola una línea similar a:

```text
Tomcat started on port 8082 (http) with context path '/'
Started CrudApplication in 3.2 seconds
```

### 3. Ejecutar desde IntelliJ IDEA

1. **File → Open…** y selecciona la carpeta del proyecto (la que contiene `pom.xml`). IntelliJ lo detectará como proyecto Maven.
2. Verifica el SDK en **File → Project Structure → Project → SDK**: debe ser **17 o superior**.
3. Espera a que Maven termine de descargar las dependencias (barra de progreso inferior).
4. Abre `src/main/java/com/example/crud/CrudApplication.java` y pulsa el botón ▶ **Run** junto al método `main`.

### Puertos y URLs

La aplicación se ejecuta por defecto en el puerto **`8082`** (configurable en `application.properties` con `server.port`).

| Recurso | URL |
| :--- | :--- |
| Página 1: CRUD de productos | <http://localhost:8082/> |
| Página 2: Rick and Morty Explorer | <http://localhost:8082/rickandmorty.html> |
| API REST de productos | <http://localhost:8082/api/products> |
| Consola H2 | <http://localhost:8082/h2-console> |

> [!TIP]
> Para cambiar el puerto sin editar archivos, pásalo como argumento: `java -jar target/crud-1.0-SNAPSHOT.jar --server.port=9090`

---

## Documentación de la API REST

**URL base:** `http://localhost:8082/api/products`
**Formato:** `application/json`

### Modelo `Product`

| Campo | Tipo | Obligatorio | Restricciones |
| :--- | :--- | :---: | :--- |
| `id` | `Long` | — | Autogenerado (`IDENTITY`). Se ignora en el cuerpo de las peticiones |
| `name` | `String` | ✅ | No vacío |
| `price` | `Double` | ✅ | `>= 0` |
| `category` | `String` | ❌ | — |
| `stock` | `Integer` | ❌ | `>= 0` si se envía |
| `description` | `String` | ❌ | Máx. 1000 caracteres |
| `imageUrl` | `String` | ❌ | Máx. 500 caracteres |

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

| Método | Endpoint | Descripción | Respuestas |
| :---: | :--- | :--- | :--- |
| ![GET](https://img.shields.io/badge/GET-0969DA?style=flat-square) | `/api/products` | Lista todos los productos | `200 OK` |
| ![GET](https://img.shields.io/badge/GET-0969DA?style=flat-square) | `/api/products/{id}` | Obtiene un producto por su ID | `200 OK` · `404 Not Found` |
| ![POST](https://img.shields.io/badge/POST-1A7F37?style=flat-square) | `/api/products` | Crea un producto nuevo | `201 Created` · `400 Bad Request` |
| ![PUT](https://img.shields.io/badge/PUT-9A6700?style=flat-square) | `/api/products/{id}` | Reemplaza un producto existente | `200 OK` · `400 Bad Request` · `404 Not Found` |
| ![DELETE](https://img.shields.io/badge/DELETE-CF222E?style=flat-square) | `/api/products/{id}` | Elimina un producto | `204 No Content` · `404 Not Found` |

### Reglas de validación

Si la validación falla, la API responde `400 Bad Request` con un cuerpo JSON que describe el error:

```json
{ "error": "Price must be zero or greater" }
```

| Condición | Mensaje |
| :--- | :--- |
| `name` nulo o vacío | `Name is required` |
| `price` nulo o negativo | `Price must be zero or greater` |
| `stock` negativo | `Stock must be zero or greater` |

### Ejemplos con cURL

```bash
# Listar productos
curl http://localhost:8082/api/products

# Obtener un producto
curl http://localhost:8082/api/products/1

# Crear un producto
curl -X POST http://localhost:8082/api/products \
     -H "Content-Type: application/json" \
     -d '{"name":"USB-C Hub","price":39.90,"category":"Accessories","stock":50}'

# Actualizar un producto
curl -X PUT http://localhost:8082/api/products/1 \
     -H "Content-Type: application/json" \
     -d '{"name":"Laptop Pro 14 (2026)","price":1199.99,"category":"Computers","stock":10}'

# Eliminar un producto
curl -X DELETE http://localhost:8082/api/products/1
```

> [!WARNING]
> `PUT` reemplaza el recurso completo: los campos que no envíes quedarán en `null`.

---

## Consola de base de datos (H2 Console)

La consola web de H2 está habilitada para inspeccionar y consultar la base de datos mientras la aplicación se ejecuta.

1. Con la aplicación en marcha, abre <http://localhost:8082/h2-console>.
2. Introduce los siguientes datos de conexión:

   | Campo | Valor |
   | :--- | :--- |
   | **Driver Class** | `org.h2.Driver` |
   | **JDBC URL** | `jdbc:h2:mem:crud_db` |
   | **User Name** | `sa` |
   | **Password** | *(dejar vacío)* |

3. Pulsa **Connect** y ejecuta, por ejemplo:

   ```sql
   SELECT * FROM PRODUCT;
   ```

> [!CAUTION]
> La base de datos vive **en memoria**: todos los cambios se pierden al detener la aplicación y en cada arranque se recrean los 6 productos de ejemplo. Para conservar los datos entre ejecuciones, cambia la URL a un archivo, por ejemplo `jdbc:h2:file:./data/crud_db`, y `ddl-auto` a `update`.

**Configuración relevante** (`src/main/resources/application.properties`):

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

## Estructura del proyecto

```text
programacion-web/
├── .mvn/wrapper/
│   └── maven-wrapper.properties      # Versión de Maven usada por el wrapper
├── src/
│   └── main/
│       ├── java/com/example/crud/
│       │   ├── CrudApplication.java       # Punto de entrada (@SpringBootApplication)
│       │   ├── DataSeeder.java            # Carga de datos de ejemplo al iniciar
│       │   ├── controller/
│       │   │   └── ProductController.java # API REST /api/products
│       │   ├── model/
│       │   │   └── Product.java           # Entidad JPA
│       │   └── repository/
│       │       └── ProductRepository.java # Spring Data JpaRepository
│       └── resources/
│           ├── application.properties     # Configuración (puerto, H2, JPA)
│           └── static/                    # Frontend servido en la raíz "/"
│               ├── index.html             # Página 1: CRUD de productos
│               ├── rickandmorty.html      # Página 2: Rick and Morty Explorer
│               ├── css/
│               │   └── styles.css         # Estilos responsive y modo oscuro
│               ├── js/
│               │   ├── products.js        # Cliente de la API de productos
│               │   └── rickandmorty.js    # Cliente de la API pública de Rick and Morty
│               └── assets/
│                   └── placeholder.svg    # Imagen local por defecto
├── legacy-javaee/                    # Versión anterior Java EE (referencia, no se compila)
├── mvnw / mvnw.cmd                   # Maven Wrapper (Unix / Windows)
└── pom.xml                           # Dependencias y build de Maven
```
