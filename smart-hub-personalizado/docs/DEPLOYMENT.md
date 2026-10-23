# Implantação

## Estado atual

> **Não existe método de implantação comprovado para a Samsung UN48H4203AG.**
> O projeto está no nível de **protótipo executado no computador**. Nenhum pacote para a TV
> foi criado e nenhuma ação foi feita no aparelho.

Os motivos estão em [FEASIBILITY.md](FEASIBILITY.md#7-métodos-de-execução-investigados).
Em resumo:

- Loja oficial: fechada para modelos 2014.
- User App Sync (SDK 5.x): documentado para a geração 2014, mas não comprovado neste
  modelo e firmware. O SDK ainda não foi obtido de fonte oficial.
- Root SamyGO: rejeitado (altera o sistema e pode inutilizar a TV).

## Respostas às perguntas obrigatórias

| Pergunta | M2 — Navegador da TV | M3 — User App Sync |
|---|---|---|
| 1. Funciona especificamente na UN48H4203AG? | Desconhecido | Desconhecido |
| 2. Evidência para o firmware 1090.0? | Nenhuma | Nenhuma |
| 3. Exige alterar o firmware? | Não | Não (segundo [S1]) |
| 4. É reversível? | Sim (nada é instalado) | Provável: remover o app, sair da conta `develop`. O reset do Smart Hub remove apps baixados [S8] |
| 5. Há procedimento de recuperação documentado? | Não é necessário | Parcial (reset do Smart Hub [S8]) |
| 6. Risco de perder configurações ou inutilizar a TV? | Muito baixo | Baixo para inutilizar. Médio para perder apps e logins se for preciso resetar o Smart Hub |
| 7. Dados e permissões usados | Nenhum dado pessoal. Sem rede além do servidor local | Os mesmos. As permissões de app de usuário na plataforma são desconhecidas |
| 8. Alternativa menos arriscada? | Esta já é a de menor risco | Sim: M2 |

## Próximo passo possível (requer autorização explícita)

### Teste H-02 a H-05: protótipo no navegador da TV (sem instalação)

Pré-requisitos: PC e TV na mesma rede local e autorização do proprietário.

1. No PC: `cd smart-hub-personalizado && HOST=0.0.0.0 npm run serve`
2. Descobrir o IP local do PC (ex.: `192.168.0.10`).
3. Na TV: abrir o navegador web pelo Smart Hub e acessar
   `http://192.168.0.10:8080/diagnostics.html`. Fotografar os resultados e pressionar
   cada tecla do controle, anotando os códigos.
4. Acessar `http://192.168.0.10:8080/` e navegar pelo protótipo.
5. Encerrar o servidor no PC (Ctrl+C).
6. Registrar tudo em [TEST_PLAN.md](TEST_PLAN.md) e em
   [PLATFORM_COMPATIBILITY.md](PLATFORM_COMPATIBILITY.md).

Esse teste **não** instala nada, **não** altera configurações da TV e **não** comprova o
modo "app de usuário". Ele mede o navegador, que pode ser diferente do ambiente de apps.

### Depois: User App Sync (só se H-02 a H-05 forem positivos)

Não será documentado passo a passo enquanto não houver:

- o SDK 5.x obtido do portal oficial Samsung, com a documentação de 2014 lida na íntegra;
- confirmação de que o menu de *IP Setting* existe nesta TV (H-06, apenas observação);
- um procedimento de remoção do app escrito e revisado **antes** da primeira instalação.
