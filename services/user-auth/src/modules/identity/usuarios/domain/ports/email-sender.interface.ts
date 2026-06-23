export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

/**
 * Porta de domínio para envio de e-mail. A implementação concreta (qual
 * provedor, como autentica, como monta o HTML) fica em infra/email — esta
 * interface mantém o use case (ForgotPasswordService) desacoplado do
 * provedor escolhido.
 */
export interface EmailSender {
  /**
   * Envia o e-mail de recuperação de senha contendo o link com o token.
   * Implementações devem ser "fire and forget" do ponto de vista do
   * use case: se o envio falhar, o use case não deve vazar esse detalhe
   * na resposta HTTP (a resposta de forgot-password é sempre genérica).
   */
  sendPasswordResetEmail(params: {
    to: string;
    nome: string;
    resetUrl: string;
  }): Promise<void>;
}