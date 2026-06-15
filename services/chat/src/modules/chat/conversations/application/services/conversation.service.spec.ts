import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { Conversation } from '@chat/conversations/domain/models/conversation.entity';

const adopterId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const protetorId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const otherId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const conversationId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const adoptionRequestId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

const adotanteJwt = { sub: adopterId, adotanteId: adopterId, tipoUsuario: 'adotante' };
const protetorJwt = { sub: protetorId, protetorId, tipoUsuario: 'protetor' };
const outroJwt = { sub: otherId, adotanteId: otherId, tipoUsuario: 'adotante' };

const buildConversation = (isActive = true) =>
  Conversation.restore({
    id: conversationId,
    adoptionRequestId,
    adopterId,
    protetorId,
    isActive,
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

describe('ConversationService', () => {
  const repository = {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findByAdoptionRequestId: jest.fn(),
    findByParticipant: jest.fn(),
  };

  const chatMessaging = {
    publishConversationCreated: jest.fn().mockResolvedValue(undefined),
    publishMessageCreated: jest.fn().mockResolvedValue(undefined),
  };

  const messageRepository = {
    countUnreadByConversationForViewer: jest.fn().mockResolvedValue(new Map()),
    findLastMessageByConversation: jest.fn().mockResolvedValue(new Map()),
    markAllAsReadInConversation: jest.fn().mockResolvedValue(0),
  };

  const profileRepository = {
    upsert: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue(null),
    findByIds: jest.fn().mockResolvedValue(new Map()),
  };

  const service = new ConversationService(
    repository as any,
    messageRepository as any,
    profileRepository as any,
    chatMessaging as any,
  );

  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('returns existing conversation when already exists for adoptionRequestId', async () => {
      const existing = buildConversation();
      repository.findByAdoptionRequestId.mockResolvedValue(existing);

      const result = await service.create(adotanteJwt, {
        adoptionRequestId,
        adopterId,
        protetorId,
      } as any);

      expect(repository.create).not.toHaveBeenCalled();
      expect(result.id).toBe(conversationId);
    });

    it('throws BadRequestException when no conversation exists yet (criada na aprovação)', async () => {
      repository.findByAdoptionRequestId.mockResolvedValue(null);

      await expect(
        service.create(adotanteJwt, { adoptionRequestId } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('createInternal', () => {
    it('skips creation if conversation already exists', async () => {
      repository.findByAdoptionRequestId.mockResolvedValue(buildConversation());

      await service.createInternal({ adoptionRequestId, adopterId, protetorId });

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('creates conversation and publishes event', async () => {
      repository.findByAdoptionRequestId.mockResolvedValue(null);
      repository.create.mockResolvedValue(buildConversation());

      await service.createInternal({ adoptionRequestId, adopterId, protetorId });

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(chatMessaging.publishConversationCreated).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('queries by adopterId for adotante', async () => {
      repository.findByParticipant.mockResolvedValue([buildConversation()]);

      const result = await service.findAll(adotanteJwt);

      expect(repository.findByParticipant).toHaveBeenCalledWith({ adopterId });
      expect(result).toHaveLength(1);
    });

    it('queries by protetorId for protetor', async () => {
      repository.findByParticipant.mockResolvedValue([buildConversation()]);

      await service.findAll(protetorJwt);

      expect(repository.findByParticipant).toHaveBeenCalledWith({ protetorId });
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(conversationId, adotanteJwt)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user is not a participant', async () => {
      repository.findById.mockResolvedValue(buildConversation());

      await expect(service.findById(conversationId, outroJwt)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('returns conversation for adopter participant', async () => {
      repository.findById.mockResolvedValue(buildConversation());

      const result = await service.findById(conversationId, adotanteJwt);

      expect(result.id).toBe(conversationId);
    });

    it('returns conversation for protetor participant', async () => {
      repository.findById.mockResolvedValue(buildConversation());

      const result = await service.findById(conversationId, protetorJwt);

      expect(result.id).toBe(conversationId);
    });

    it('populates adopter/protetor summaries from the profile replica', async () => {
      repository.findById.mockResolvedValue(buildConversation());
      profileRepository.findByIds.mockResolvedValue(
        new Map([
          [adopterId, { id: adopterId, nome: 'Ana', tipo: 'adotante' }],
          [protetorId, { id: protetorId, nome: 'ONG Patas', tipo: 'protetor' }],
        ]),
      );

      const result = await service.findById(conversationId, adotanteJwt);

      expect(result.adopter).toEqual({ id: adopterId, nome: 'Ana' });
      expect(result.protetor).toEqual({ id: protetorId, nome: 'ONG Patas' });
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateStatus(conversationId, adotanteJwt, { isActive: false }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when not a participant', async () => {
      repository.findById.mockResolvedValue(buildConversation());

      await expect(
        service.updateStatus(conversationId, outroJwt, { isActive: false }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updates isActive status', async () => {
      const conversation = buildConversation(true);
      repository.findById.mockResolvedValue(conversation);
      repository.update.mockResolvedValue(undefined);

      const result = await service.updateStatus(conversationId, adotanteJwt, { isActive: false });

      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(result.isActive).toBe(false);
    });
  });
});
