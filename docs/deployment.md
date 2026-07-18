# Deploy

## Supabase

1. Crie um projeto no Supabase.
2. Rode as migrations em ordem:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_reservation_creation_rpc.sql`
3. Confirme que os apartamentos 1 a 14 foram criados.
4. Crie os usuarios admin no Supabase Auth.
5. Troque o PIN inicial `1234` dos apartamentos antes do uso real.

## Vercel

Configure as variaveis de ambiente no projeto da Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APARTMENT_SESSION_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` deve ficar somente no servidor. Nao exponha esse valor no navegador ou em codigo client-side.

## Checklist

1. Rode `npm run test`.
2. Rode `npm run build`.
3. Suba para o repositorio conectado na Vercel.
4. Faca o deploy.
5. Abra `/login`, `/reservations`, `/credits`, `/metrics` e `/admin`.
6. Ajuste moradores e cotas em `/admin/apartments`.
7. Acompanhe uso e horarios de pico em `/admin/metrics`.
