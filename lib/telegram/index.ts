import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

type TelegramSendMessageResponse = {
  ok: boolean;
  description?: string;
};

type TelegramRequestResult = {
  statusCode: number;
  data: TelegramSendMessageResponse | null;
};

export function escapeTelegramHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function getProxyUrl() {
  return process.env.TELEGRAM_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
}

function postTelegramJson(methodName: string, payload: Record<string, unknown>): Promise<TelegramRequestResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');

  const url = new URL(`${TELEGRAM_API_BASE}/bot${token}/${methodName}`);
  const body = JSON.stringify(payload);
  const proxyUrl = getProxyUrl();

  if (proxyUrl) {
    return postTelegramJsonViaProxy(proxyUrl, url, body);
  }

  const requestOptions: https.RequestOptions = {
    method: 'POST',
    hostname: url.hostname,
    port: Number(url.port || 443),
    path: `${url.pathname}${url.search}`,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    timeout: 20_000,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        const data = JSON.parse(raw || 'null') as TelegramSendMessageResponse | null;

        resolve({
          statusCode: res.statusCode || 0,
          data,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Telegram request timeout'));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function postTelegramJsonViaProxy(
  proxyUrl: string,
  url: URL,
  body: string
): Promise<TelegramRequestResult> {
  const proxy = new URL(proxyUrl);
  const targetHost = url.hostname;

  return new Promise((resolve, reject) => {
    const socket = net.connect(Number(proxy.port || 80), proxy.hostname);
    let proxyResponse = '';
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(error);
    };

    const finish = (result: TelegramRequestResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    socket.setTimeout(20_000);
    socket.once('timeout', () => fail(new Error('Telegram proxy CONNECT timeout')));
    socket.once('error', fail);

    socket.once('connect', () => {
      const authHeader = proxy.username
        ? `Proxy-Authorization: Basic ${Buffer.from(
            `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`
          ).toString('base64')}\r\n`
        : '';

      socket.write(
        `CONNECT ${targetHost}:443 HTTP/1.1\r\n` +
          `Host: ${targetHost}:443\r\n` +
          authHeader +
          'Proxy-Connection: Keep-Alive\r\n\r\n'
      );
    });

    socket.on('data', function onProxyData(chunk) {
      proxyResponse += chunk.toString('utf8');
      if (!proxyResponse.includes('\r\n\r\n')) return;

      socket.off('data', onProxyData);

      if (!/^HTTP\/1\.[01] 200/i.test(proxyResponse)) {
        fail(new Error(`Telegram proxy CONNECT failed: ${proxyResponse.split('\r\n')[0]}`));
        return;
      }

      const secureSocket = tls.connect({ socket, servername: targetHost });
      secureSocket.setTimeout(20_000);
      secureSocket.once('timeout', () => fail(new Error('Telegram request timeout')));
      secureSocket.once('error', fail);
      secureSocket.once('secureConnect', () => {
        const request =
          `POST ${url.pathname}${url.search} HTTP/1.1\r\n` +
          `Host: ${targetHost}\r\n` +
          'Content-Type: application/json\r\n' +
          `Content-Length: ${Buffer.byteLength(body)}\r\n` +
          'Connection: close\r\n\r\n' +
          body;

        secureSocket.write(request);
      });

      const responseChunks: Buffer[] = [];

      secureSocket.on('data', (responseChunk) => {
        responseChunks.push(Buffer.from(responseChunk));
      });

      secureSocket.once('end', () => {
        const raw = Buffer.concat(responseChunks).toString('utf8');
        const [headerText, responseBody = ''] = raw.split('\r\n\r\n');
        const statusCode = Number(headerText.match(/^HTTP\/1\.[01] (\d+)/)?.[1] || 0);
        const data = JSON.parse(responseBody || 'null') as TelegramSendMessageResponse | null;

        finish({ statusCode, data });
      });
    });
  });
}

export async function sendTelegramMessage(chatId: number, text: string) {
  const { statusCode, data } = await postTelegramJson('sendMessage', {
      chat_id: chatId,
      text: text.slice(0, 4096),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
  });

  if (statusCode < 200 || statusCode >= 300 || !data?.ok) {
    throw new Error(data?.description || `Telegram sendMessage failed with ${statusCode}`);
  }

  return data;
}
