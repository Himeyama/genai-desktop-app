const mockSession = {
  tokens: {
    idToken: {
      payload: { sub: 'local-user' } as Record<string, unknown>,
      toString: () => 'local-dev-token',
    },
    accessToken: {
      payload: { 'cognito:groups': ['SystemAdminGroup'] } as Record<string, unknown>,
    },
  },
};

export const useAuth = () => {
  return { data: mockSession };
};
