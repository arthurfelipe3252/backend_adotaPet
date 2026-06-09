/* eslint-disable no-console */
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';

/**
 * Seed dedicado para testar o módulo de relatórios.
 *
 * Cria:
 *  - 1 ONG (protetor) com perfil completo
 *  - 5 adotantes com perfis completos
 *  - 30 pets do protetor (variados em status/espécie/porte/idade) com datas
 *    de criação espalhadas em ~14 meses
 *  - 100 adoption_requests distribuídas em 12 meses, com mix de status,
 *    matchScore, alguns aprovados dentro do mês atual (para o KPI)
 *  - 10 conversations (6 ativas, 4 inativas) com 3-8 mensagens cada,
 *    incluindo várias não lidas (sender ≠ protetor)
 *
 * Antes de inserir, limpa todos os dados de TESTE (identificados por
 * emails terminando em '@dashboard-test.dev') — operação idempotente.
 *
 * Para rodar:
 *   DATABASE_URL=postgresql://... ts-node ./scripts/seed-reports.ts
 */

const TEST_EMAIL_DOMAIN = '@dashboard-test.dev';
const TEST_PASSWORD = 'senhaSegura123';

interface SeedResult {
  ongUsuarioId: string;
  ongProtetorId: string;
  ongEmail: string;
  password: string;
  adotanteIds: string[];
  adopterUsuarioIds: string[];
  petIds: string[];
}

function pick<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length]!;
}

/**
 * Datas determinísticas: gera um Date `monthsAgo` meses atrás (UTC) com
 * deslocamento aleatório dentro do mês.
 */
function dateMonthsAgo(monthsAgo: number, dayOffset = 5): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - monthsAgo,
      dayOffset,
      12,
      0,
      0,
    ),
  );
}

async function clearTestData(client: Pool): Promise<void> {
  console.log('🧹 Limpando dados de teste antigos...');
  // Ordem importa por FKs. Mensagens → conversations → adoption_requests →
  // pets → adotantes → protetores_ongs → usuarios → enderecos.
  await client.query(`
    DELETE FROM messages WHERE conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN protetores_ongs po ON po.id = c.protetor_id
      JOIN usuarios u ON u.id = po.usuario_id
      WHERE u.email LIKE '%${TEST_EMAIL_DOMAIN}'
    )
  `);
  await client.query(`
    DELETE FROM conversations WHERE protetor_id IN (
      SELECT po.id FROM protetores_ongs po
      JOIN usuarios u ON u.id = po.usuario_id
      WHERE u.email LIKE '%${TEST_EMAIL_DOMAIN}'
    )
  `);
  await client.query(`
    DELETE FROM adoption_requests WHERE pet_id IN (
      SELECT p.id FROM pets p
      JOIN protetores_ongs po ON po.id = p.protetor_id
      JOIN usuarios u ON u.id = po.usuario_id
      WHERE u.email LIKE '%${TEST_EMAIL_DOMAIN}'
    )
  `);
  await client.query(`
    DELETE FROM pets WHERE protetor_id IN (
      SELECT po.id FROM protetores_ongs po
      JOIN usuarios u ON u.id = po.usuario_id
      WHERE u.email LIKE '%${TEST_EMAIL_DOMAIN}'
    )
  `);
  await client.query(`
    DELETE FROM adotantes WHERE usuario_id IN (
      SELECT id FROM usuarios WHERE email LIKE '%${TEST_EMAIL_DOMAIN}'
    )
  `);
  await client.query(`
    DELETE FROM protetores_ongs WHERE usuario_id IN (
      SELECT id FROM usuarios WHERE email LIKE '%${TEST_EMAIL_DOMAIN}'
    )
  `);
  const usuariosResult = await client.query(
    `SELECT id FROM usuarios WHERE email LIKE '%${TEST_EMAIL_DOMAIN}'`,
  );
  const userIds: string[] = usuariosResult.rows.map((r: { id: string }) => r.id);
  await client.query(`DELETE FROM refresh_tokens WHERE usuario_id = ANY($1)`, [
    userIds,
  ]);
  await client.query(
    `DELETE FROM usuarios WHERE email LIKE '%${TEST_EMAIL_DOMAIN}'`,
  );
  // Endereços não têm FK para identificar — limpamos via test-marker
  // (não tem campo). Vamos só deixar — não atrapalha métricas.
  console.log('✅ Dados antigos removidos.\n');
}

async function seed(): Promise<SeedResult> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await clearTestData(pool);

    const senhaHash = await bcrypt.hash(TEST_PASSWORD, 12);

    // ─────────────────────────────────────────────────────────────────
    // 1. ONG (protetor) com perfil completo
    // ─────────────────────────────────────────────────────────────────
    console.log('🏠 Criando ONG de teste...');
    const enderecoOngId = randomUUID();
    await pool.query(
      `INSERT INTO enderecos (id, logradouro, numero, complemento, bairro, cidade, estado, cep)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        enderecoOngId,
        'Rua das Patinhas',
        '100',
        'Sala 1',
        'Centro',
        'São Paulo',
        'SP',
        '01000000',
      ],
    );

    const ongUsuarioId = randomUUID();
    const ongEmail = `ong${TEST_EMAIL_DOMAIN}`;
    await pool.query(
      `INSERT INTO usuarios (id, nome, email, senha_hash, telefone, tipo_usuario, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [
        ongUsuarioId,
        'ONG Patinhas Felizes',
        ongEmail,
        senhaHash,
        '11999998888',
        'ong',
      ],
    );

    const ongProtetorId = randomUUID();
    await pool.query(
      `INSERT INTO protetores_ongs (id, usuario_id, cpf_cnpj, descricao, telefone_contato, imagem_base64, documento_comprobatorio, endereco_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        ongProtetorId,
        ongUsuarioId,
        '11444777000161',
        'ONG dedicada a adoção responsável.',
        '11999998888',
        'data:image/png;base64,iVBORw0KGgo=', // dummy
        'data:application/pdf;base64,JVBERi0xLjQ=', // dummy
        enderecoOngId,
      ],
    );
    console.log(`  ✅ ONG criada: id=${ongProtetorId}, email=${ongEmail}\n`);

    // ─────────────────────────────────────────────────────────────────
    // 2. Adotantes (5 perfis)
    // ─────────────────────────────────────────────────────────────────
    console.log('👥 Criando 5 adotantes...');
    const adopterUsuarioIds: string[] = [];
    const adotanteIds: string[] = [];
    const cpfsAdotantes = [
      '39053344705',
      '52998224725',
      '11144477735',
      '96388271038',
      '03737462013',
    ];
    for (let i = 0; i < 5; i++) {
      const enderecoId = randomUUID();
      await pool.query(
        `INSERT INTO enderecos (id, logradouro, numero, bairro, cidade, estado, cep)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          enderecoId,
          `Rua Adotante ${i + 1}`,
          `${100 + i}`,
          'Centro',
          'São Paulo',
          'SP',
          '01000000',
        ],
      );

      const usuarioId = randomUUID();
      const email = `adopter${i + 1}${TEST_EMAIL_DOMAIN}`;
      await pool.query(
        `INSERT INTO usuarios (id, nome, email, senha_hash, telefone, tipo_usuario, ativo)
         VALUES ($1, $2, $3, $4, $5, 'adotante', true)`,
        [usuarioId, `Adotante ${i + 1}`, email, senhaHash, `1198877665${i}`],
      );

      const adotanteId = randomUUID();
      await pool.query(
        `INSERT INTO adotantes (id, usuario_id, cpf, endereco_id)
         VALUES ($1, $2, $3, $4)`,
        [adotanteId, usuarioId, cpfsAdotantes[i], enderecoId],
      );

      adopterUsuarioIds.push(usuarioId);
      adotanteIds.push(adotanteId);
    }
    console.log('  ✅ 5 adotantes criados.\n');

    // ─────────────────────────────────────────────────────────────────
    // 3. Pets (30 do mesmo protetor, variados)
    // ─────────────────────────────────────────────────────────────────
    console.log('🐾 Criando 30 pets...');
    const especies = ['cao', 'gato', 'outro'];
    const portes = ['pequeno', 'medio', 'grande'];
    const sexos = ['macho', 'femea'];
    // 12 disponivel + 8 em_processo + 10 adotado = 30
    const statusDistribuicao = [
      ...Array(12).fill('disponivel'),
      ...Array(8).fill('em_processo'),
      ...Array(10).fill('adotado'),
    ];
    const nomes = [
      'Thor',
      'Mel',
      'Bob',
      'Luna',
      'Max',
      'Nina',
      'Toby',
      'Lola',
      'Rex',
      'Pipoca',
      'Zeus',
      'Amora',
      'Bento',
      'Cacau',
      'Dino',
      'Estela',
      'Faísca',
      'Gigi',
      'Henrique',
      'Iris',
      'Joca',
      'Kiara',
      'Léo',
      'Mimi',
      'Nico',
      'Ozzy',
      'Pérola',
      'Quinta',
      'Romeo',
      'Sasha',
    ];

    const petIds: string[] = [];
    for (let i = 0; i < 30; i++) {
      const petId = randomUUID();
      // Datas espalhadas: pets criados de 14 meses atrás até agora.
      // Pets adotados são criados mais antigos (4-14 meses), os disponíveis
      // mais recentes (0-6 meses) — emula ciclo realista.
      const status = statusDistribuicao[i];
      let monthsAgo: number;
      if (status === 'adotado') monthsAgo = 4 + (i % 11);
      else if (status === 'em_processo') monthsAgo = 1 + (i % 4);
      else if (i < 4) monthsAgo = 10 + i; // 4 pets disponíveis bem antigos → stale candidates
      else monthsAgo = i % 7;
      const createdAt = dateMonthsAgo(monthsAgo, 1 + (i % 27));

      await pool.query(
        `INSERT INTO pets (id, protetor_id, nome, especie, raca, porte, sexo, idade_meses, castrado, vacinado, descricao, temperamento, status, fotos_urls, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)`,
        [
          petId,
          ongProtetorId,
          pick(nomes, i),
          pick(especies, i),
          pick(['Vira-lata', 'SRD', 'Labrador', 'Persa'], i),
          pick(portes, i),
          pick(sexos, i),
          6 + (i % 60),
          i % 2 === 0,
          i % 3 === 0,
          'Pet adorável.',
          'Dócil e brincalhão.',
          status,
          JSON.stringify(['data:image/png;base64,iVBORw0KGgo=']),
          createdAt,
        ],
      );
      petIds.push(petId);
    }
    console.log('  ✅ 30 pets criados.\n');

    // ─────────────────────────────────────────────────────────────────
    // 4. Adoption requests (~100, distribuídas em 12 meses)
    // ─────────────────────────────────────────────────────────────────
    console.log('📨 Criando 100 adoption_requests...');
    const requestStatuses = ['received', 'in_analysis', 'approved', 'rejected'];
    // Skewing: pet[0..4] recebem 6-10 cada (top), pet[5..14] recebem 2-4
    // cada (médios), pet[15..25] recebem 1-2 (cauda), pet[26..29] não
    // recebem nada (stale).
    const requestsCountByPet = [
      10, 9, 8, 7, 6, // top 5 → 40
      4, 4, 4, 3, 3, 3, 2, 2, 2, 2, // 10 médios → 31
      2, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, // 11 cauda → 14
      0, 0, 0, 0, // 4 sem nenhuma
    ];
    const totalExpected = requestsCountByPet.reduce((a, b) => a + b, 0);
    console.log(`  (distribuição planeja ${totalExpected} requests)`);

    // Garantir que pelo menos 3 approved tenham updated_at no MÊS ATUAL
    // para o KPI petsAdotadoMesAtual sair com valor > 0.
    let approvedThisMonth = 0;
    const TARGET_APPROVED_THIS_MONTH = 4;

    let createdCount = 0;
    for (let petIdx = 0; petIdx < 30; petIdx++) {
      const count = requestsCountByPet[petIdx]!;
      for (let j = 0; j < count; j++) {
        const requestId = randomUUID();
        const petId = petIds[petIdx]!;

        // Status distribuído: dá menos approved/rejected, mais received
        const statusIdx = (petIdx + j) % 10;
        let status: string;
        if (statusIdx < 4) status = 'received';
        else if (statusIdx < 7) status = 'in_analysis';
        else if (statusIdx < 9) status = 'approved';
        else status = 'rejected';

        const monthsAgo = (petIdx * 3 + j) % 12;
        const createdAt = dateMonthsAgo(monthsAgo, 1 + ((petIdx + j) % 27));

        // updated_at: aproximadamente igual a created_at se status=received
        // (não houve update). Para approved/rejected/in_analysis, simulamos
        // 1-14 dias depois.
        let updatedAt = createdAt;
        if (status !== 'received') {
          updatedAt = new Date(
            createdAt.getTime() + (1 + (j % 14)) * 24 * 60 * 60 * 1000,
          );
        }

        // Override: se aprovado e ainda não enchemos a cota do mês atual,
        // força updated_at dentro do mês corrente.
        if (
          status === 'approved' &&
          approvedThisMonth < TARGET_APPROVED_THIS_MONTH
        ) {
          const now = new Date();
          updatedAt = new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              Math.min(now.getUTCDate(), 1 + (j % 27)),
              10,
              0,
              0,
            ),
          );
          approvedThisMonth++;
        }

        const matchScore = 40 + ((petIdx * 7 + j * 13) % 60);
        const preTriageStatus =
          matchScore >= 70 ? 'qualified' : matchScore >= 50 ? 'review' : 'disqualified';

        await pool.query(
          `INSERT INTO adoption_requests (id, pet_id, protetor_id, adopter_id, status, pre_triage_status, match_score, match_answers, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)`,
          [
            requestId,
            petId,
            ongProtetorId,
            pick(adotanteIds, j + petIdx),
            status,
            preTriageStatus,
            matchScore,
            JSON.stringify({ tipoMoradia: 'apartamento', temCriancas: false }),
            'Quero adotar.',
            createdAt,
            updatedAt,
          ],
        );
        createdCount++;
      }
    }
    console.log(
      `  ✅ ${createdCount} adoption_requests criadas (${approvedThisMonth} aprovadas no mês atual).\n`,
    );

    // ─────────────────────────────────────────────────────────────────
    // 5. Conversations (10) + Messages
    // ─────────────────────────────────────────────────────────────────
    console.log('💬 Criando 10 conversations + mensagens...');
    // Pegar 10 adoption_requests para virar conversa
    const reqResult = await pool.query(
      `SELECT id, adopter_id FROM adoption_requests
       WHERE protetor_id = $1 AND status IN ('in_analysis', 'approved')
       ORDER BY created_at DESC LIMIT 10`,
      [ongProtetorId],
    );
    const requestsForConv: { id: string; adopter_id: string }[] = reqResult.rows;
    let conversationsCreated = 0;
    let messagesCreated = 0;
    let unreadCreated = 0;

    for (let i = 0; i < requestsForConv.length; i++) {
      const req = requestsForConv[i]!;
      const conversationId = randomUUID();
      const isActive = i < 6; // 6 ativas, 4 inativas
      const createdAt = dateMonthsAgo(2, 5 + i);

      // Resolver protetor_id em conversations: schema usa o id do protetor
      // (protetores_ongs.id), mesmo padrão de pets/adoption_requests.
      await pool.query(
        `INSERT INTO conversations (id, adoption_request_id, adopter_id, protetor_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $6)`,
        [conversationId, req.id, req.adopter_id, ongProtetorId, isActive, createdAt],
      );
      conversationsCreated++;

      // 3-8 mensagens por conversa
      const msgCount = 3 + (i % 6);
      for (let k = 0; k < msgCount; k++) {
        const msgId = randomUUID();
        // Alterna sender: adopter (par) ou protetor (ímpar)
        const senderId = k % 2 === 0 ? req.adopter_id : ongProtetorId;
        // Mensagens enviadas pelo adopter ficam não-lidas com 50% de chance.
        // Mensagens enviadas pelo protetor sempre lidas (não conta para KPI).
        const isRead = senderId === ongProtetorId ? true : k % 2 === 0;
        const isUnreadForKpi = senderId !== ongProtetorId && !isRead;
        if (isUnreadForKpi) unreadCreated++;

        const msgCreatedAt = new Date(createdAt.getTime() + k * 60 * 60 * 1000);
        await pool.query(
          `INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $6)`,
          [
            msgId,
            conversationId,
            senderId,
            `Mensagem ${k + 1} da conversa ${i + 1}`,
            isRead,
            msgCreatedAt,
          ],
        );
        messagesCreated++;
      }
    }
    console.log(
      `  ✅ ${conversationsCreated} conversations / ${messagesCreated} mensagens (${unreadCreated} não lidas do adotante).\n`,
    );

    return {
      ongUsuarioId,
      ongProtetorId,
      ongEmail,
      password: TEST_PASSWORD,
      adotanteIds,
      adopterUsuarioIds,
      petIds,
    };
  } finally {
    await pool.end();
  }
}

seed()
  .then((r) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 Seed concluído. Credenciais:');
    console.log(`  ONG email:        ${r.ongEmail}`);
    console.log(`  ONG senha:        ${r.password}`);
    console.log(`  ONG usuarioId:    ${r.ongUsuarioId}`);
    console.log(`  ONG protetorId:   ${r.ongProtetorId}`);
    console.log(`  Adotante[0]:      adopter1${TEST_EMAIL_DOMAIN}`);
    console.log(`  Adotante senha:   ${r.password}`);
    console.log('═══════════════════════════════════════════════════════');
  })
  .catch((err) => {
    console.error('❌ Seed falhou:', err);
    process.exit(1);
  });
