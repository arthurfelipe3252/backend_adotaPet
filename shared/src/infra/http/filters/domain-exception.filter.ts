import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '@shared/domain/exceptions/domain.exception';

/**
 * Captura DomainException (e subclasses) lançada pelas entidades de domínio
 * quando uma regra de negócio é violada, e mapeia pra HTTP 400 BadRequest.
 * Sem isso o Nest responderia 500 — escondendo a regra violada de quem chama.
 *
 * Registrado globalmente via APP_FILTER no SharedModule, então vale pros 6
 * serviços sem configuração por serviço.
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
      error: 'Bad Request',
    });
  }
}
