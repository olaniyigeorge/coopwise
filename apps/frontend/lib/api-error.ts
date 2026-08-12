
export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, body: unknown, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}





export function getApiErrorDetail(err: unknown): Record<string, any> | null {
  if (!err || typeof err !== "object") return null;

  // Patched shape: ApiError with a parsed .body
  if ("body" in err && err.body && typeof err.body === "object") {
    const body = (err as { body: any }).body;
    return body.detail ?? body ?? null;
  }

  // Fallback: parse "...): {json}" out of a plain Error message
  if (err instanceof Error) {
    const jsonStart = err.message.indexOf("{");
    if (jsonStart !== -1) {
      try {
        const parsed = JSON.parse(err.message.slice(jsonStart));
        return parsed.detail ?? parsed ?? null;
      } catch {
        return null;
      }
    }
  }

  return null;
}