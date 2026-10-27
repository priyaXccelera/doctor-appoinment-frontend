export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  return error instanceof Error && error.message ? error.message : fallback
}

export function errorCode(error: unknown): string {
  return (error as { code?: string })?.code ?? ''
}
