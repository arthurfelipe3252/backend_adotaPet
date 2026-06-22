export enum Permission {
  USUARIOS_READ = 'usuarios:read',
  USUARIOS_WRITE = 'usuarios:write',
  USUARIOS_DELETE = 'usuarios:delete',

  ADOTANTES_READ = 'adotantes:read',
  ADOTANTES_WRITE = 'adotantes:write',
  ADOTANTES_DELETE = 'adotantes:delete',

  PROTETORES_READ = 'protetores:read',
  PROTETORES_WRITE = 'protetores:write',
  PROTETORES_DELETE = 'protetores:delete',

  PETS_READ = 'pets:read',
  PETS_WRITE = 'pets:write',
  PETS_DELETE = 'pets:delete',

  ADOPTION_REQUESTS_READ = 'adoption-requests:read',
  ADOPTION_REQUESTS_WRITE = 'adoption-requests:write',
  ADOPTION_REQUESTS_DELETE = 'adoption-requests:delete',

  CONVERSATIONS_READ = 'conversations:read',
  CONVERSATIONS_WRITE = 'conversations:write',

  MESSAGES_READ = 'messages:read',
  MESSAGES_WRITE = 'messages:write',

  QUESTIONARIO_READ = 'questionario:read',
  QUESTIONARIO_WRITE = 'questionario:write',

  REPORTS_READ = 'reports:read',
}
