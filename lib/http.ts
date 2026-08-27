import { NextResponse } from "next/server";

export const jsonNoStore = <T>(body: T, init?: ResponseInit) => {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
};
