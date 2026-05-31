import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * senderId NÃO está no DTO — é derivado do JWT no service (resolvido
 * para adopters.id ou protetores_ongs.id conforme o tipoUsuario). Aceitar
 * do cliente permitiria enviar mensagem em nome de outro participante.
 */
export class CreateMessageDto {
  @IsString()
  @MaxLength(2000)
  content!: string;
}

export class UpdateMessageReadDto {
  @IsBoolean()
  isRead!: boolean;
}

export class ListMessagesQueryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export type SenderTipo = 'adotante' | 'protetor';

export interface SenderSummary {
  id: string;
  nome: string;
  /**
   * Discrimina se o `id` aponta para `adotantes.id` ou
   * `protetores_ongs.id` — front usa pra render correto + posicionar
   * o balão da mensagem.
   */
  tipo: SenderTipo;
}

export class MessageResponseDto {
  id!: string;
  conversationId!: string;
  senderId!: string;
  /**
   * Summary do remetente (id + nome + tipo) — populado pelo service.
   * Nulo se o perfil foi excluído.
   */
  sender!: SenderSummary | null;
  content!: string;
  isRead!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
