import { ReportsController } from './reports.controller';
import { ForbiddenException } from '@nestjs/common';

const protetorId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const protetorJwt = { sub: protetorId, tipoUsuario: 'protetor', permissions: [] };
const adotanteJwt = { sub: 'other-id', tipoUsuario: 'adotante', permissions: [] };
const mockKpis = { petsDisponivel: 3, conversasAtivas: 2 };
const mockDashboard = { kpis: mockKpis, adoptionsTimeline: [], requestsTimeline: [], funnel: {}, topPets: [], stalePets: [] };

describe('ReportsController', () => {
  const dashboardService = {
    resolveProtetorId: jest.fn(),
    getDashboard: jest.fn(),
    getKpis: jest.fn(),
    getAdoptionsTimeline: jest.fn(),
    getRequestsTimeline: jest.fn(),
    getFunnel: jest.fn(),
    getTopPets: jest.fn(),
    getStalePets: jest.fn(),
  };

  const controller = new ReportsController(dashboardService as any);

  beforeEach(() => {
    jest.clearAllMocks();
    dashboardService.resolveProtetorId.mockImplementation((userId: string, tipoUsuario: string) => {
      if (tipoUsuario !== 'protetor' && tipoUsuario !== 'ong') {
        throw new ForbiddenException();
      }
      return userId;
    });
  });

  describe('getDashboard', () => {
    it('calls resolveProtetorId then getDashboard', async () => {
      dashboardService.getDashboard.mockResolvedValue(mockDashboard);

      const result = await controller.getDashboard(protetorJwt as any, {} as any);

      expect(dashboardService.resolveProtetorId).toHaveBeenCalledWith(protetorId, 'protetor');
      expect(dashboardService.getDashboard).toHaveBeenCalledWith(protetorId, {});
      expect(result).toEqual(mockDashboard);
    });

    it('propagates ForbiddenException for adotante', async () => {
      await expect(
        controller.getDashboard(adotanteJwt as any, {} as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getKpis', () => {
    it('calls resolveProtetorId then getKpis', async () => {
      dashboardService.getKpis.mockResolvedValue(mockKpis);

      const result = await controller.getKpis(protetorJwt as any);

      expect(dashboardService.getKpis).toHaveBeenCalledWith(protetorId);
      expect(result).toEqual(mockKpis);
    });
  });

  describe('getAdoptionsTimeline', () => {
    it('defaults months to 12', async () => {
      dashboardService.getAdoptionsTimeline.mockResolvedValue([]);

      await controller.getAdoptionsTimeline(protetorJwt as any, {} as any);

      expect(dashboardService.getAdoptionsTimeline).toHaveBeenCalledWith(protetorId, 12);
    });

    it('uses provided months value', async () => {
      dashboardService.getAdoptionsTimeline.mockResolvedValue([]);

      await controller.getAdoptionsTimeline(protetorJwt as any, { months: 6 } as any);

      expect(dashboardService.getAdoptionsTimeline).toHaveBeenCalledWith(protetorId, 6);
    });
  });

  describe('getRequestsTimeline', () => {
    it('defaults months to 12', async () => {
      dashboardService.getRequestsTimeline.mockResolvedValue([]);

      await controller.getRequestsTimeline(protetorJwt as any, {} as any);

      expect(dashboardService.getRequestsTimeline).toHaveBeenCalledWith(protetorId, 12);
    });
  });

  describe('getFunnel', () => {
    it('delegates with from/to from query', async () => {
      const from = new Date('2026-01-01');
      const to = new Date('2026-06-01');
      dashboardService.getFunnel.mockResolvedValue({ received: 5 });

      await controller.getFunnel(protetorJwt as any, { from, to } as any);

      expect(dashboardService.getFunnel).toHaveBeenCalledWith(protetorId, from, to);
    });
  });

  describe('getTopPets', () => {
    it('defaults limit to 5', async () => {
      dashboardService.getTopPets.mockResolvedValue([]);

      await controller.getTopPets(protetorJwt as any, {} as any);

      expect(dashboardService.getTopPets).toHaveBeenCalledWith(protetorId, 5);
    });
  });

  describe('getStalePets', () => {
    it('defaults days to 30', async () => {
      dashboardService.getStalePets.mockResolvedValue([]);

      await controller.getStalePets(protetorJwt as any, {} as any);

      expect(dashboardService.getStalePets).toHaveBeenCalledWith(protetorId, 30);
    });
  });
});
