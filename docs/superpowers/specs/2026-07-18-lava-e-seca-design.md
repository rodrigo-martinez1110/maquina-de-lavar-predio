# Lava e Seca Compartilhada - Design

Data: 2026-07-18

## Objetivo

Criar um app web responsivo, hospedado na Vercel, para organizar o uso de uma unica maquina lava e seca LG 16/10 kg em um predio com 14 apartamentos. O app deve funcionar bem no celular e tambem no PC.

O sistema deve permitir reservas justas, uso em cima da hora, transferencia direta de horas entre apartamentos, historico auditavel e metricas para administracao e moradores.

## Escopo do MVP

O MVP inclui:

- login de moradores por numero do apartamento e PIN;
- login de admins separado;
- apartamentos numerados de 1 a 14;
- agenda da semana atual e da proxima semana;
- reservas entre 07:00 e 23:00;
- bloqueio de uso entre 23:00 e 07:00;
- cotas semanais por apartamento;
- uso de saldo em blocos de 30 minutos;
- reserva comum e botao "usar agora";
- registro de tempo estimado e tempo real;
- liberacao antecipada da maquina;
- cancelamento com regra de devolucao;
- atraso com desconto extra e notificacao interna;
- ofertas e pedidos de horas entre apartamentos;
- historico e logs auditaveis;
- painel admin com metricas;
- metricas agregadas para moradores sobre dias e horarios de pico.

Fica fora do MVP:

- notificacoes por WhatsApp, email ou push;
- cobranca extra automatica para horario de pico;
- app nativo;
- cadastro de nomes, telefones ou emails dos moradores;
- painel publico de lavanderia em tablet.

## Usuarios

### Apartamento

Cada apartamento usa o app com numero do apto e PIN. Nao ha usuario individual por morador.

O apartamento pode:

- ver saldo semanal;
- ver agenda;
- criar reserva;
- usar agora;
- cancelar reserva;
- iniciar uso quando a maquina estiver livre e houver uma reserva propria nos proximos 30 minutos;
- liberar maquina antes do fim;
- registrar tempo real usado;
- oferecer horas;
- pedir horas;
- aceitar ofertas ou atender pedidos de outros apartamentos;
- ver notificacoes internas;
- ver metricas agregadas de horarios mais usados.

### Admin

Admins entram por uma area separada em `/admin`, usando autenticacao de admin. Pode existir mais de um admin.

O admin pode:

- gerenciar apartamentos 1 a 14;
- definir ou redefinir PIN;
- definir numero de moradores;
- aplicar ajuste manual de cota;
- corrigir reservas, saldos e registros de uso;
- ver notificacoes e ocorrencias;
- ver logs auditaveis;
- analisar metricas de uso.

## Cota Semanal

Cada apartamento recebe uma cota semanal calculada assim:

```text
cota = 6h + 30min por morador extra acima de 1 + ajuste manual do admin
```

Exemplos:

- 1 morador: 6h por semana;
- 2 moradores: 6h30 por semana;
- 2 moradores com ajuste manual de +30min: 7h por semana.

As horas expiram ao fim da semana. Nao ha acumulacao automatica para a semana seguinte.

Reservas podem ultrapassar a cota base quando o apartamento recebeu horas de outros apartamentos. O saldo disponivel da semana considera cota base, ajustes manuais, horas recebidas, horas cedidas, reservas, cancelamentos, liberacoes e atrasos.

## Agenda e Reservas

A maquina e tratada como um unico recurso compartilhado. Enquanto uma reserva estiver ocupando um periodo, nenhuma outra reserva pode sobrepor esse horario.

Regras:

- calendario aberto para semana atual e proxima semana;
- reservas apenas entre 07:00 e 23:00;
- intervalo de 23:00 a 07:00 bloqueado;
- menor unidade de reserva: 30 minutos;
- duracao minima: 30 minutos;
- duracao maxima normal: 4 horas;
- tipos de uso: lavar, secar, lavar + secar e personalizado;
- a reserva guarda tempo estimado antes do uso;
- depois do uso, o apartamento pode registrar o tempo real.

O app deve oferecer atalhos comuns, mas permitir duracao personalizada em blocos de 30 minutos, porque a maquina calcula o tempo real conforme a carga/programa.

## Status da Reserva

Status previstos:

- reservada;
- em uso;
- finalizada;
- liberada;
- cancelada;
- nao registrada;
- atrasada.

A reserva entra automaticamente em "em uso" no horario marcado. O app tambem mostra "iniciar agora" quando a maquina estiver livre e houver uma reserva propria com inicio nos proximos 30 minutos.

## Usar Agora

O botao "usar agora" permite criar uma reserva imediata quando:

- a maquina esta livre;
- o horario atual esta dentro do periodo permitido;
- o apartamento tem saldo suficiente;
- a duracao escolhida respeita os limites.

A cobranca usa blocos de 30 minutos. A interface deve deixar claro quanto saldo sera consumido.

## Cancelamento e Liberacao

Cancelamento:

- cancelar ate 1 hora antes do inicio devolve o credito automaticamente;
- cancelar com menos de 1 hora antes nao devolve credito automaticamente;
- admin pode corrigir excecoes manualmente.

Liberacao antecipada:

- se o apartamento terminar antes e tocar em "liberar maquina", o saldo restante volta ao apartamento;
- o horario restante volta a ficar disponivel para outros;
- se o apartamento apenas registrar depois que usou menos tempo, o historico guarda o tempo real, mas o saldo bloqueado nao volta automaticamente;
- admin pode corrigir casos excepcionais.

Se a pessoa nao registrar tempo real depois da reserva, o sistema considera o tempo reservado como usado.

## Atrasos

Se o uso passar do horario reservado:

- o tempo extra e descontado do saldo do apartamento arredondando para cima em blocos de 30 minutos;
- uma notificacao interna e gerada;
- o atraso entra nos logs e metricas;
- se houver impacto em outra reserva, o evento fica visivel para admin revisar.

O MVP deve registrar e descontar atraso, mas nao precisa resolver automaticamente conflito social entre moradores. Admin pode corrigir excecoes.

## Mercado Interno de Horas

O app tera dois modos:

- ofertas de horas: um apartamento oferece parte do saldo semanal que nao pretende usar;
- pedidos de horas: um apartamento solicita horas extras.

Transferencias acontecem diretamente entre apartamentos, sem aprovacao previa do admin.

Regras:

- um pedido pode ser atendido parcialmente;
- varios apartamentos podem atender partes do mesmo pedido;
- horas transferidas valem apenas na semana correspondente;
- tudo entra no historico;
- admin pode revisar e corrigir casos problematicos.

## Privacidade e Transparencia

Todos os apartamentos podem ver:

- horarios ocupados;
- numero do apartamento que reservou cada horario.

O app nao armazena nomes, telefones ou contatos de moradores no MVP.

## Notificacoes

O MVP usa apenas notificacoes internas no app.

Eventos que geram notificacao:

- atraso registrado;
- pedido de horas atendido;
- oferta aceita;
- saldo recebido;
- correcao feita pelo admin quando relevante;
- reserva impactada por atraso de outra reserva anterior.

## Metricas

### Admin

O painel admin deve mostrar:

- horas usadas por apartamento por semana e mes;
- ranking de quem usa mais e menos;
- atrasos;
- uso acima do reservado;
- horas cedidas e recebidas;
- cancelamentos;
- reservas sem registro de tempo real;
- ocupacao da maquina por dia e horario;
- dias e horarios preferidos;
- tendencias de uso.

### Moradores

Moradores devem ver metricas agregadas, sem tom punitivo:

- horarios mais usados;
- dias mais disputados;
- sugestoes de horarios mais tranquilos;
- aviso visual quando um horario costuma ser de pico.

No MVP, horarios de pico nao custam mais credito. A decisao de adicionar custo maior ou limite de pico fica para evolucao futura, depois de haver dados reais.

## Arquitetura

Stack:

- Next.js para app web responsivo;
- Vercel para hospedagem;
- Supabase Postgres para banco de dados;
- Supabase Auth para admins;
- login customizado por apartamento + PIN para moradores;
- server actions ou API routes para regras de negocio.

Validacoes importantes devem ocorrer no servidor e/ou no banco, nao apenas no frontend:

- saldo suficiente;
- conflito de horario;
- intervalo permitido;
- duracao maxima;
- permissao do usuario;
- integridade de transferencia de horas.

## Modelo de Dados Inicial

Tabelas principais:

- `apartments`: apartamentos 1 a 14, hash do PIN, numero de moradores, ajuste manual de cota, status ativo;
- `admin_users`: admins autorizados;
- `weekly_balances`: cota e saldo calculado por apartamento e semana;
- `reservations`: reservas com apto, horario, tipo, tempo estimado, tempo real, status;
- `credit_transfers`: ofertas, pedidos e transferencias aceitas;
- `notifications`: notificacoes internas;
- `audit_logs`: historico de acoes relevantes;
- views ou queries agregadas para metricas de uso e horarios de pico.

O PIN deve ser salvo com hash, nunca em texto puro.

## Telas Principais

### Morador

- login por apartamento e PIN;
- painel inicial com saldo, proxima reserva e acoes rapidas;
- agenda semanal;
- criar reserva;
- usar agora;
- detalhes da reserva;
- liberar maquina;
- registrar tempo real;
- ceder horas;
- pedir horas;
- ofertas e pedidos disponiveis;
- notificacoes;
- metricas de pico.

### Admin

- login admin;
- dashboard;
- apartamentos;
- reservas;
- saldos e ajustes;
- logs;
- metricas;
- configuracoes basicas.

## Testes

Testes minimos:

- calculo da cota semanal;
- criacao de reserva com saldo suficiente;
- bloqueio de reserva sem saldo;
- bloqueio de conflito de horario;
- bloqueio do intervalo 23:00-07:00;
- limite de 30 minutos a 4 horas;
- cancelamento com devolucao;
- cancelamento sem devolucao;
- liberacao antecipada;
- atraso com desconto extra;
- transferencia parcial de horas;
- expiracao semanal;
- permissao de admin versus apartamento;
- PIN salvo com hash.

## Decisoes Futuras

Possiveis evolucoes:

- notificacao por push, email ou WhatsApp;
- custo maior para horarios de pico;
- limite semanal de horarios de pico;
- painel publico para lavanderia;
- cadastro opcional de contatos;
- exportacao de relatorios;
- auditoria mais avancada para disputas.
