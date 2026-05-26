import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdotanteResponseDto } from '@identity/adotantes/application/dto/adotante-response.dto';
import { AtualizarAdotanteDto } from '@identity/adotantes/application/dto/atualizar-adotante.dto';
import { CriarAdotanteDto } from '@identity/adotantes/application/dto/criar-adotante.dto';
import { AdotanteService } from '@identity/adotantes/application/services/adotante.service';
import type { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';
import { CurrentUser } from '@identity/usuarios/infra/decorators/current-user.decorator';
import { JwtAuthGuard } from '@identity/usuarios/infra/guards/jwt-auth.guard';

@ApiTags('Adotantes')
@Controller('users/adotantes')
export class AdotantesController {
  constructor(private readonly adotanteService: AdotanteService) {}

  // ----------------------------------------------------------------
  // POST /users/adotantes — registro atômico (público)
  // ----------------------------------------------------------------
  @Post()
  @ApiOperation({
    summary: 'Cadastra um novo adotante',
    description:
      'Cria, em uma única transação: endereço (opcional) + usuário ' +
      '(tipoUsuario=adotante) + adotante. Em caso de falha em qualquer ' +
      'passo, nada é persistido.',
  })
  @ApiBody({ type: CriarAdotanteDto })
  @ApiResponse({
    status: 201,
    description: 'Adotante cadastrado com sucesso',
    type: AdotanteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de entrada inválidos (validação ou regra de domínio)',
  })
  @ApiResponse({ status: 409, description: 'Email ou CPF já cadastrado' })
  async criar(@Body() dto: CriarAdotanteDto): Promise<AdotanteResponseDto> {
    return this.adotanteService.criar(dto);
  }

  // ----------------------------------------------------------------
  // GET /users/adotantes/me — perfil completo do adotante autenticado
  //
  // Não há GET /:id porque o id sempre vem do JWT — não dá pra pedir
  // o perfil de outro adotante por aqui (privacidade por construção).
  // ----------------------------------------------------------------
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Retorna o perfil completo do adotante autenticado',
    description:
      'Inclui dados do usuário, do adotante (cpf, foto) e do endereço ' +
      '(quando cadastrado). O usuário é identificado pelo JWT — não há ' +
      'parâmetro de id.',
  })
  @ApiResponse({ status: 200, type: AdotanteResponseDto })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado não é do tipo adotante',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil de adotante não encontrado para o usuário',
  })
  async buscarMe(
    @CurrentUser() autenticado: AuthenticatedUser,
  ): Promise<AdotanteResponseDto> {
    return this.adotanteService.buscarMeuPerfil(
      autenticado.id,
      autenticado.tipoUsuario,
    );
  }

  // ----------------------------------------------------------------
  // PATCH /users/adotantes/me — atualiza perfil completo do adotante
  //
  // Atualiza, em uma única transação, qualquer combinação de:
  //  - dados do usuário-mãe (nome, email, telefone)
  //  - dados do adotante  (imagemBase64)
  //  - endereço            (cria, atualiza in-place ou desvincula com null)
  //
  // Imutáveis aqui: cpf, tipoUsuario, senha (use PATCH /users/me/password).
  // ----------------------------------------------------------------
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Atualiza o perfil do adotante autenticado',
    description:
      'Aceita qualquer combinação de campos mutáveis. Endereço: omitido ' +
      'não mexe; objeto completo substitui in-place. ' +
      'Imutáveis: cpf, email, tipoUsuario. ' +
      'Para alterar senha, use PATCH /users/me/password.',
  })
  @ApiBody({ type: AtualizarAdotanteDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    type: AdotanteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado não é do tipo adotante',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil de adotante não encontrado para o usuário autenticado',
  })
  async atualizarMe(
    @CurrentUser() autenticado: AuthenticatedUser,
    @Body() dto: AtualizarAdotanteDto,
  ): Promise<AdotanteResponseDto> {
    return this.adotanteService.atualizarMeuPerfil(
      autenticado.id,
      autenticado.tipoUsuario,
      dto,
    );
  }
}
