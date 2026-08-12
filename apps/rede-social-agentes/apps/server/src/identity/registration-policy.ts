function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function parseRegistrationAllowlist(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(',')
        .map(normalizeEmail)
        .filter((email) => email.length > 0),
    ),
  ];
}

export function registrationIsAllowed(
  email: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NODE_ENV !== 'production') {
    return true;
  }

  return parseRegistrationAllowlist(env.REGISTRATION_ALLOWLIST).includes(normalizeEmail(email));
}
