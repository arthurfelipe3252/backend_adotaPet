import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '@shared/domain/exceptions/domain.exception';

/**
 * Filter global que captura DomainException (e subclasses) e mapeia
 * pra HTTP 400 BadRequest. Sem isso, o NestJS responderia 500 — confuso
 * pra quem chama a API e esconde o problema real.
 *
 * Registrado em main.ts via app.useGlobalFilters().
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
      error: 'Bad Request',
    });
  }
}
