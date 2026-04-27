import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AlterarSenhaDto } from '@identity/usuarios/application/dto/alterar-senha.dto';
import { AtualizarUsuarioDto } from '@identity/usuarios/application/dto/atualizar-usuario.dto';
import { UsuarioResponseDto } from '@identity/usuarios/application/dto/usuario-response.dto';
import { UsuarioService } from '@identity/usuarios/application/services/usuario.service';
import type { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';
import { CurrentUser } from '@identity/usuarios/infra/decorators/current-user.decorator';
import { JwtAuthGuard } from '@identity/usuarios/infra/guards/jwt-auth.guard';

/**
 * Endpoints de gestão do usuário-mãe.
 *
 * O cadastro inicial NÃO acontece aqui: cada tipo de usuário tem o seu
 * endpoint atômico (POST /users/adotantes, POST /users/protetores-ongs)
 * porque cada um precisa criar um registro filho na mesma transação.
 */
@ApiTags('Users')
@Controller('users')
export class UsuariosController {
  constructor(private readonly usuarioService: UsuarioService) {}

  // ----------------------------------------------------------------
  // GET /users/me — perfil próprio
  //
  // IMPORTANTE: precisa vir ANTES de GET /users/:id, senão o roteador
  // do Express interpreta "me" como :id.
  // ----------------------------------------------------------------
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Retorna o perfil do usuário autenticado',
  })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  async buscarPerfilProprio(
    @CurrentUser() autenticado: AuthenticatedUser,
  ): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarioService.buscarPerfilProprio(
      autenticado.id,
    );
    return UsuarioResponseDto.deUsuario(usuario);
  }

  // ----------------------------------------------------------------
  // PATCH /users/me/password — troca de senha
  //
  // Também precisa vir antes de PATCH /users/:id pelo mesmo motivo.
  // ----------------------------------------------------------------
  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Altera a senha do usuário autenticado',
    description:
      'Requer a senha atual para confirmação. Retorna o usuário atualizado.',
  })
  @ApiBody({ type: AlterarSenhaDto })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({
    status: 401,
    description: 'Senha atual incorreta ou token inválido',
  })
  async alterarSenha(
    @CurrentUser() autenticado: AuthenticatedUser,
    @Body() dto: AlterarSenhaDto,
  ): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarioService.alterarSenha(autenticado.id, dto);
    return UsuarioResponseDto.deUsuario(usuario);
  }

  // ----------------------------------------------------------------
  // GET /users/:id
  //
  // Por enquanto só permite buscar o próprio usuário (id === autenticado.id).
  // O slot RESTful fica reservado pra quando virar "perfil público com
  // campos filtrados" (ex: ONG visível pro adotante).
  // ----------------------------------------------------------------
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Retorna os dados de um usuário pelo identificador',
    description:
      'Atualmente só é permitido buscar o próprio usuário. ' +
      'Tentar buscar outro retorna 403.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do usuário',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Tentando acessar dados de outro usuário',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async buscarPorId(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() autenticado: AuthenticatedUser,
  ): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarioService.buscarPorId(id, autenticado.id);
    return UsuarioResponseDto.deUsuario(usuario);
  }

  // ----------------------------------------------------------------
  // PATCH /users/:id
  // ----------------------------------------------------------------
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Atualiza dados básicos do usuário (nome, telefone)',
    description:
      'Somente o próprio usuário pode alterar seus dados. ' +
      'Email e tipoUsuario são imutáveis após o cadastro.',
  })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiBody({ type: AtualizarUsuarioDto })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Tentando alterar outro usuário' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarUsuarioDto,
    @CurrentUser() autenticado: AuthenticatedUser,
  ): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarioService.atualizar(
      id,
      dto,
      autenticado.id,
    );
    return UsuarioResponseDto.deUsuario(usuario);
  }

  // ----------------------------------------------------------------
  // DELETE /users/:id — soft delete
  // ----------------------------------------------------------------
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Desativa a conta do usuário (soft delete)',
    description:
      'Seta ativo = false. A linha do banco não é apagada. ' +
      'Somente o próprio usuário pode executar.',
  })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({ status: 204, description: 'Conta desativada com sucesso' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Tentando desativar outro usuário' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async desativar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() autenticado: AuthenticatedUser,
  ): Promise<void> {
    await this.usuarioService.desativar(id, autenticado.id);
  }
}
