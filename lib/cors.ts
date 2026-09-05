import { NextResponse } from "next/server";

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  };
}

export function handleOptions(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export function jsonCorsResponse(
  body: any,
  init?: ResponseInit,
  req?: Request
): NextResponse {
  const response = NextResponse.json(body, init);
  const origin = req?.headers.get("origin") || "*";
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}
