# Quiz Live PRO — primeira etapa

Projeto com tela pública do jogo e servidor local que distribui eventos em tempo real por WebSocket.

## Requisitos
- Node.js 18 ou superior
- Um computador ou hospedagem Node.js para executar o servidor

## Iniciar
1. Extraia o ZIP.
2. Abra um terminal na pasta do projeto.
3. Execute `npm install`.
4. Execute `npm start`.
5. Abra `http://localhost:3000`.

A tela não possui painel administrativo. O servidor recebe eventos no endpoint `POST /event` e os transmite para a tela.

## Formato dos eventos

Comentário:
```json
{
  "type": "comment",
  "eventId": "id-unico-123",
  "username": "Jogador",
  "comment": "abelha"
}
```

Presente:
```json
{
  "type": "gift",
  "eventId": "id-unico-124",
  "username": "Jogador",
  "giftName": "Rosa",
  "giftCount": 1
}
```

Envie para `http://localhost:3000/event` com `Content-Type: application/json`.
Se definir `EVENT_SECRET`, inclua também o cabeçalho `x-event-secret`.

Exemplo de teste (em outro terminal):
```bash
curl -X POST http://localhost:3000/event \
  -H "Content-Type: application/json" \
  -d '{"type":"comment","eventId":"teste-1","username":"Davi","comment":"abelha"}'
```

## Importante sobre a integração da LIVE
Este projeto já tem o receptor genérico e a tela em tempo real, mas ainda não inclui um conector específico da plataforma de transmissão. Um conector autorizado deverá transformar eventos recebidos em um dos dois formatos acima e enviar ao endpoint `/event`. Não coloque senhas, cookies ou tokens de sessão da conta no navegador ou no código público.

## Regras atuais do protótipo
- Comentários são aceitos se forem palavras cadastradas na categoria e começarem com a letra da rodada.
- Resposta correta: +10 pontos.
- Presente cujo nome contenha "rosa": +5 pontos por unidade; outros presentes: +10 pontos por unidade.
- A pontuação e os jogadores ficam na memória do servidor do navegador/jogo e reiniciam ao recarregar. Persistência será uma próxima etapa.
