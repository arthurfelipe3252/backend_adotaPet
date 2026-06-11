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
import { CurrentUser } from '@shared/infra/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/infra/decorators/require-permissions.decorator';
import { Permission } from '@shared/domain/enums/permission.enum';
import { QuestionarioMatchService } from '@match/questionario/application/services/questionario-match.service';
import { SalvarQuestionarioDto } from '@match/questionario/application/dto/questionario-match.dto';

interface JwtUser {
  sub: string;
  tipoUsuario: string;
  permissions: string[];
}

@ApiTags('Match')
@ApiBearerAuth('access-token')
@Controller('match')
export class QuestionarioMatchController {
  constructor(private readonly service: QuestionarioMatchService) {}

  @Post('questionario')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.QUESTIONARIO_WRITE)
  @ApiOperation({ summary: 'Salvar / atualizar questionário de match' })
  salvar(@CurrentUser() user: JwtUser, @Body() dto: SalvarQuestionarioDto) {
    return this.service.salvar(user, dto);
  }

  @Get('questionario')
  @RequirePermissions(Permission.QUESTIONARIO_READ)
  @ApiOperation({ summary: 'Buscar meu questionário de match' })
  buscarMeu(@CurrentUser() user: JwtUser) {
    return this.service.buscarMeu(user);
  }

  @Get('questionario/:adotanteId')
  @RequirePermissions(Permission.QUESTIONARIO_READ)
  @ApiOperation({ summary: 'Buscar questionário de match por adotanteId' })
  buscarPorAdotante(
    @Param('adotanteId', ParseUUIDPipe) adotanteId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.buscarPorAdotante(adotanteId, user);
  }

  @Get('resultado')
  @RequirePermissions(Permission.QUESTIONARIO_READ)
  @ApiOperation({ summary: 'Calcular meu resultado de match' })
  calcularMeuMatch(@CurrentUser() user: JwtUser) {
    return this.service.calcularMeuMatch(user);
  }

  @Get('resultado/:adotanteId')
  @RequirePermissions(Permission.QUESTIONARIO_READ)
  @ApiOperation({ summary: 'Calcular resultado de match por adotanteId' })
  calcularMatch(
    @Param('adotanteId', ParseUUIDPipe) adotanteId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.calcularMatch(adotanteId, user);
  }

  @Delete('questionario')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.QUESTIONARIO_WRITE)
  @ApiOperation({ summary: 'Remover questionário (para refazer o quiz)' })
  remover(@CurrentUser() user: JwtUser) {
    return this.service.remover(user);
  }
}
