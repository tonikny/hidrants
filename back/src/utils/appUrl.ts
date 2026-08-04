import os from 'node:os';
import { config } from '../config.js';

/** Troba la primera IP IPv4 no interna del servidor (ex. 192.168.1.138). */
function lanIp(): string | null {
  const ifaces = os.networkInterfaces();
  for (const list of Object.values(ifaces)) {
    for (const i of list ?? []) {
      if (i.family === 'IPv4' && !i.internal) {return i.address;}
    }
  }
  return null;
}

/**
 * URL base per als enllaços de Telegram.
 * Usa el Host de la petició (domini o IP:port real de l'accés),
 * però si el Host és un buclic (localhost/127.0.0.1), el substituïx
 * per la IP LAN del servidor, perquè Telegram no renderitza els
 * buclics com a enllaços.
 */
export function appBaseUrl(req: { headers?: { host?: string; 'x-forwarded-proto'?: string } }): string {
  let host = req.headers?.host;
  if (host) {
    const [hostname, port] = host.split(':');
    if (/^localhost$/i.test(hostname) || hostname === '127.0.0.1' || hostname === '::1') {
      const ip = lanIp();
      if (ip) {host = port ? `${ip}:${port}` : ip;}
    }
  }
  const protocol = req.headers?.['x-forwarded-proto'] || 'https';
  return host ? `${protocol}://${host}` : `https://${config.BASE_DOMAIN_URL}`;
}