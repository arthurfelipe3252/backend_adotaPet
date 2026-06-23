import { Injectable, Logger } from '@nestjs/common';
import { EmailSender } from '@identity/usuarios/domain/ports/email-sender.interface';

/**
 * Implementação concreta de envio de e-mail via API HTTP da Resend
 * (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Escolhida por ser uma API HTTP simples (sem precisar gerenciar SMTP) e
 * por não exigir nenhuma dependência nova — Node 22 já tem `fetch` global.
 *
 * Variáveis de ambiente necessárias (ver .env.example):
 * - RESEND_API_KEY:     chave de API da Resend.
 * - EMAIL_FROM:         remetente, ex: "AdotaPet <nao-responda@adotapet.com>".
 * - FRONTEND_RESET_URL: URL base do app que recebe o token via query string,
 *                        ex: "https://app.adotapet.com/reset-password".
 *
 * Se RESEND_API_KEY não estiver configurada (ex: ambiente local sem conta
 * Resend), o envio é apenas logado no console em vez de falhar — isso evita
 * quebrar o fluxo de dev/teste local enquanto não há credencial real.
 */
@Injectable()
export class ResendEmailSender implements EmailSender {
  private readonly logger = new Logger(ResendEmailSender.name);

  async sendPasswordResetEmail(params: {
    to: string;
    nome: string;
    resetUrl: string;
  }): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from =
      process.env.EMAIL_FROM ??
      'AdotaPet <nao-responda@adotapet.com>';

    const subject = 'Recupere sua senha — AdotaPet';
    const html = this.buildHtml(params.nome, params.resetUrl);

    if (!apiKey) {
      // Sem credencial configurada: não falha a request, só loga.
      // Isso mantém o fluxo testável em ambiente local sem conta Resend.
      this.logger.warn(
        `RESEND_API_KEY ausente — e-mail de recuperação NÃO enviado de fato. ` +
          `Link gerado para ${params.to}: ${params.resetUrl}`,
      );
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [params.to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.error(
          `Falha ao enviar e-mail de recuperação para ${params.to}: ` +
            `${response.status} ${body}`,
        );
      }
    } catch (err) {
      // Nunca propaga o erro: o use case responde sempre com sucesso
      // genérico, independentemente do envio ter funcionado ou não.
      this.logger.error(
        `Erro de rede ao enviar e-mail de recuperação para ${params.to}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private buildHtml(nome: string, resetUrl: string): string {
    return `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Recupere sua senha</h2>
        <p>Olá, ${this.escapeHtml(nome)}.</p>
        <p>Recebemos uma solicitação para redefinir sua senha no AdotaPet.
        Clique no botão abaixo para criar uma nova senha. Este link expira
        em 30 minutos.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}"
             style="background:#E8743B;color:#fff;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:bold;">
            Definir nova senha
          </a>
        </p>
        <p>Se você não pediu essa redefinição, pode ignorar este e-mail —
        sua senha continua a mesma.</p>
      </div>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}