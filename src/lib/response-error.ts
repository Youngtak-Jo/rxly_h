interface ErrorResponseBody {
  error?: string
  detail?: string
  message?: string
  err_msg?: string
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))]
}

export async function getResponseErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  let body: ErrorResponseBody | null = null

  try {
    body = (await response.json()) as ErrorResponseBody
  } catch {
    body = null
  }

  const detail = unique([
    body?.error,
    body?.detail,
    body?.message,
    body?.err_msg,
  ]).join(": ")

  if (detail) {
    return `${detail} (HTTP ${response.status})`
  }

  return `${fallback} (HTTP ${response.status})`
}
