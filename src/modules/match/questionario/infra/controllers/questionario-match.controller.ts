import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "@identity/usuarios/infra/guards/jwt-auth.guard";
import { CurrentUser } from "@identity/usuarios/infra/decorators/current-user.decorator";
import type { AuthenticatedUser } from "@identity/usuarios/infra/auth/types/authenticated-user.type";
import { QuestionarioMatchService } from "@match/questionario/application/services/questionario-match.service";
import { SalvarQuestionarioDto } from "@match/questionario/application/dto/questionario-match.dto";

@ApiTags("Match")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller("match")
export class QuestionarioMatchController {
  constructor(private readonly service: QuestionarioMatchService) {}

  /**
   * POST /api/v1/match/questionario
   * Salva (cria ou atualiza) o questionário do usuário autenticado.
   * O id do usuário é usado como adotanteId.
   */
  @Post("questionario")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Salvar / atualizar questionário de match" })
  salvar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SalvarQuestionarioDto,
  ) {
    return this.service.salvar(user.id, dto);
  }

  /**
   * GET /api/v1/match/questionario
   * Retorna o questionário salvo do usuário autenticado.
   */
  @Get("questionario")
  @ApiOperation({ summary: "Buscar meu questionário de match" })
  buscarMeu(@CurrentUser() user: AuthenticatedUser) {
    return this.service.buscarPorAdotante(user.id);
  }

  /**
   * GET /api/v1/match/questionario/:adotanteId
   * Consulta o questionário de qualquer adotante (admin / protetor).
   */
  @Get("questionario/:adotanteId")
  @ApiOperation({ summary: "Buscar questionário de match por adotanteId" })
  buscarPorAdotante(@Param("adotanteId") adotanteId: string) {
    return this.service.buscarPorAdotante(adotanteId);
  }

  /**
   * GET /api/v1/match/resultado
   * Calcula e retorna os pets compatíveis para o usuário autenticado,
   * ordenados por score de compatibilidade decrescente.
   */
  @Get("resultado")
  @ApiOperation({ summary: "Calcular meu resultado de match" })
  calcularMeuMatch(@CurrentUser() user: AuthenticatedUser) {
    return this.service.calcularMatch(user.id);
  }

  /**
   * GET /api/v1/match/resultado/:adotanteId
   * Calcula o resultado de match para um adotante específico.
   */
  @Get("resultado/:adotanteId")
  @ApiOperation({ summary: "Calcular resultado de match por adotanteId" })
  calcularMatch(@Param("adotanteId") adotanteId: string) {
    return this.service.calcularMatch(adotanteId);
  }

  /**
   * DELETE /api/v1/match/questionario
   * Remove o questionário do usuário autenticado (para refazer o quiz).
   */
  @Delete("questionario")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remover questionário (para refazer o quiz)" })
  remover(@CurrentUser() user: AuthenticatedUser) {
    return this.service.remover(user.id);
  }
}
