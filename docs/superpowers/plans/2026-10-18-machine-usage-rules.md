# Regras de uso e estado da máquina

## Objetivo

Aplicar a política atual do condomínio e reduzir conflitos: cada apartamento recebe 10h por semana, pode reservar no máximo 8h no mesmo dia, e todos conseguem ver e atualizar o estado operacional da máquina.

## Escopo

1. Atualizar a cota-base para 10h semanais sem alterar ajustes manuais existentes; preservar o limite diário de 8h.
2. Corrigir o estorno de saldo ao cancelar uma reserva elegível.
3. Adicionar ciclo de uso: iniciar/check-in, finalizar e liberar automaticamente reservas sem check-in após 30 minutos.
4. Adicionar status público da máquina: livre, reservada, em uso, atrasada, problema relatado e manutenção.
5. Permitir que qualquer morador autenticado informe início, término, ocupação indevida ou problema; exigir confirmação do administrador para marcar manutenção oficial.
6. Bloquear novas reservas quando houver problema/manutenção ativo e avisar o próximo usuário quando houver atraso.
7. Criar tela de regras claras, com exemplos práticos e registro da versão lida pelo apartamento.

## Abordagem

- Usar migrações incrementais para campos de ciclo de reserva, relatos da máquina, notificações e leitura das regras.
- Centralizar regras temporais e de status em funções de domínio testáveis.
- Reconciliar reservas vencidas quando a agenda/status for carregada, evitando depender de cron para o comportamento básico.
- Manter autorização no servidor: moradores só operam a própria reserva, relatam incidentes e encerram o próprio uso; ações oficiais de manutenção ficam restritas ao admin.

## Verificação

- Testes unitários primeiro para quota, limite diário, cancelamento, check-in, expiração, extensão e status.
- Testes de ações/repositórios para autorização e transições.
- Testes de componentes para regras e controles de status.
- Rodar suíte completa, lint e build antes de entregar.
