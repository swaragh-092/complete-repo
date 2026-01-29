export function getQueryParams(search) {
  const params = new URLSearchParams(search);
  return {
    client: params.get('client'),
    redirect_uri: params.get('redirect_uri'),
    state: params.get('state'),
    error: params.get('error'),
    access_token: params.get('access_token')
  };
}
