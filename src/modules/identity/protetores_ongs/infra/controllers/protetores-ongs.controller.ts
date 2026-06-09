import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AtualizarProtetorOngDto } from '@identity/protetores_ongs/application/dto/atualizar-protetor-ong.dto';
import { CriarProtetorOngDto } from '@identity/protetores_ongs/application/dto/criar-protetor-ong.dto';
import { ProtetorOngResponseDto } from '@identity/protetores_ongs/application/dto/protetor-ong-response.dto';
import { ProtetorOngService } from '@identity/protetores_ongs/application/services/protetor-ong.service';
import type { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';
import { CurrentUser } from '@identity/usuarios/infra/decorators/current-user.decorator';
import { Public } from '@identity/usuarios/infra/decorators/public.decorator';

@ApiTags('Protetores e ONGs')
@Controller('users/protetores-ongs')
export class ProtetoresOngsController {
  constructor(private readonly protetorOngService: ProtetorOngService) {}

  // ----------------------------------------------------------------
  // POST /users/protetores-ongs — registro atômico (público)
  // ----------------------------------------------------------------
  @Post()
  @Public()
  @ApiOperation({
    summary: 'Cadastra um novo protetor (PF) ou ONG (PJ)',
    description:
      'Cria, em uma única transação: endereço (opcional) + usuário ' +
      '(tipoUsuario=protetor|ong) + protetor_ong. ' +
      'O documento comprobatório (PDF/imagem em base64) é obrigatório.',
  })
  @ApiBody({ type: CriarProtetorOngDto })
  @ApiResponse({
    status: 201,
    description: 'Protetor/ONG cadastrado com sucesso',
    type: ProtetorOngResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Dados de entrada inválidos (CPF/CNPJ inválido, campo faltando, etc.)',
  })
  @ApiResponse({ status: 409, description: 'Email ou CPF/CNPJ já cadastrado' })
  async criar(
    @Body() dto: CriarProtetorOngDto,
  ): Promise<ProtetorOngResponseDto> {
    return this.protetorOngService.criar(dto);
  }

  // ----------------------------------------------------------------
  // GET /users/protetores-ongs/me
  // ----------------------------------------------------------------
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Retorna o perfil completo do protetor/ong autenticado',
    description:
      'Inclui dados do usuário, do protetor/ong (cpfCnpj, descrição, ' +
      'foto, documento comprobatório, telefone de contato) e do endereço ' +
      'quando cadastrado. Aceita tipoUsuario protetor ou ong.',
  })
  @ApiResponse({ status: 200, type: ProtetorOngResponseDto })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado não é protetor nem ong',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil de protetor/ong não encontrado para o usuário',
  })
  async buscarMe(
    @CurrentUser() autenticado: AuthenticatedUser,
  ): Promise<ProtetorOngResponseDto> {
    return this.protetorOngService.buscarMeuPerfil(
      autenticado.id,
      autenticado.tipoUsuario,
    );
  }

  // ----------------------------------------------------------------
  // PATCH /users/protetores-ongs/me
  // ----------------------------------------------------------------
  @Patch('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Atualiza o perfil do protetor/ong autenticado',
    description:
      'Aceita qualquer combinação de campos mutáveis. Endereço: omitido ' +
      'não mexe; objeto completo substitui in-place. ' +
      'Imutáveis: cpfCnpj, email, tipoUsuario, documentoComprobatorio. ' +
      'Para alterar senha, use PATCH /users/me/password.',
  })
  @ApiBody({ type: AtualizarProtetorOngDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    type: ProtetorOngResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado não é protetor nem ong',
  })
  @ApiResponse({
    status: 404,
    description:
      'Perfil de protetor/ong não encontrado para o usuário autenticado',
  })
  async atualizarMe(
    @CurrentUser() autenticado: AuthenticatedUser,
    @Body() dto: AtualizarProtetorOngDto,
  ): Promise<ProtetorOngResponseDto> {
    return this.protetorOngService.atualizarMeuPerfil(
      autenticado.id,
      autenticado.tipoUsuario,
      dto,
    );
  }
}
