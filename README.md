# AutoFix

AutoFix — multi-tenant ERP-система для автосервісів

## Перший запуск

### 1. Налаштувати змінні середовища

У корені проєкту створіть локальний `.env` із прикладу:

```bash
cp .env.example .env
```

Замініть `change_me` у `.env` на власні паролі. Кореневий `.env` є єдиним джерелом налаштувань PostgreSQL для Docker Compose і Prisma. Файл не потрапляє до Git.

### 2. Запустити PostgreSQL і pgAdmin

Виконайте з кореня проєкту:

```bash
docker compose up -d
docker compose ps
```

Після запуску за замовчуванням доступні:

- PostgreSQL: `localhost:5432`;
- pgAdmin: <http://localhost:5050>.

Логін і пароль pgAdmin беруться з `PGADMIN_DEFAULT_EMAIL` та `PGADMIN_DEFAULT_PASSWORD` у кореневому `.env`.

Для підключення до PostgreSQL із pgAdmin використовуйте:

- host: `postgres`;
- port: `5432`;
- database, username і password: значення `POSTGRES_DB`, `POSTGRES_USER` та `POSTGRES_PASSWORD` із `.env`.

### 3. Встановити залежності бекенду

```bash
cd backend
npm ci
```

### 4. Застосувати міграції та згенерувати Prisma Client

```bash
npx prisma migrate dev
npx prisma generate
```

Перевірити стан бази:

```bash
npx prisma migrate status
```

Очікуваний результат — база `autofix` на `localhost:5432`, а схема бази даних актуальна.

У PowerShell із забороненим виконанням скриптів використовуйте `npx.cmd` замість `npx`:

```powershell
npx.cmd prisma migrate status
```

## Робота зі схемою даних

Схема розташована у `backend/prisma/schema.prisma`. Після її зміни створіть міграцію з осмисленою назвою:

```bash
cd backend
npx prisma migrate dev --name describe_your_change
npx prisma generate
```

Для перегляду даних через Prisma Studio:

```bash
cd backend
npx prisma studio
```

## Зупинка інфраструктури

Зупинити контейнери зі збереженням даних:

```bash
docker compose down
```

Повністю видалити контейнери разом із локальними даними PostgreSQL і pgAdmin:

```bash
docker compose down -v
```

> `docker compose down -v` безповоротно видаляє локальні Docker volumes. Використовуйте цю команду лише тоді, коли дані більше не потрібні.

