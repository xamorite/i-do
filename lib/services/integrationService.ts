// Placeholder integration helpers
export async function listIntegrations(userId: string) {
  return [];
}

export async function addIntegration(userId: string, service: string, config: any) {
  return { id: 'int_mock', service };
}
