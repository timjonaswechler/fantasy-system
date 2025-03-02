# fantasy-system

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
brew services start postgresql@15
npm run dev
```

to end the server, run:

```bash
brew services stop postgresql@15
```

in Terminal, run:

```bash
psql -U <username> -d <db-name>
```

für die migration der Datenbanken und der Daten folgende Befehle

**Run the migrations** :

```
npm run migrate
```

This will create the necessary tables in your database.


**Seed the weapons data** :

```
npm run seed-weapons

```

This will load all the weapons from your JSON files into the database.

**Or run both steps at once** :

```
npm run reset-weapons
```
