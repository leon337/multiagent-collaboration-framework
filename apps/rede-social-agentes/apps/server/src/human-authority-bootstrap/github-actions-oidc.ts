export async function requestGithubActionsOidcToken(
  requestUrl: string,
  requestToken: string,
  audience: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const url = new URL(requestUrl);
  url.searchParams.set('audience', audience);
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: { authorization: `Bearer ${requestToken}`, accept: 'application/json' },
  });
  if (!response.ok)
    throw new Error(`GitHub OIDC token request failed with HTTP ${response.status}.`);
  const body = (await response.json()) as { value?: unknown };
  if (typeof body.value !== 'string' || body.value.length < 10) {
    throw new Error('GitHub OIDC token response was invalid.');
  }
  return body.value;
}
