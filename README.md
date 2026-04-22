# my-server

Express backend with OpenAI (chat + TTS).

## Setup

```bash
npm install
cp .env.example .env   # add your OPENAI_API_KEY
npm start
```

## Endpoints

- `GET /` — health check
- `POST /assistant` — body `{ "text": "..." }`, returns `audio/mpeg`
