import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const distPath = path.join(__dirname, '..', 'dist');

function loadEnv() {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  return {
    apiKey: (process.env.DIFY_API_KEY || '').trim(),
    apiUrl: (process.env.DIFY_API_URL || 'https://api.dify.ai/v1').replace(/\/$/, ''),
    port: Number(process.env.PORT) || 3001,
  };
}

const app = express();
const { port: PORT } = loadEnv();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'リクエストの形式が正しくありません。' });
  }
  return next(error);
});

function toUserFacingError(status, data) {
  const apiMessage =
    (data && (data.message || data.error || data.code)) || '';

  if (status === 401) {
    return 'APIキーが無効です。.env の DIFY_API_KEY を確認してください。';
  }
  if (status === 404) {
    return 'Difyのアプリが見つかりません。APIキーと URL を確認してください。';
  }
  if (status === 429) {
    return 'リクエストが多すぎます。しばらく待ってから再試行してください。';
  }
  if (status >= 500) {
    return 'Dify側でエラーが発生しました。しばらくしてから再度お試しください。';
  }

  return apiMessage || 'AIからの応答取得に失敗しました。';
}

async function parseSseAnswer(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';
  let conversationId = '';
  let errorMessage = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      let event;
      try {
        event = JSON.parse(payload);
      } catch {
        continue;
      }

      if (event.conversation_id) {
        conversationId = event.conversation_id;
      }

      if (event.event === 'message' || event.event === 'agent_message') {
        answer += event.answer || '';
      }

      if (event.event === 'error') {
        errorMessage = event.message || 'Dify APIでエラーが発生しました。';
      }
    }
  }

  if (errorMessage) {
    const error = new Error(errorMessage);
    error.status = 502;
    throw error;
  }

  return { answer, conversation_id: conversationId };
}

app.post('/api/chat', async (req, res) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  const conversationId =
    typeof req.body?.conversation_id === 'string'
      ? req.body.conversation_id.trim()
      : '';
  const user =
    typeof req.body?.user === 'string' && req.body.user.trim()
      ? req.body.user.trim()
      : 'web-user';

  if (!query) {
    return res.status(400).json({ error: 'メッセージが空です。内容を入力してください。' });
  }

  const { apiKey, apiUrl } = loadEnv();

  if (!apiKey) {
    return res.status(500).json({
      error:
        'サーバーに DIFY_API_KEY が設定されていません。.env または公開先の環境変数を確認してください。',
    });
  }

  const payload = {
    inputs: {},
    query,
    response_mode: 'streaming',
    user,
    conversation_id: conversationId || '',
  };

  try {
    const difyResponse = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120000),
    });

    const contentType = difyResponse.headers.get('content-type') || '';

    if (!difyResponse.ok && !contentType.includes('text/event-stream')) {
      let data = {};
      try {
        data = await difyResponse.json();
      } catch {
        data = {};
      }

      return res.status(difyResponse.status).json({
        error: toUserFacingError(difyResponse.status, data),
      });
    }

    if (contentType.includes('text/event-stream')) {
      const result = await parseSseAnswer(difyResponse);
      if (!result.answer) {
        return res.status(502).json({
          error: 'AIから有効な回答を受け取れませんでした。もう一度お試しください。',
        });
      }

      return res.json({
        answer: result.answer,
        conversation_id: result.conversation_id,
      });
    }

    const data = await difyResponse.json();
    if (!data.answer) {
      return res.status(502).json({
        error: 'AIから有効な回答を受け取れませんでした。もう一度お試しください。',
      });
    }

    return res.json({
      answer: data.answer,
      conversation_id: data.conversation_id || '',
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return res.status(504).json({
        error: '応答がタイムアウトしました。もう一度お試しください。',
      });
    }

    console.error('Dify API error:', error);
    return res.status(500).json({
      error:
        error?.message ||
        'サーバーとの通信に失敗しました。しばらくしてから再度お試しください。',
    });
  }
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  const { apiKey } = loadEnv();
  console.log(`API server running on port ${PORT}`);
  console.log(`DIFY_API_KEY: ${apiKey ? 'loaded' : 'missing'}`);
});
