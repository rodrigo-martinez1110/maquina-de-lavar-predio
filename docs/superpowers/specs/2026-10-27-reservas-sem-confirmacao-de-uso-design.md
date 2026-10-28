# Reservas sem confirmação de início

## Intenção

Remover a dependência de o morador lembrar de tocar em “Comecei a usar”. A reserva conta como utilizada por padrão; quem não conseguiu usar a máquina registra o ocorrido durante o horário reservado e recebe de volta o tempo debitado.

## Abordagens

- **Uso presumido com exceção de não utilização — escolhida pelo usuário:** a reserva permanece ativa sem confirmação de início. O morador pode marcar “Não consegui usar” e escolher o motivo; a reserva é encerrada como não utilizada e os minutos são devolvidos uma única vez. Se não houver aviso, a reserva é concluída automaticamente no fim do horário.
- **Confirmação de início opcional:** manter “Comecei a usar” e acrescentar “Não consegui usar”. Isso cobre a falha de uso, mas conserva uma etapa que os moradores esquecem e que atualmente leva a liberações e devoluções indevidas.

## Objetivos

- Retirar “Comecei a usar” como etapa necessária para uma reserva continuar válida.
- Não liberar nem devolver saldo por ausência de confirmação de início.
- Permitir que o morador registre que não usou a máquina, com um motivo consultável no histórico.
- Devolver todo o tempo reservado ao saldo semanal somente uma vez.
- Encerrar reservas sem aviso como concluídas após o horário previsto, preservando o histórico.
- Manter a opção “Terminei de usar” como ação opcional para encerrar a ocupação antes do horário final.

## Fluxo proposto

1. A reserva continua no status `reserved` quando começa; nenhum toque é necessário para mantê-la ativa.
2. Durante o intervalo reservado, o morador pode escolher “Não consegui usar” e informar um motivo: máquina ocupada, problema na máquina ou outro. Para “Outro”, pode informar um detalhe curto.
3. A confirmação muda a reserva para `unregistered`, registra o motivo e o apartamento responsável no log de auditoria, libera o horário restante para novas reservas e devolve todos os minutos reservados ao saldo semanal.
4. A ação só pode ser aplicada a uma reserva do próprio apartamento que ainda esteja em andamento e não tenha sido concluída ou cancelada. Repetições não podem gerar uma segunda devolução.
5. “Terminei de usar” continua disponível durante a reserva e encerra antecipadamente a ocupação, sem devolver minutos, conforme o comportamento atual.
6. Quando o horário termina sem ação do morador, a reserva passa de `reserved` para `finished`, sem devolução. Assim, esquecer confirmações não altera o saldo nem deixa uma marcação ativa indefinidamente.

## Registro do motivo

Usar o `audit_logs` existente com uma ação específica de reserva não utilizada. Os metadados guardam o motivo escolhido e, quando aplicável, o detalhe de “Outro”. A grade histórica identifica o status como “Não conseguiu usar”.

## Concorrência e saldo

A transição de status, o crédito dos minutos e o registro de auditoria devem ser idempotentes em conjunto: dois envios, uma atualização repetida ou uma falha intermediária não podem devolver saldo mais de uma vez nem deixar a reserva marcada sem o crédito correspondente. A implementação deve usar uma operação transacional no Supabase para essas alterações relacionadas.

## Fora de escopo

- Alterar a criação de reservas, os limites de saldo ou as regras gerais de cancelamento.
- Devolver saldo para quem usou parcialmente a máquina.
- Permitir alegação de não utilização depois do término do horário.
- Notificar administradores ou moradores, ou bloquear novas reservas por causa do motivo registrado.

## Verificação

- Confirmar que reservas sem confirmação continuam bloqueando o horário até o fim.
- Confirmar que a ação de não utilização exige um motivo, aceita apenas reservas próprias em andamento e devolve o saldo uma única vez.
- Confirmar que a conclusão automática no fim do horário não devolve saldo e mantém a reserva no histórico.
- Confirmar que “Terminei de usar” continua liberando o restante do horário sem devolução.
- Executar a compilação de produção e os testes já existentes relevantes antes de publicar.
