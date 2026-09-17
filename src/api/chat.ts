export type ChatApiResponse = {
  answer: string;
  conversation_id: string;
};

type ChatApiErrorBody = {
  error?: string;
};

export async function sendChatMessage(params: {
  query: string;
  conversationId?: string;
  user: string;
}): Promise<ChatApiResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: params.query,
        conversation_id: params.conversationId || undefined,
        user: params.user,
      }),
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(
        'サーバーに接続できません。バックエンドが起動しているか確認してください。'
      );
    }

    let data: ChatApiResponse & ChatApiErrorBody;
    try {
      data = await response.json();
    } catch {
      throw new Error('サーバーからの応答を読み取れませんでした。');
    }

    if (!response.ok || data.error) {
      throw new Error(data.error || 'AIからの応答取得に失敗しました。');
    }

    if (!data.answer) {
      throw new Error('AIから有効な回答を受け取れませんでした。');
    }

    return {
      answer: data.answer,
      conversation_id: data.conversation_id || '',
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('応答がタイムアウトしました。もう一度お試しください。');
    }

    if (error instanceof TypeError) {
      throw new Error(
        'サーバーに接続できません。バックエンドが起動しているか確認してください。'
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function getOrCreateUserId(): string {
  const storageKey = 'dify-chat-user-id';
  try {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;

    const userId = crypto.randomUUID();
    window.localStorage.setItem(storageKey, userId);
    return userId;
  } catch {
    return crypto.randomUUID();
  }
}
