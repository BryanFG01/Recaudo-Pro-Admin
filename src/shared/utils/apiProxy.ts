import { NextRequest, NextResponse } from 'next/server';

export async function handleProxy(req: NextRequest) {
  // Capture the URL path (WITHOUT stripping /api, as the backend expects it)
  const path = req.nextUrl.pathname;
  
  // Define default backend URL
  const backendUrl = process.env.VITE_BACK_URL || 'https://api.recaudopro.cloud/';
  
  const targetUrl = `${backendUrl.replace(/\/$/, '')}${path}${req.nextUrl.search}`;

  try {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.delete('host');
    requestHeaders.delete('referer');
    requestHeaders.delete('connection');
    requestHeaders.delete('keep-alive');
    requestHeaders.delete('proxy-authenticate');
    requestHeaders.delete('proxy-authorization');
    requestHeaders.delete('te');
    requestHeaders.delete('trailer');
    requestHeaders.delete('transfer-encoding');
    requestHeaders.delete('upgrade');

    let body: any = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
      try {
        body = await req.text();
      } catch (e) {
        body = undefined;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: requestHeaders,
        body,
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const responseHeaders = new Headers(response.headers);
      responseHeaders.delete('content-encoding');
      responseHeaders.delete('content-length'); 

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Backend request timed out after 15s');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error(`❌ API Proxy Error [${path}]:`, error);
    return NextResponse.json(
      { 
        error: 'Error al conectar con el servidor backend.',
        details: error instanceof Error ? error.message : String(error),
        path 
      }, 
      { status: 504 } // Gateway Timeout or Service Unavailable
    );
  }
}
