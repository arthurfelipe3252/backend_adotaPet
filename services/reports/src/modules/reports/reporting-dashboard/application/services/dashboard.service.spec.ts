import { ForbiddenException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

const protetorId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const mockPetStatus = { disponivel: 3, emProcesso: 1, adotado: 5 };
const mockStatusCounts = { received: 10, inAnalysis: 4, approved: 6, rejected: 2 };
const mockTimeline = [
  { monthStart: new Date('2026-01-01'), count: 3 },
  { monthStart: new Date('2026-02-01'), count: 5 },
];
const mockTopPets = [{ petId: 'pet-1', totalRequests: 8 }];
const mockPetDetails = [
  { id: 'pet-1', nome: 'Rex', especie: 'cao', porte: 'medio', status: 'disponivel', createdAt: new Date('2026-01-01') },
];
const mockStalePets = [
  { id: 'pet-2', nome: 'Max', especie: 'cao', porte: 'pequeno', createdAt: new Date('2026-01-01') },
];

describe('DashboardService', () => {
  const petsReporting = {
    countByStatus: jest.fn(),
    findByIds: jest.fn(),
    findStalePets: jest.fn(),
  };

  const adoptionReporting = {
    statusCounts: jest.fn(),
    countApprovedInCurrentMonth: jest.fn(),
    averageDaysToAdoption: jest.fn(),
    adoptionsTimelineByMonth: jest.fn(),
    requestsTimelineByMonth: jest.fn(),
    topRequestedPets: jest.fn(),
  };

  const chatReporting = {
    countActiveConversations: jest.fn(),
    countUnreadMessagesForProtetor: jest.fn(),
  };

  const service = new DashboardService(
    petsReporting as any,
    adoptionReporting as any,
    chatReporting as any,
  );

  beforeEach(() => jest.clearAllMocks());

  describe('resolveProtetorId', () => {
    it('throws ForbiddenException for adotante', () => {
      expect(() => service.resolveProtetorId(protetorId, 'adotante')).toThrow(ForbiddenException);
    });

    it('returns userId for protetor', () => {
      expect(service.resolveProtetorId(protetorId, 'protetor')).toBe(protetorId);
    });

    it('returns userId for ong', () => {
      expect(service.resolveProtetorId(protetorId, 'ong')).toBe(protetorId);
    });
  });

  describe('getKpis', () => {
    it('aggregates data from all ports', async () => {
      petsReporting.countByStatus.mockResolvedValue(mockPetStatus);
      adoptionReporting.statusCounts.mockResolvedValue(mockStatusCounts);
      adoptionReporting.countApprovedInCurrentMonth.mockResolvedValue(2);
      adoptionReporting.averageDaysToAdoption.mockResolvedValue(14.5);
      chatReporting.countActiveConversations.mockResolvedValue(5);
      chatReporting.countUnreadMessagesForProtetor.mockResolvedValue(3);

      const result = await service.getKpis(protetorId);

      expect(result.petsDisponivel).toBe(3);
      expect(result.petsAdotadoTotal).toBe(5);
      expect(result.petsAdotadoMesAtual).toBe(2);
      expect(result.conversasAtivas).toBe(5);
      expect(result.mensagensNaoLidas).toBe(3);
      expect(result.tempoMedioAdocaoDias).toBe(14.5);
      expect(result.solicitacoesPendentes).toBe(14); // received(10) + inAnalysis(4)
      expect(result.taxaConversaoPct).toBeCloseTo(27.27, 1); // 6/22 * 100
    });

    it('sets taxaConversao to null when totalRequests is 0', async () => {
      petsReporting.countByStatus.mockResolvedValue(mockPetStatus);
      adoptionReporting.statusCounts.mockResolvedValue({
        received: 0,
        inAnalysis: 0,
        approved: 0,
        rejected: 0,
      });
      adoptionReporting.countApprovedInCurrentMonth.mockResolvedValue(0);
      adoptionReporting.averageDaysToAdoption.mockResolvedValue(null);
      chatReporting.countActiveConversations.mockResolvedValue(0);
      chatReporting.countUnreadMessagesForProtetor.mockResolvedValue(0);

      const result = await service.getKpis(protetorId);

      expect(result.taxaConversaoPct).toBeNull();
      expect(result.tempoMedioAdocaoDias).toBeNull();
    });
  });

  describe('getAdoptionsTimeline', () => {
    it('fills gaps and returns correct month count', async () => {
      adoptionReporting.adoptionsTimelineByMonth.mockResolvedValue(mockTimeline);

      const result = await service.getAdoptionsTimeline(protetorId, 6);

      expect(result).toHaveLength(6);
      expect(result.every((p) => typeof p.count === 'number')).toBe(true);
    });
  });

  describe('getRequestsTimeline', () => {
    it('fills gaps and returns correct month count', async () => {
      adoptionReporting.requestsTimelineByMonth.mockResolvedValue([]);

      const result = await service.getRequestsTimeline(protetorId, 3);

      expect(result).toHaveLength(3);
      expect(result.every((p) => p.count === 0)).toBe(true);
    });
  });

  describe('getFunnel', () => {
    it('returns status counts as funnel', async () => {
      adoptionReporting.statusCounts.mockResolvedValue(mockStatusCounts);

      const result = await service.getFunnel(protetorId);

      expect(result.received).toBe(10);
      expect(result.approved).toBe(6);
    });
  });

  describe('getTopPets', () => {
    it('enriches top pets with pet details', async () => {
      adoptionReporting.topRequestedPets.mockResolvedValue(mockTopPets);
      petsReporting.findByIds.mockResolvedValue(mockPetDetails);

      const result = await service.getTopPets(protetorId, 5);

      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Rex');
      expect(result[0].totalRequests).toBe(8);
    });

    it('returns empty array when no top pets', async () => {
      adoptionReporting.topRequestedPets.mockResolvedValue([]);

      const result = await service.getTopPets(protetorId, 5);

      expect(result).toEqual([]);
    });
  });

  describe('getStalePets', () => {
    it('computes dias no catalogo for each stale pet', async () => {
      petsReporting.findStalePets.mockResolvedValue(mockStalePets);

      const result = await service.getStalePets(protetorId, 30);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pet-2');
      expect(typeof result[0].diasNoCatalogo).toBe('number');
      expect(result[0].diasNoCatalogo).toBeGreaterThan(0);
    });
  });

  describe('getDashboard', () => {
    it('returns all sections in parallel', async () => {
      petsReporting.countByStatus.mockResolvedValue(mockPetStatus);
      adoptionReporting.statusCounts.mockResolvedValue(mockStatusCounts);
      adoptionReporting.countApprovedInCurrentMonth.mockResolvedValue(2);
      adoptionReporting.averageDaysToAdoption.mockResolvedValue(10);
      chatReporting.countActiveConversations.mockResolvedValue(1);
      chatReporting.countUnreadMessagesForProtetor.mockResolvedValue(0);
      adoptionReporting.adoptionsTimelineByMonth.mockResolvedValue([]);
      adoptionReporting.requestsTimelineByMonth.mockResolvedValue([]);
      adoptionReporting.topRequestedPets.mockResolvedValue([]);
      petsReporting.findByIds.mockResolvedValue([]);
      petsReporting.findStalePets.mockResolvedValue([]);

      const result = await service.getDashboard(protetorId, {} as any);

      expect(result.kpis).toBeDefined();
      expect(result.adoptionsTimeline).toBeDefined();
      expect(result.requestsTimeline).toBeDefined();
      expect(result.funnel).toBeDefined();
      expect(result.topPets).toEqual([]);
      expect(result.stalePets).toEqual([]);
    });
  });
});
