// Seed focado na interface de PROTETOR/ONG (Arthur).
// Arthur (arthur@gmail.com / arthur30052006) é protetor em prod.
// Estratégia: muitos pets do Arthur, muitos adotantes solicitando,
// status variados pra dashboard/listas funcionarem visualmente.
//
// Uso: node scripts/seed-frontend-data.mjs
// Pré-requisito: API rodando em https://adotapet-api.upperlavtech.com/api/v1

const BASE =
  process.env.API_BASE ?? 'https://adotapet-api.upperlavtech.com/api/v1';

const CPFS = {
  maria: '11144477735',
  carlos: '90880809841',
  joaoProtetor: '07657392835',
  ana: '98560171304',
  pedro: '31528808800',
  julia: '97912079335',
  rafael: '19622580769',
  beatriz: '83291352416',
  thiago: '49379697813',
};
const CNPJ_ONG = '11444777000161';

const DOC_BASE64 =
  'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2c+PgplbmRvYmoKdHJhaWxlcjw8L1Jvb3QgMSAwIFI+Pgo=';

const FOTOS = {
  caoGolden: [
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
  ],
  caoFilhote: [
    'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=600&q=80',
  ],
  caoViraLata: [
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&q=80',
    'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=600&q=80',
  ],
  caoLabrador: [
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80',
  ],
  caoPequeno: [
    'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=600&q=80',
  ],
  caoPastor: [
    'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600&q=80',
  ],
  caoPoodle: [
    'https://images.unsplash.com/photo-1616190264687-b7ebf4b35c12?w=600&q=80',
  ],
  caoBeagle: [
    'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=600&q=80',
  ],
  caoBulldog: [
    'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=600&q=80',
  ],
  caoHusky: [
    'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=600&q=80',
  ],
  gatoCinza: [
    'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=600&q=80',
  ],
  gatoLaranja: [
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80',
  ],
  gatoPreto: [
    'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&q=80',
  ],
  gatoBranco: [
    'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600&q=80',
  ],
  gatoSiames: [
    'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=600&q=80',
  ],
  gatoMalhado: [
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&q=80',
  ],
  gatoBebe: [
    'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=600&q=80',
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg = data?.message ?? text;
    throw new Error(
      `${method} ${path} → ${res.status}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`,
    );
  }
  return data;
}
function safeJson(t) {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}
async function tryCreate(label, fn) {
  try {
    const r = await fn();
    console.log(`  ✓ ${label}`);
    return r;
  } catch (e) {
    if (String(e.message).match(/409|j.+cadastrad/i)) {
      console.log(`  ↻ ${label} (já existe)`);
      return null;
    }
    throw e;
  }
}
async function login(email, senha) {
  const r = await req('POST', '/users/auth/login', { email, senha });
  return r.accessToken;
}
const enderecoSP = (numero) => ({
  logradouro: 'Av. Paulista',
  numero: String(numero),
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01310100',
});
const enderecoRJ = (numero) => ({
  logradouro: 'Rua das Laranjeiras',
  numero: String(numero),
  bairro: 'Laranjeiras',
  cidade: 'Rio de Janeiro',
  estado: 'RJ',
  cep: '22240003',
});
const enderecoBH = (numero) => ({
  logradouro: 'Av. Afonso Pena',
  numero: String(numero),
  bairro: 'Centro',
  cidade: 'Belo Horizonte',
  estado: 'MG',
  cep: '30130001',
});

// Workaround: prod retorna POST /adoptions sem o `id` (criação void).
// GET → filtra por petId → pega a mais recente. Idempotente por pet+adotante.
async function createAdoptionAndGetId(token, body) {
  const existing = await req('GET', '/adoptions', null, token);
  const m = existing.find((r) => r.petId === body.petId);
  if (m?.id) return m;
  await req('POST', '/adoptions', body, token);
  const list = await req('GET', '/adoptions', null, token);
  const matches = list
    .filter((r) => r.petId === body.petId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  if (!matches[0]?.id) {
    throw new Error(`Falha ao recuperar id para petId ${body.petId}`);
  }
  return matches[0];
}

async function createConversationAndGetId(token, adoptionRequestId) {
  await req('POST', '/chat/conversations', { adoptionRequestId }, token);
  const list = await req('GET', '/chat/conversations', null, token);
  const found = list.find((c) => c.adoptionRequestId === adoptionRequestId);
  if (!found?.id) {
    throw new Error(`Falha ao recuperar id da conversa ${adoptionRequestId}`);
  }
  return found;
}

async function createPetsIfMissing(label, token, petList) {
  const me = await req('GET', '/users/protetores-ongs/me', null, token);
  const protetorId = me.id;
  const existentes = await req(
    'GET',
    `/pets/protetor/${protetorId}`,
    null,
    token,
  );
  const byNome = new Map(existentes.map((p) => [p.nome, p]));
  const out = [];
  for (const p of petList) {
    if (byNome.has(p.nome)) {
      console.log(`  ↻ ${p.nome} (já existe em ${label})`);
      out.push(byNome.get(p.nome));
      continue;
    }
    const r = await req('POST', '/pets', p, token);
    out.push(r);
    console.log(`  ✓ ${p.nome} (${label})`);
  }
  return out;
}

async function patchStatus(reqId, status, token) {
  await req('PATCH', `/adoptions/${reqId}/status`, { status }, token);
}

async function patchPetStatus(petId, status, token) {
  await req('PATCH', `/pets/${petId}`, { status }, token);
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log('═══ Seed — interface Protetor/ONG (PRODUÇÃO) ═══\n');

  // ─── 1. Adotantes (8 no total) ────────────────────────────────
  console.log('1. Adotantes:');
  const adotantes = [
    {
      key: 'maria',
      nome: 'Maria Santos',
      email: 'maria@gmail.com',
      senha: 'senha12345',
      tel: '11912345678',
      cpf: CPFS.maria,
      end: enderecoSP(2000),
    },
    {
      key: 'carlos',
      nome: 'Carlos Souza',
      email: 'carlos@gmail.com',
      senha: 'senha12345',
      tel: '21998877665',
      cpf: CPFS.carlos,
      end: enderecoRJ(300),
    },
    {
      key: 'ana',
      nome: 'Ana Pereira',
      email: 'ana@gmail.com',
      senha: 'senha12345',
      tel: '11911223344',
      cpf: CPFS.ana,
      end: enderecoSP(750),
    },
    {
      key: 'pedro',
      nome: 'Pedro Lima',
      email: 'pedro@gmail.com',
      senha: 'senha12345',
      tel: '31988776655',
      cpf: CPFS.pedro,
      end: enderecoBH(120),
    },
    {
      key: 'julia',
      nome: 'Júlia Oliveira',
      email: 'julia@gmail.com',
      senha: 'senha12345',
      tel: '11955667788',
      cpf: CPFS.julia,
      end: enderecoSP(1200),
    },
    {
      key: 'rafael',
      nome: 'Rafael Costa',
      email: 'rafael@gmail.com',
      senha: 'senha12345',
      tel: '21944556677',
      cpf: CPFS.rafael,
      end: enderecoRJ(800),
    },
    {
      key: 'beatriz',
      nome: 'Beatriz Almeida',
      email: 'beatriz@gmail.com',
      senha: 'senha12345',
      tel: '11933445566',
      cpf: CPFS.beatriz,
      end: enderecoSP(3300),
    },
    {
      key: 'thiago',
      nome: 'Thiago Mendes',
      email: 'thiago@gmail.com',
      senha: 'senha12345',
      tel: '31922334455',
      cpf: CPFS.thiago,
      end: enderecoBH(560),
    },
  ];
  for (const a of adotantes) {
    await tryCreate(a.nome, () =>
      req('POST', '/users/adotantes', {
        nome: a.nome,
        email: a.email,
        senha: a.senha,
        telefone: a.tel,
        cpf: a.cpf,
        endereco: a.end,
      }),
    );
  }

  // ─── 2. ONG + protetor PF ────────────────────────────────────
  console.log('\n2. Protetores e ONGs:');
  await tryCreate('Abrigo Quatro Patas (ONG)', () =>
    req('POST', '/users/protetores-ongs', {
      nome: 'Abrigo Quatro Patas',
      email: 'contato@quatropatas.org',
      senha: 'ongQuatroPatas1',
      telefone: '11955554444',
      telefoneContato: '1133334444',
      tipoUsuario: 'ong',
      cpfCnpj: CNPJ_ONG,
      descricao:
        'ONG dedicada à adoção responsável de cães e gatos resgatados da rua.',
      documentoComprobatorio: DOC_BASE64,
      endereco: enderecoSP(500),
    }),
  );
  await tryCreate('João Silva (protetor)', () =>
    req('POST', '/users/protetores-ongs', {
      nome: 'João Silva',
      email: 'joao.protetor@gmail.com',
      senha: 'joaoProtetor1',
      telefone: '21987651234',
      telefoneContato: '21987651234',
      tipoUsuario: 'protetor',
      cpfCnpj: CPFS.joaoProtetor,
      descricao: 'Protetor independente no Rio.',
      documentoComprobatorio: DOC_BASE64,
      endereco: enderecoRJ(150),
    }),
  );

  // ─── 3. Login ────────────────────────────────────────────────
  console.log('\n3. Login em todos os perfis:');
  const tokens = {
    arthur: await login('arthur@gmail.com', 'arthur30052006'),
    ong: await login('contato@quatropatas.org', 'ongQuatroPatas1'),
    protetor: await login('joao.protetor@gmail.com', 'joaoProtetor1'),
  };
  for (const a of adotantes) {
    tokens[a.key] = await login(a.email, a.senha);
  }
  console.log(`  ✓ ${Object.keys(tokens).length} tokens obtidos`);

  // ─── 4. Pets do Arthur (FOCO — 13 pets diversos) ────────────
  console.log('\n4. Pets do Arthur (protetor principal):');
  const arthurPets = await createPetsIfMissing('Arthur', tokens.arthur, [
    {
      nome: 'Caramelo',
      especie: 'cao',
      raca: 'SRD',
      porte: 'medio',
      sexo: 'macho',
      idadeMeses: 24,
      castrado: true,
      vacinado: true,
      descricao:
        'Caramelo é um vira-lata super dócil que resgatei no semáforo. Adora carinho e brincar de bolinha.',
      temperamento: 'dócil, brincalhão, carinhoso',
      fotosUrls: FOTOS.caoViraLata,
    },
    {
      nome: 'Nina',
      especie: 'cao',
      raca: 'Pastor Alemão',
      porte: 'grande',
      sexo: 'femea',
      idadeMeses: 36,
      castrado: true,
      vacinado: true,
      descricao:
        'Nina é uma pastora alemã super inteligente e protetora. Já foi adestrada.',
      temperamento: 'inteligente, leal, protetora',
      fotosUrls: FOTOS.caoPastor,
    },
    {
      nome: 'Pipoca',
      especie: 'gato',
      raca: 'SRD',
      porte: 'pequeno',
      sexo: 'femea',
      idadeMeses: 10,
      castrado: true,
      vacinado: true,
      descricao:
        'Gatinha branca cheia de personalidade. Adora janelas e perseguir laser.',
      temperamento: 'curiosa, brincalhona',
      fotosUrls: FOTOS.gatoBranco,
    },
    {
      nome: 'Simba',
      especie: 'gato',
      raca: 'Siamês',
      porte: 'pequeno',
      sexo: 'macho',
      idadeMeses: 18,
      castrado: true,
      vacinado: true,
      descricao:
        'Simba é um siamês falante, super sociável. Convive bem com cães e crianças.',
      temperamento: 'sociável, falante, carinhoso',
      fotosUrls: FOTOS.gatoSiames,
    },
    {
      nome: 'Bidu',
      especie: 'cao',
      raca: 'Yorkshire',
      porte: 'pequeno',
      sexo: 'macho',
      idadeMeses: 60,
      castrado: true,
      vacinado: true,
      descricao: 'Bidu é um yorkshire idoso, super calminho. Ideal pra apto.',
      temperamento: 'tranquilo, calmo',
      fotosUrls: FOTOS.caoPequeno,
    },
    {
      nome: 'Toby',
      especie: 'cao',
      raca: 'Beagle',
      porte: 'medio',
      sexo: 'macho',
      idadeMeses: 14,
      castrado: false,
      vacinado: true,
      descricao:
        'Toby é um beagle jovem e cheio de energia. Adora correr e brincar.',
      temperamento: 'energético, curioso, sociável',
      fotosUrls: FOTOS.caoBeagle,
    },
    {
      nome: 'Bella',
      especie: 'cao',
      raca: 'Poodle',
      porte: 'pequeno',
      sexo: 'femea',
      idadeMeses: 30,
      castrado: true,
      vacinado: true,
      descricao:
        'Bella é uma poodle muito amorosa. Foi devolvida e procura um lar definitivo.',
      temperamento: 'carinhosa, dócil, alegre',
      fotosUrls: FOTOS.caoPoodle,
    },
    {
      nome: 'Spike',
      especie: 'cao',
      raca: 'Bulldog Inglês',
      porte: 'medio',
      sexo: 'macho',
      idadeMeses: 48,
      castrado: true,
      vacinado: true,
      descricao:
        'Spike parece bravo mas é uma fofura. Ronca como um trator e adora dormir.',
      temperamento: 'tranquilo, preguiçoso, carinhoso',
      fotosUrls: FOTOS.caoBulldog,
    },
    {
      nome: 'Mia',
      especie: 'gato',
      raca: 'SRD',
      porte: 'pequeno',
      sexo: 'femea',
      idadeMeses: 4,
      castrado: false,
      vacinado: true,
      descricao:
        'Mia é uma filhote resgatada da chuva. Super dócil e adora colo.',
      temperamento: 'manhosa, carinhosa, calminha',
      fotosUrls: FOTOS.gatoBebe,
    },
    {
      nome: 'Felix',
      especie: 'gato',
      raca: 'SRD',
      porte: 'medio',
      sexo: 'macho',
      idadeMeses: 36,
      castrado: true,
      vacinado: true,
      descricao:
        'Felix é um gato malhado independente. Não gosta muito de criança pequena.',
      temperamento: 'independente, calmo',
      fotosUrls: FOTOS.gatoMalhado,
    },
    {
      nome: 'Lola',
      especie: 'gato',
      raca: 'SRD',
      porte: 'pequeno',
      sexo: 'femea',
      idadeMeses: 8,
      castrado: true,
      vacinado: true,
      descricao:
        'Lola é uma gata cinza muito brincalhona. Convive bem com outros gatos.',
      temperamento: 'brincalhona, sociável',
      fotosUrls: FOTOS.gatoCinza,
    },
    {
      nome: 'Apolo',
      especie: 'cao',
      raca: 'Husky Siberiano',
      porte: 'grande',
      sexo: 'macho',
      idadeMeses: 24,
      castrado: true,
      vacinado: true,
      descricao:
        'Apolo é um husky cheio de energia. Precisa de espaço e exercícios.',
      temperamento: 'enérgico, brincalhão, independente',
      fotosUrls: FOTOS.caoHusky,
    },
    {
      nome: 'Zeca',
      especie: 'cao',
      raca: 'SRD',
      porte: 'medio',
      sexo: 'macho',
      idadeMeses: 12,
      castrado: false,
      vacinado: true,
      descricao:
        'Zeca é um filhotão vira-lata super carinhoso. Procura uma família ativa.',
      temperamento: 'alegre, carinhoso',
      fotosUrls: FOTOS.caoFilhote,
    },
  ]);

  // ─── 4.5 Match questionário dos adotantes ────────────────────
  console.log('\n4.5. Match questionário (cada adotante):');
  const questionariosPorAdotante = {
    maria: {
      tipoMoradia: 'casa_quintal_grande',
      disponibilidade: 'fica_em_casa',
      experienciaPrevia: 'sim_faz_tempo',
      criancasEmCasa: 'crianca_maior',
      outrosPets: 'cao',
      perfilCompanheiro: 'energetico',
    },
    carlos: {
      tipoMoradia: 'apartamento',
      disponibilidade: 'passa_dia_fora',
      experienciaPrevia: 'primeiro_pet_familia',
      criancasEmCasa: 'nao',
      outrosPets: 'gato',
      perfilCompanheiro: 'tranquilo',
    },
    ana: {
      tipoMoradia: 'apartamento_lazer',
      disponibilidade: 'fica_em_casa',
      experienciaPrevia: 'sim_tem_experiencia',
      criancasEmCasa: 'nao',
      outrosPets: 'nao',
      perfilCompanheiro: 'carinhoso',
    },
    pedro: {
      tipoMoradia: 'casa_quintal_grande',
      disponibilidade: 'sai_almoco',
      experienciaPrevia: 'sim_faz_tempo',
      criancasEmCasa: 'crianca_pequena',
      outrosPets: 'nao',
      perfilCompanheiro: 'energetico',
    },
    julia: {
      tipoMoradia: 'apartamento_lazer',
      disponibilidade: 'fica_em_casa',
      experienciaPrevia: 'sim_tem_experiencia',
      criancasEmCasa: 'nao',
      outrosPets: 'gato',
      perfilCompanheiro: 'carinhoso',
    },
    rafael: {
      tipoMoradia: 'casa_quintal_pequeno',
      disponibilidade: 'passa_dia_fora',
      experienciaPrevia: 'sim_tem_experiencia',
      criancasEmCasa: 'nao',
      outrosPets: 'nao',
      perfilCompanheiro: 'inteligente',
    },
    beatriz: {
      tipoMoradia: 'apartamento',
      disponibilidade: 'fica_em_casa',
      experienciaPrevia: 'sim_faz_tempo',
      criancasEmCasa: 'nao',
      outrosPets: 'nao',
      perfilCompanheiro: 'tranquilo',
    },
    thiago: {
      tipoMoradia: 'casa_quintal_pequeno',
      disponibilidade: 'sai_almoco',
      experienciaPrevia: 'sim_faz_tempo',
      criancasEmCasa: 'crianca_pequena',
      outrosPets: 'gato',
      perfilCompanheiro: 'carinhoso',
    },
  };
  for (const a of adotantes) {
    const q = questionariosPorAdotante[a.key];
    if (!q) continue;
    try {
      await req('POST', '/match/questionario', q, tokens[a.key]);
      console.log(`  ✓ ${a.nome}`);
    } catch (e) {
      console.log(`  ⚠ ${a.nome}: ${e.message}`);
    }
  }

  // ─── 5. Pets da ONG e do João (menos importante, mas mantém) ─
  console.log('\n5. Pets ONG e João (contexto adicional):');
  const ongPets = await createPetsIfMissing('ONG', tokens.ong, [
    {
      nome: 'Bento',
      especie: 'cao',
      raca: 'Golden Retriever',
      porte: 'grande',
      sexo: 'macho',
      idadeMeses: 36,
      castrado: true,
      vacinado: true,
      descricao: 'Bento é um Golden adorável.',
      temperamento: 'tranquilo, carinhoso',
      fotosUrls: FOTOS.caoGolden,
    },
    {
      nome: 'Luna',
      especie: 'cao',
      raca: 'SRD',
      porte: 'medio',
      sexo: 'femea',
      idadeMeses: 18,
      castrado: true,
      vacinado: true,
      descricao: 'Luna é cheia de energia.',
      temperamento: 'energética, alegre',
      fotosUrls: FOTOS.caoViraLata,
    },
    {
      nome: 'Mel',
      especie: 'gato',
      raca: 'SRD',
      porte: 'pequeno',
      sexo: 'femea',
      idadeMeses: 12,
      castrado: true,
      vacinado: true,
      descricao: 'Mel é cinza e super carinhosa.',
      temperamento: 'dócil',
      fotosUrls: FOTOS.gatoCinza,
    },
    {
      nome: 'Tobby',
      especie: 'cao',
      raca: 'Labrador',
      porte: 'grande',
      sexo: 'macho',
      idadeMeses: 48,
      castrado: true,
      vacinado: true,
      descricao: 'Tobby é idoso, super calmo.',
      temperamento: 'tranquilo',
      fotosUrls: FOTOS.caoLabrador,
    },
    {
      nome: 'Pretinho',
      especie: 'gato',
      raca: 'SRD',
      porte: 'pequeno',
      sexo: 'macho',
      idadeMeses: 8,
      castrado: false,
      vacinado: true,
      descricao: 'Pretinho é jovem e curioso.',
      temperamento: 'curioso',
      fotosUrls: FOTOS.gatoPreto,
    },
    {
      nome: 'Garfield',
      especie: 'gato',
      raca: 'Persa',
      porte: 'medio',
      sexo: 'macho',
      idadeMeses: 24,
      castrado: true,
      vacinado: true,
      descricao: 'Garfield é preguiçoso e adorável.',
      temperamento: 'preguiçoso',
      fotosUrls: FOTOS.gatoLaranja,
    },
  ]);
  const protetorPets = await createPetsIfMissing('João', tokens.protetor, [
    {
      nome: 'Thor',
      especie: 'cao',
      raca: 'SRD',
      porte: 'medio',
      sexo: 'macho',
      idadeMeses: 6,
      castrado: false,
      vacinado: true,
      descricao: 'Thor é filhote vira-lata.',
      temperamento: 'enérgico',
      fotosUrls: FOTOS.caoFilhote,
    },
    {
      nome: 'Branquinha',
      especie: 'gato',
      raca: 'SRD',
      porte: 'pequeno',
      sexo: 'femea',
      idadeMeses: 14,
      castrado: true,
      vacinado: true,
      descricao: 'Branquinha é tímida no começo.',
      temperamento: 'tímido',
      fotosUrls: FOTOS.gatoBranco,
    },
    {
      nome: 'Rex',
      especie: 'cao',
      raca: 'SRD',
      porte: 'grande',
      sexo: 'macho',
      idadeMeses: 60,
      castrado: true,
      vacinado: true,
      descricao: 'Rex é idoso super dócil.',
      temperamento: 'calmo',
      fotosUrls: FOTOS.caoViraLata,
    },
  ]);

  // helper para achar pet do Arthur por nome
  const pet = (nome) => arthurPets.find((p) => p.nome === nome);
  const ongPet = (nome) => ongPets.find((p) => p.nome === nome);

  // ─── 6. Solicitações: muitas, distribuídas, vários candidatos ─
  console.log('\n6. Solicitações de adoção pros pets do Arthur:');
  // Cada entrada: [adotanteKey, petNome, mensagem opcional]
  const solicitacoes = [
    // Caramelo — 3 candidatos
    ['maria', 'Caramelo', 'Casa com quintal, perfeito pra um vira-lata como o Caramelo!'],
    ['ana', 'Caramelo', 'Trabalho em casa, posso dar muito carinho pro Caramelo.'],
    ['pedro', 'Caramelo', 'Tenho 2 filhos que amariam o Caramelo.'],
    // Nina — 2 candidatos
    ['maria', 'Nina', 'Família com crianças que adoraria a Nina.'],
    ['rafael', 'Nina', 'Casa grande, treino cães. Tenho experiência com Pastor.'],
    // Pipoca — 4 candidatos
    ['carlos', 'Pipoca', 'Primeiro gato da família. Apartamento limpo.'],
    ['julia', 'Pipoca', 'Já tenho 1 gato. Pipoca seria companhia perfeita.'],
    ['beatriz', 'Pipoca', 'Apartamento, casa o dia todo trabalhando home office.'],
    ['thiago', 'Pipoca', 'Adoro gatos brancos! Casa segura.'],
    // Simba — 2 candidatos
    ['carlos', 'Simba', 'Meu primeiro gato. Casal sem filhos.'],
    ['ana', 'Simba', 'Sempre quis um siamês! Apto, sem outros pets.'],
    // Bidu — 1 candidato
    ['beatriz', 'Bidu', 'Idoso pra idoso! Apto pequeno, vida tranquila.'],
    // Toby — 3 candidatos
    ['pedro', 'Toby', 'Casa com quintal grande, ideal pra beagle.'],
    ['rafael', 'Toby', 'Família ativa, corremos todo dia.'],
    ['julia', 'Toby', 'Tenho experiência com cães energéticos.'],
    // Bella — 2 candidatos
    ['maria', 'Bella', 'Buscando pet pequeno pras crianças.'],
    ['beatriz', 'Bella', 'Apartamento, casal sem filhos.'],
    // Spike — 0 candidatos (pet "stale" pro dashboard)
    // Mia — 3 candidatos
    ['julia', 'Mia', 'Filhote pra cuidar com amor! Trabalho em casa.'],
    ['ana', 'Mia', 'Sempre quis uma filhote. Apto bem seguro.'],
    ['thiago', 'Mia', 'Família apaixonada por gatos.'],
    // Felix — 1 candidato
    ['rafael', 'Felix', 'Casa sem crianças pequenas, tranquila pra ele.'],
    // Lola — 2 candidatos
    ['carlos', 'Lola', 'Quero adotar gato pra ser companhia em apto.'],
    ['thiago', 'Lola', 'Já tenho 1 gata, Lola seria amiga dela.'],
    // Apolo — 0 candidatos (pet "stale")
    // Zeca — 2 candidatos
    ['pedro', 'Zeca', 'Família ativa, pegamos vários cães ao longo da vida.'],
    ['rafael', 'Zeca', 'Casa grande, cuidador profissional.'],
  ];

  const requests = [];
  for (const [adotanteKey, petNome, mensagem] of solicitacoes) {
    const p = pet(petNome);
    if (!p) continue;
    const r = await createAdoptionAndGetId(tokens[adotanteKey], {
      petId: p.id,
      mensagem,
      questionario: {
        tipoMoradia:
          adotanteKey === 'maria' || adotanteKey === 'pedro' || adotanteKey === 'rafael'
            ? 'casa_com_quintal'
            : 'apartamento',
        horasDisponiveisDia: 4 + ((petNome.length + adotanteKey.length) % 6),
        temExperiencia: adotanteKey !== 'carlos' && adotanteKey !== 'beatriz',
        temCriancas: adotanteKey === 'maria' || adotanteKey === 'pedro',
        temOutrosPets: adotanteKey === 'julia' || adotanteKey === 'thiago',
      },
    });
    requests.push({
      id: r.id,
      petId: p.id,
      _adotante: adotanteKey,
      _petNome: petNome,
      _status: r.status,
    });
    console.log(`  ✓ ${adotanteKey} → ${petNome}`);
  }

  // 2 solicitações em pets de OUTRA ONG (pra Arthur NÃO ver — segurança)
  console.log('\n   Solicitações em pets da ONG (cross-check):');
  await createAdoptionAndGetId(tokens.maria, {
    petId: ongPet('Bento').id,
    mensagem: 'Bento parece perfeito!',
  });
  console.log('  ✓ maria → Bento (ONG)');
  await createAdoptionAndGetId(tokens.carlos, {
    petId: ongPet('Mel').id,
    mensagem: 'Mel pra ser meu primeiro gato.',
  });
  console.log('  ✓ carlos → Mel (ONG)');

  // ─── 7. Atualizar status — mix completo pro dashboard ──────
  console.log('\n7. Atualizar status (mix received/in_analysis/approved/rejected):');
  const setStatus = async (adopter, petNome, status) => {
    const r = requests.find(
      (x) => x._adotante === adopter && x._petNome === petNome,
    );
    if (!r) return;
    try {
      await patchStatus(r.id, status, tokens.arthur);
      console.log(`  ✓ ${petNome} (${adopter}) → ${status}`);
    } catch (e) {
      console.log(`  ⚠ ${petNome}/${adopter}: ${e.message}`);
    }
  };

  // approved — 4 (2 que viram "adotado" depois)
  await setStatus('maria', 'Caramelo', 'approved');
  await setStatus('beatriz', 'Bidu', 'approved');
  await setStatus('rafael', 'Nina', 'approved');
  await setStatus('julia', 'Mia', 'approved');

  // in_analysis — 5
  await setStatus('ana', 'Caramelo', 'in_analysis');
  await setStatus('julia', 'Pipoca', 'in_analysis');
  await setStatus('beatriz', 'Pipoca', 'in_analysis');
  await setStatus('pedro', 'Toby', 'in_analysis');
  await setStatus('rafael', 'Felix', 'in_analysis');

  // rejected — 4
  await setStatus('pedro', 'Caramelo', 'rejected');
  await setStatus('thiago', 'Pipoca', 'rejected');
  await setStatus('carlos', 'Pipoca', 'rejected');
  await setStatus('carlos', 'Simba', 'rejected');

  // resto fica como received (default)

  // ─── 8. Pets com status alterado (adotado / em_processo) ────
  console.log('\n8. Atualizar status de pets:');
  // Caramelo e Bidu — adotado (pra aparecer no KPI "adotados")
  await patchPetStatus(pet('Caramelo').id, 'adotado', tokens.arthur);
  console.log('  ✓ Caramelo → adotado');
  await patchPetStatus(pet('Bidu').id, 'adotado', tokens.arthur);
  console.log('  ✓ Bidu → adotado');
  // Nina e Mia — em_processo
  await patchPetStatus(pet('Nina').id, 'em_processo', tokens.arthur);
  console.log('  ✓ Nina → em_processo');
  await patchPetStatus(pet('Mia').id, 'em_processo', tokens.arthur);
  console.log('  ✓ Mia → em_processo');

  // ─── 9. Conversas — várias com mensagens ricas ──────────────
  console.log('\n9. Conversas e mensagens:');

  const findReq = (adopter, petNome) =>
    requests.find((r) => r._adotante === adopter && r._petNome === petNome);

  const conversas = [
    {
      tag: 'Maria ↔ Arthur (Caramelo)',
      req: findReq('maria', 'Caramelo'),
      adopterToken: tokens.maria,
      mensagens: [
        { from: 'adotante', txt: 'Oi Arthur! Acabei de me inscrever pro Caramelo, ele é uma graça!' },
        { from: 'protetor', txt: 'Oi Maria! Obrigado pelo interesse 🐶. O Caramelo é um amor mesmo, super dócil.' },
        { from: 'adotante', txt: 'Tenho 2 filhos (8 e 10 anos). Ele se dá bem com criança?' },
        { from: 'protetor', txt: 'Excelente com crianças! Já viveu com elas antes.' },
        { from: 'adotante', txt: 'Maravilha! Posso conhecer ele esse sábado?' },
        { from: 'protetor', txt: 'Claro! Sábado 14h, tudo certo. Te mando o endereço.' },
        { from: 'adotante', txt: 'Estarei lá com a família. Obrigada!! 🐕❤️' },
        { from: 'protetor', txt: 'Boas-vindas oficial! O Caramelo é todo seu 🥹' },
      ],
    },
    {
      tag: 'Ana ↔ Arthur (Caramelo)',
      req: findReq('ana', 'Caramelo'),
      adopterToken: tokens.ana,
      mensagens: [
        { from: 'adotante', txt: 'Oi Arthur, vi o anúncio do Caramelo. Ele ainda está disponível?' },
        { from: 'protetor', txt: 'Oi Ana! No momento sua solicitação está em análise, tem outra família interessada.' },
        { from: 'adotante', txt: 'Entendo. Trabalho em casa, posso dar bastante atenção pra ele.' },
        { from: 'protetor', txt: 'Anotei. Te aviso no fim da semana sobre a decisão.' },
      ],
    },
    {
      tag: 'Rafael ↔ Arthur (Nina)',
      req: findReq('rafael', 'Nina'),
      adopterToken: tokens.rafael,
      mensagens: [
        { from: 'adotante', txt: 'Boa tarde Arthur. Trabalho com adestramento canino, tenho interesse na Nina.' },
        { from: 'protetor', txt: 'Boa tarde Rafael! Que ótimo, a Nina precisa de alguém que entenda da raça.' },
        { from: 'adotante', txt: 'Posso passar aí amanhã pra conhecê-la?' },
        { from: 'protetor', txt: 'Combinado! 10h aqui em casa.' },
        { from: 'adotante', txt: 'Chegando às 10h em ponto 👍' },
        { from: 'protetor', txt: 'Maria, foi um prazer. A Nina aprovou você 😄' },
      ],
    },
    {
      tag: 'Julia ↔ Arthur (Pipoca)',
      req: findReq('julia', 'Pipoca'),
      adopterToken: tokens.julia,
      mensagens: [
        { from: 'adotante', txt: 'Oi! Já tenho 1 gato em casa e quero adotar a Pipoca.' },
        { from: 'protetor', txt: 'Oi Julia! Como é o convívio do seu gato com outros?' },
        { from: 'adotante', txt: 'Ele é super sociável, já viveu com outros gatos antes.' },
        { from: 'protetor', txt: 'Perfeito. A Pipoca também é dessas. Bom matching!' },
      ],
    },
    {
      tag: 'Carlos ↔ Arthur (Simba)',
      req: findReq('carlos', 'Simba'),
      adopterToken: tokens.carlos,
      mensagens: [
        { from: 'adotante', txt: 'Oi Arthur! Tenho interesse no Simba, seria meu primeiro gato.' },
        { from: 'protetor', txt: 'Oi Carlos! O Simba é siamês, super sociável, mas exige bastante atenção e estímulo.' },
        { from: 'adotante', txt: 'Trabalho fora o dia todo. Você acha que ele se adapta?' },
        { from: 'protetor', txt: 'Sinceramente, pra siamês passar 10h sozinho é difícil. Talvez não seja o match ideal.' },
        { from: 'adotante', txt: 'Entendo. Vou pensar em adotar outro mais tranquilo.' },
        { from: 'protetor', txt: 'Que tal o Felix? Ele é mais independente.' },
      ],
    },
    {
      tag: 'Pedro ↔ Arthur (Toby)',
      req: findReq('pedro', 'Toby'),
      adopterToken: tokens.pedro,
      mensagens: [
        { from: 'adotante', txt: 'Oi! Tenho casa com quintal grande em BH. Toby seria perfeito!' },
        { from: 'protetor', txt: 'Oi Pedro! Casa em BH é ótimo pra um beagle. Tem outros cães?' },
        { from: 'adotante', txt: 'Não, ele seria o único. Mas a família é grande e ativa.' },
        { from: 'protetor', txt: 'Beleza! Sua solicitação tá em análise. Te aviso essa semana.' },
      ],
    },
    {
      tag: 'Beatriz ↔ Arthur (Bidu)',
      req: findReq('beatriz', 'Bidu'),
      adopterToken: tokens.beatriz,
      mensagens: [
        { from: 'adotante', txt: 'Oi Arthur! Sou aposentada, vivo num apto pequeno. Bidu seria perfeito.' },
        { from: 'protetor', txt: 'Oi Beatriz! Idoso pra idoso é match perfeito 😊' },
        { from: 'adotante', txt: 'Foi APROVADA?? Que felicidade!! 🥹' },
        { from: 'protetor', txt: 'Sim! Pode buscar o Bidu na quarta. Ele vai amar você.' },
      ],
    },
    {
      tag: 'Thiago ↔ Arthur (Lola)',
      req: findReq('thiago', 'Lola'),
      adopterToken: tokens.thiago,
      mensagens: [
        { from: 'adotante', txt: 'Oi Arthur! Tenho 1 gata em casa, quero adotar a Lola pra ser amiga dela.' },
        { from: 'protetor', txt: 'Oi Thiago! Que legal. Como é a sua gata?' },
        { from: 'adotante', txt: 'Mansa, 3 anos, castrada. Convive bem com outros animais.' },
        { from: 'protetor', txt: 'Perfeito pra Lola. Vamos marcar uma apresentação?' },
        { from: 'adotante', txt: 'Sim! Quando você está livre?' },
      ],
    },
  ];

  for (const c of conversas) {
    if (!c.req) {
      console.log(`  ⚠ ${c.tag}: solicitação não encontrada`);
      continue;
    }
    try {
      const conv = await createConversationAndGetId(
        c.adopterToken,
        c.req.id,
      );
      console.log(`  ✓ ${c.tag}`);
      // Quantas mensagens já existem? Pular dup.
      const existentes = await req(
        'GET',
        `/chat/conversations/${conv.id}/messages`,
        null,
        c.adopterToken,
      );
      if (existentes.length >= c.mensagens.length) {
        console.log(
          `    ↻ ${existentes.length} mensagens já existem (pulando)`,
        );
        continue;
      }
      for (const m of c.mensagens) {
        const token = m.from === 'adotante' ? c.adopterToken : tokens.arthur;
        await req(
          'POST',
          `/chat/conversations/${conv.id}/messages`,
          { content: m.txt },
          token,
        );
      }
      console.log(`    ↳ ${c.mensagens.length} mensagens`);
    } catch (e) {
      console.log(`  ⚠ ${c.tag}: ${e.message}`);
    }
  }

  console.log('\n═══ Seed concluído ═══\n');
  console.log('FOCO: testar interface de Protetor/ONG logando como Arthur:');
  console.log('  → arthur@gmail.com / arthur30052006');
  console.log('');
  console.log(`Arthur agora tem:`);
  console.log(`  • 13 pets cadastrados (2 adotados, 2 em_processo, 9 disponíveis)`);
  console.log(`  • ~25 solicitações de 8 adotantes diferentes`);
  console.log(`  • Status mix: received, in_analysis, approved, rejected`);
  console.log(`  • 2 pets "stale" sem nenhuma solicitação (Spike, Apolo)`);
  console.log(`  • 8 conversas com adotantes (com mensagens variadas)`);
  console.log('');
  console.log('Outras contas pra testar lados diferentes:');
  console.log(
    '  contato@quatropatas.org / ongQuatroPatas1   (ONG com 6 pets)',
  );
  console.log(
    '  joao.protetor@gmail.com / joaoProtetor1     (protetor com 3 pets)',
  );
  console.log('');
  console.log('Adotantes (caso queira ver o lado deles):');
  for (const a of adotantes) {
    console.log(`  ${a.email} / ${a.senha}`);
  }
}

main().catch((e) => {
  console.error('\n✗ Erro:', e.message);
  process.exit(1);
});
