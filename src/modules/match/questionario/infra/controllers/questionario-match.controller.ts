import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '@identity/usuarios/infra/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';
import { QuestionarioMatchService } from '@match/questionario/application/services/questionario-match.service';
import { SalvarQuestionarioDto } from '@match/questionario/application/dto/questionario-match.dto';

/**
 * Endpoints de questionário de match. Todos exigem JWT (guard global) e
 * autorizam apenas usuários do tipo `adotante` — protetores/ONGs recebem
 * 403. Endpoints com `:adotanteId` na URL verificam ownership.
 */
@ApiTags('Match')
@ApiBearerAuth('access-token')
@Controller('match')
export class QuestionarioMatchController {
  constructor(private readonly service: QuestionarioMatchService) {}

  // POST /api/v1/match/questionario — cria/atualiza meu questionário
  @Post('questionario')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Salvar / atualizar questionário de match' })
  salvar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SalvarQuestionarioDto,
  ) {
    return this.service.salvar(user.id, user.tipoUsuario, dto);
  }

  // GET /api/v1/match/questionario — meu questionário
  @Get('questionario')
  @ApiOperation({ summary: 'Buscar meu questionário de match' })
  buscarMeu(@CurrentUser() user: AuthenticatedUser) {
    return this.service.buscarMeu(user.id, user.tipoUsuario);
  }

  // GET /api/v1/match/questionario/:adotanteId — ownership
  @Get('questionario/:adotanteId')
  @ApiOperation({ summary: 'Buscar questionário de match por adotanteId' })
  buscarPorAdotante(
    @Param('adotanteId', ParseUUIDPipe) adotanteId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.buscarPorAdotante(
      adotanteId,
      user.id,
      user.tipoUsuario,
    );
  }

  // GET /api/v1/match/resultado — meu resultado
  @Get('resultado')
  @ApiOperation({ summary: 'Calcular meu resultado de match' })
  calcularMeuMatch(@CurrentUser() user: AuthenticatedUser) {
    return this.service.calcularMeuMatch(user.id, user.tipoUsuario);
  }

  // GET /api/v1/match/resultado/:adotanteId — ownership
  @Get('resultado/:adotanteId')
  @ApiOperation({ summary: 'Calcular resultado de match por adotanteId' })
  calcularMatch(
    @Param('adotanteId', ParseUUIDPipe) adotanteId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.calcularMatch(
      adotanteId,
      user.id,
      user.tipoUsuario,
    );
  }

  // DELETE /api/v1/match/questionario — meu questionário
  @Delete('questionario')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover questionário (para refazer o quiz)' })
  remover(@CurrentUser() user: AuthenticatedUser) {
    return this.service.remover(user.id, user.tipoUsuario);
  }
}
