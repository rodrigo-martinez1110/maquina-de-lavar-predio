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
- Mostrar a categoria do motivo na grade histórica para todos os moradores; manter detalhes escritos apenas no registro administrativo.
- Devolver todo o tempo reservado ao saldo semanal somente uma vez.
- Encerrar reservas sem aviso como concluídas após o horário previsto, preservando o histórico.
- Manter a opção “Terminei de usar” como ação opcional para encerrar a ocupação antes do horário final.

## Fluxo proposto

1. A reserva continua no status `reserved` quando começa; nenhum toque é necessário para mantê-la ativa.
2. Durante o intervalo reservado, o morador pode escolher “Não consegui usar” e informar um motivo: máquina ocupada, problema na máquina ou outro. Para “Outro”, pode informar um detalhe curto.
3. A confirmação muda a reserva para `unregistered`, salva a categoria para exibição na grade histórica, registra categoria, detalhe e apartamento responsável no log de auditoria, libera o horário restante para novas reservas e devolve todos os minutos reservados ao saldo semanal.
4. A ação só pode ser aplicada a uma reserva do próprio apartamento que ainda esteja em andamento e não tenha sido concluída ou cancelada. Repetições não podem gerar uma segunda devolução.
5. “Terminei de usar” continua disponível durante a reserva e encerra antecipadamente a ocupação, sem devolver minutos, conforme o comportamento atual.
6. Quando o horário termina sem ação do morador, a reserva passa de `reserved` para `finished`, sem devolução. Assim, esquecer confirmações não altera o saldo nem deixa uma marcação ativa indefinidamente.

## Registro do motivo

Guardar a categoria (`occupied`, `machine_problem` ou `other`) em `reservations` para mostrá-la na grade histórica a todos os moradores junto do status “Não conseguiu usar”. Usar o `audit_logs` existente com uma ação específica de reserva não utilizada; os metadados guardam a categoria, o detalhe de “Outro” e o apartamento responsável. O detalhe livre não aparece para os moradores, ficando somente no registro administrativo.

No dia atual, os blocos futuros liberados por uma marcação de não utilização devem continuar clicáveis e disponíveis para uma nova reserva, exibindo a categoria como anotação do histórico no mesmo bloco. Blocos cujo início já passou permanecem como histórico e não são apresentados como disponibilidade nova. Em datas passadas, a grade mostra o status e a categoria como evento histórico.

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
- Confirmar que a categoria fica visível na grade para todos e o detalhe livre fica restrito ao registro administrativo.
- Confirmar que, no dia atual, apenas os blocos liberados cujo início ainda não passou continuam disponíveis para nova reserva mesmo exibindo o evento de não utilização.
- Confirmar que a conclusão automática no fim do horário não devolve saldo e mantém a reserva no histórico.
- Confirmar que “Terminei de usar” continua liberando o restante do horário sem devolução.
- Executar a compilação de produção antes de publicar. Não adicionar nem executar testes nesta tarefa.
