# Lava e Seca

App web para agenda compartilhada de uma lava e seca LG 16/10 kg em um predio com 14 apartamentos.

O app foi pensado para celular, mas tambem funciona no computador. Ele cobre login por apartamento e PIN, agenda semanal, creditos por apartamento, transferencias de horas, avisos internos, painel admin e metricas de uso.

## Desenvolvimento

```powershell
npm install
npm run dev
```

## Variaveis de ambiente

Copie `.env.example` para `.env.local` e preencha os dados do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APARTMENT_SESSION_SECRET=
ADMIN_PASSWORD=
```

`APARTMENT_SESSION_SECRET` deve ter pelo menos 16 caracteres.
`ADMIN_PASSWORD` deve ter pelo menos 8 caracteres.

## Verificacao

```powershell
npm run test
npm run build
```

Para o smoke test E2E local:

```powershell
npm run build
npm run start
```

Em outro terminal:

```powershell
npm run e2e
```
