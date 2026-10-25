# Histórico de reservas na agenda

## Intenção

Permitir que moradores consultem marcações de datas passadas na própria grade da agenda, para recuperar o histórico que hoje desaparece quando uma reserva deixa de estar ativa.

## Abordagens

- **Grade com status — escolhida pelo usuário:** mostrar os registros da data na própria grade e identificar se estão reservados, concluídos, cancelados, liberados, sem comparecimento ou atrasados. Mantém a tela já conhecida e dá contexto a cada marcação.
- **Lista de histórico separada:** manter a grade apenas para horários ativos e acrescentar abaixo uma lista de eventos encerrados. Isso preserva a semântica atual da grade, mas divide as informações da mesma data em duas áreas.

## Objetivos

- Mostrar reservas de datas passadas mesmo quando seu status já não é `reserved`, `in_use` ou `late`.
- Identificar visualmente o status de cada registro histórico.
- Manter reservas canceladas no histórico sem tratá-las como ocupação ao calcular disponibilidade futura.
- Preservar o comportamento atual da agenda para hoje e datas futuras.

## Fora de escopo

- Restaurar registros que tenham sido apagados do banco de dados.
- Alterar as regras de criação, cancelamento ou contabilização de reservas.
- Alterar as permissões ou o acesso ao histórico.

## Restrições e decisões de implementação

- A agenda consulta `reservations` pelo intervalo local de São Paulo e hoje filtra apenas `reserved`, `in_use` e `late`.
- Para datas anteriores ao dia atual em São Paulo, a consulta deverá incluir todos os status. A grade mostrará o apartamento e o status do registro.
- Para hoje e datas futuras, somente status ativos continuam compondo a ocupação e os totais da agenda.
- Uma reserva cancelada continuará visível como evento histórico, mas não será considerada horário ocupado para cálculos de disponibilidade.
- Nenhuma alteração ou limpeza de dados no Supabase faz parte desta correção.

## Verificação

- Revisar a consulta, os tipos de domínio e os componentes da grade para confirmar que datas antigas exibem o status e datas futuras continuam usando somente reservas ativas.
- Não criar nem executar testes nesta tarefa.
