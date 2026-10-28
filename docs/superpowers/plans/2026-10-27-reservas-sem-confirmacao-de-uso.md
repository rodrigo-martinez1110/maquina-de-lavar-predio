# Reservas sem confirmação de início Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover a confirmação obrigatória de início e permitir que o morador registre que não conseguiu usar a máquina, com motivo e devolução única do saldo.

**Architecture:** A reserva permanece ativa do início até o término agendado, sem botão “Comecei a usar”. Uma RPC transacional do Supabase valida titularidade, janela e motivo, muda o status para `unregistered`, devolve os minutos e grava a auditoria na mesma transação. Reservas ainda `reserved` são concluídas sem devolução quando o horário termina; “Terminei de usar” segue encerrando a ocupação antecipadamente.

**Tech Stack:** Next.js Server Actions, TypeScript, Supabase/PostgreSQL, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-10-27-reservas-sem-confirmacao-de-uso-design.md`

---

## Arquivos e responsabilidades

- Criar `supabase/migrations/0009_reservation_non_use.sql` para definir a RPC transacional de marcação de não utilização e as permissões de execução.
- Atualizar `src/lib/database.types.ts` para tipar a RPC.
- Atualizar `src/lib/repositories/reservations.ts` para chamar a RPC e concluir reservas vencidas sem estornar saldo.
- Atualizar `src/lib/actions/reservation-usage.ts` para expor a ação autenticada e revalidar as telas afetadas.
- Remover o antigo `startReservationAction` de `src/lib/actions/reservation-usage.ts` e a função não mais chamada `startReservation` de `src/lib/repositories/reservations.ts`.
- Atualizar `src/app/reservations/page.tsx` e `src/app/reservations/my-reservations.tsx` para manter a reserva não utilizada visível no cartão de hoje após salvar, remover “Comecei a usar”, conservar “Terminei de usar” e incluir o formulário de não utilização com motivo.
- Atualizar `src/lib/domain/schedule.ts`, `src/components/reservation-status.ts`, `src/components/ReservationDayOverview.tsx` e `src/components/ReservationTimeline.tsx` para carregar e exibir a categoria na grade histórica; blocos liberados no dia atual seguem livres e clicáveis.
- Atualizar `src/app/rules/page.tsx` para retirar a regra de confirmação de início e explicar como marcar a não utilização.

## Restrições globais

- Não adicionar nem executar testes nesta tarefa.
- Não devolver minutos em “Terminei de usar”; essa ação só libera o restante do intervalo.
- A marcação de não utilização só é permitida durante a reserva, para o próprio apartamento e enquanto o status for ativo (`reserved`, `in_use` ou `late`).
- A RPC rejeita motivos fora de `occupied`, `machine_problem` e `other`; detalhes opcionais de “other” têm limite de 160 caracteres.
- A categoria fica visível para todos na grade; detalhes livres ficam somente em `audit_logs`.
- A ação pode devolver o total estimado da reserva uma única vez. Erros ou reenvios não podem deixar status e saldo inconsistentes.
- Preservar `outputs/` e `scripts/` sem adicioná-los ao commit.

## Revisão principal

- Reservas sem clique inicial continuam bloqueando conflito e saldo durante o intervalo agendado.
- `unregistered` libera os horários futuros, permanece no histórico e não permite uma segunda devolução.
- A conclusão automática após `ends_at` muda apenas reservas ainda `reserved` para `finished`, sem estorno.
- A compilação de produção conclui com sucesso. Não executar testes segundo as restrições globais.

---

### Task 1: Criar a operação transacional de não utilização

**Files:**
- Create: `supabase/migrations/0009_reservation_non_use.sql`
- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: Criar a RPC com validações e bloqueios de linha**

Criar `report_reservation_nonuse(p_reservation_id uuid, p_apartment_id uuid, p_reason text, p_details text default null) returns void`, em PL/pgSQL, `security definer`, `set search_path = public`.

Adicionar a coluna `reservations.non_use_reason text` com `CHECK (non_use_reason in ('occupied', 'machine_problem', 'other'))`. Implementar estas verificações e escritas na mesma transação:

```sql
if p_reason is null or p_reason not in ('occupied', 'machine_problem', 'other') then
  raise exception 'Motivo invalido' using errcode = 'P0001';
end if;
if p_details is not null and p_reason <> 'other' then
  raise exception 'Detalhe permitido apenas para outro motivo' using errcode = 'P0001';
end if;
if p_details is not null and char_length(p_details) > 160 then
  raise exception 'Detalhe muito longo' using errcode = 'P0001';
end if;

select * into v_reservation
from reservations
where id = p_reservation_id
for update;

if not found or v_reservation.apartment_id <> p_apartment_id then
  raise exception 'Reserva nao encontrada' using errcode = 'P0001';
end if;
if v_reservation.status not in ('reserved', 'in_use', 'late')
   or now() < v_reservation.starts_at or now() >= v_reservation.ends_at then
  raise exception 'Reserva fora do periodo para marcar nao utilizacao' using errcode = 'P0001';
end if;

v_week_start := date_trunc(
  'week', v_reservation.starts_at at time zone 'America/Sao_Paulo'
)::date;
select * into v_balance
from weekly_balances
where apartment_id = p_apartment_id and week_start = v_week_start
for update;
if not found then
  raise exception 'Saldo semanal nao encontrado' using errcode = 'P0001';
end if;

update reservations
set status = 'unregistered', non_use_reason = p_reason,
    released_at = now(), updated_at = now()
where id = p_reservation_id;

update weekly_balances
set refunded_minutes = refunded_minutes + v_reservation.estimated_minutes,
    updated_at = now()
where id = v_balance.id;

insert into audit_logs (actor_kind, actor_id, action, entity_type, entity_id, metadata)
values ('apartment', p_apartment_id, 'reservation.not_used', 'reservation',
        p_reservation_id,
        jsonb_build_object('reason', p_reason, 'details', p_details,
                           'refundedMinutes', v_reservation.estimated_minutes));
```

Declare `v_reservation reservations%rowtype`, `v_balance weekly_balances%rowtype` e `v_week_start date`. Revoke execução de `public`, `anon` e `authenticated`; conceda apenas a `service_role`, pois a chamada passa pelo cliente Supabase de serviço após validar a sessão no servidor.

- [ ] **Step 2: Atualizar o tipo gerado da RPC**

Atualizar o tipo de linha, inserção e atualização de `reservations` com `non_use_reason: "occupied" | "machine_problem" | "other" | null` (opcional no tipo `Insert` e `Update`). Em `Database["public"]["Functions"]`, acrescentar:

```ts
report_reservation_nonuse: {
  Args: {
    p_apartment_id: string;
    p_details?: string | null;
    p_reason: string;
    p_reservation_id: string;
  };
  Returns: undefined;
};
```

Use o mesmo formato das funções RPC existentes nesse arquivo e mantenha a migration como fonte da assinatura.

A nova operação incrementa apenas `refunded_minutes`: o cálculo de saldo subtrai `reserved_minutes` e adiciona as devoluções. Não decrementar também `reserved_minutes` nessa operação, pois isso creditaria os mesmos minutos duas vezes.

### Task 2: Ligar a RPC ao servidor e revisar a reconciliação

**Files:**
- Modify: `src/lib/repositories/reservations.ts`
- Modify: `src/lib/actions/reservation-usage.ts`
- Modify: `src/lib/domain/schedule.ts`

- [ ] **Step 1: Criar a função de repositório**

Adicionar `ReservationNonUseReason = "occupied" | "machine_problem" | "other"` e o campo opcional `ScheduleReservation.nonUseReason?: ReservationNonUseReason | null` em `src/lib/domain/schedule.ts`. Adicionar `markReservationNotUsed(input: { reservationId: string; apartmentId: string; reason: ReservationNonUseReason; details?: string })`. Chamar `createServiceSupabaseClient().rpc("report_reservation_nonuse", { p_reservation_id: input.reservationId, p_apartment_id: input.apartmentId, p_reason: input.reason, p_details: input.details ?? null })` e propagar qualquer erro. Em `listReservationsForDay`, selecionar `non_use_reason` e mapeá-lo para `ScheduleReservation.nonUseReason`. Incluir `unregistered` também na consulta de hoje, sem incluí-lo entre status que criam conflito ou contagem de ocupação.

- [ ] **Step 2: Alterar a reconciliação de reservas não iniciadas**

Remover o fluxo que muda `reserved` para `released` após 30 minutos e chama `refundWeeklyBalanceForReservation`. Substituir por uma atualização de reservas vencidas:

```ts
await supabase
  .from("reservations")
  .update({ status: "finished", finished_at: nowIso, updated_at: nowIso })
  .eq("status", "reserved")
  .lte("ends_at", nowIso);
```

Manter a reconciliação atual de `in_use` para `late`, para registros ativos antigos ou estados existentes. Tratar e lançar o erro da atualização, seguindo o padrão atual.

- [ ] **Step 3: Adicionar a Server Action autenticada**

Em `reservation-usage.ts`, ler `reservationId`, `reason` e `details` do `FormData`; trimar `details` e convertê-lo para `null` quando estiver vazio; rejeitar ID vazio, motivo inválido, detalhes não vazios quando o motivo não for `other` e detalhes acima de 160 caracteres; obter `getApartmentSession()` e rejeitar sessão ausente. Chamar `markReservationNotUsed` com o apartamento da sessão, nunca com um apartamento informado pelo formulário. Em sucesso, revalidar `/reservations` e `/`.

### Task 3: Atualizar a experiência do morador e as regras

**Files:**
- Modify: `src/app/reservations/page.tsx`
- Modify: `src/app/reservations/my-reservations.tsx`
- Modify: `src/lib/actions/reservation-usage.ts`
- Modify: `src/lib/repositories/reservations.ts`
- Modify: `src/components/reservation-status.ts`
- Modify: `src/app/rules/page.tsx`

- [ ] **Step 1: Retirar a confirmação inicial**

Remover o import e o botão `startReservationAction`/“Comecei a usar”, além da ação e da função de repositório que ficarem sem uso. Exibir “Terminei de usar” quando `startsAtIso <= now < endsAtIso` e o status for `reserved`, `in_use` ou `late`. Para registros antigos com status `late` após o fim, conservar o botão até que o morador encerre, preservando a chamada atual de `finishReservationAction`. Atualizar a filtragem de `myReservations` em `page.tsx` para incluir reservas `unregistered` próprias de hoje; renderizar o status e a categoria no cartão sem botões de cancelar, terminar ou marcar novamente, para manter a confirmação visível depois da revalidação.

- [ ] **Step 2: Incluir formulário de não utilização**

Exibir a ação apenas quando `startsAtIso <= now < endsAtIso` e o status for `reserved`, `in_use` ou `late`. O formulário precisa enviar o ID, exigir um dos três motivos e oferecer detalhe opcional de até 160 caracteres somente quando o motivo for “Outro”. Apresentar mensagens de sucesso e erro em português. Como o cartão precisa de formulários separados, trocar o formulário externo por um contêiner e manter forms independentes para cancelar, terminar e marcar não utilização; preservar as regras atuais de cancelamento.

- [ ] **Step 3: Traduzir o novo status**

Em `src/lib/domain/schedule.ts`, adicionar `nonUseReason?: ReservationNonUseReason | null` aos slots `busy` e `history` e a cada item de `additionalReservations`. Adicionar `historyReservations?: Array<{ apartmentNumber: number; reservationStatus: ReservationStatus; nonUseReason: ReservationNonUseReason | null }>` aos slots `free` para anotações em blocos disponíveis.

Em `buildDaySlots`, se a data for hoje, não existir uma reserva ativa no bloco e houver uma marcação `unregistered`, criar um slot `free` com a anotação correspondente; assim o bloco fica livre para reserva e entra em `buildFreeWindows`. Em slots ocupados por uma reserva ativa, manter a reserva ativa em primeiro lugar e carregar os motivos de eventos adicionais em `additionalReservations`. Para datas passadas, manter status `history` e motivo de cada marcação.

Em `reservation-status.ts`, mapear `unregistered` para `Não conseguiu usar` e adicionar rótulos de categoria (`Máquina ocupada`, `Problema na máquina`, `Outro`); não alterar os rótulos dos demais status.

- [ ] **Step 4: Mostrar categoria na grade histórica e nas anotações do dia**

Atualizar `ReservationDayOverview` e `ReservationTimeline` para renderizar categoria junto ao evento `unregistered`, inclusive quando esse evento aparece dentro de um bloco livre de hoje. Manter os blocos livres clicáveis e deixá-los incluídos em `buildFreeWindows`; status de uso ativo continua bloqueando os horários. Não renderizar os detalhes livres de auditoria.

- [ ] **Step 5: Corrigir o texto das regras**

Remover a instrução de tocar em “Comecei a usar”. Informar que a reserva é considerada utilizada no horário reservado e que, se não conseguir usar, a pessoa deve marcar o ocorrido durante o período para receber os minutos de volta.

### Task 4: Conferir integração e compilar

**Files:**
- Review: `supabase/migrations/0009_reservation_non_use.sql`
- Review: `src/lib/repositories/reservations.ts`
- Review: `src/app/reservations/my-reservations.tsx`
- Review: `src/app/reservations/page.tsx`
- Review: `src/lib/actions/reservation-usage.ts`
- Review: `src/lib/repositories/reservations.ts`
- Review: `src/lib/domain/schedule.ts`
- Review: `src/components/ReservationDayOverview.tsx`
- Review: `src/components/ReservationTimeline.tsx`
- Review: `src/components/reservation-status.ts`

- [ ] **Step 1: Revisar os caminhos de atualização e os status**

Confirmar que `buildDaySlots`, conflitos e resumo diário consideram apenas `reserved`, `in_use` e `late` como ocupação. `unregistered` e `finished` não bloqueiam. No dia atual, blocos com eventos `unregistered` continuam livres para reserva e mostram apenas a categoria; em datas passadas, a grade mostra status e categoria. O detalhe livre permanece somente em `audit_logs`. Confirmar que a devolução soma os minutos a `refunded_minutes` sem decrementar também `reserved_minutes`, para recompor o saldo sem crédito em duplicidade.

- [ ] **Step 2: Conferir formatação dos arquivos**

Rodar `git diff --check`; esperado: nenhuma saída.

- [ ] **Step 3: Compilar produção**

Executar `node node_modules/next/dist/bin/next build` com o Node configurado no ambiente. Esperado: build e verificação TypeScript terminam com código zero.

Não executar testes nesta tarefa.
