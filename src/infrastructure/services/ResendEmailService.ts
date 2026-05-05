/**
 * ResendEmailService
 *
 * Production implementation of IEmailService using Resend.
 * Sends transactional emails for the screening workflow.
 * UI/UX Updated: Professional Corporate Design System
 */

import { Resend } from 'resend';
import {
  IEmailService,
  EmailOptions,
  EmailAttachment,
} from '../../domain/interfaces/services/IEmailService';

export class ResendEmailService implements IEmailService {
  private resend: Resend;
  private fromEmail: string;

  // Corporate Colors
  private colors = {
    primary: '#059669', // Emerald 600
    primaryDark: '#047857',
    textMain: '#111827', // Gray 900
    textSecondary: '#4b5563', // Gray 600
    bgBody: '#f3f4f6',
    bgCard: '#ffffff',
    border: '#e5e7eb',
    error: '#dc2626',
    warning: '#d97706',
    info: '#2563eb',
  };

  constructor(apiKey: string, fromEmail: string = 'Preca <noreply@botia.pro>') {
    this.resend = new Resend(apiKey);
    this.fromEmail = fromEmail;
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.htmlBody,
        text: options.textBody,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
        })),
      });

      if (error) {
        console.error('Resend email error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log('Email sent successfully:', data);
    } catch (error) {
      console.error('Error sending email via Resend:', error);
      throw error;
    }
  }

  /**
   * Helper to generate the standardized header and footer wrapper
   */
  private wrapHtml(title: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${this.colors.bgBody}; color: ${this.colors.textMain};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${this.colors.bgBody}; padding: 40px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: ${this.colors.bgCard}; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; margin: 0 auto;">
                  
                  <tr>
                    <td style="padding: 30px 40px 20px 40px; text-align: center; border-bottom: 1px solid ${this.colors.border};">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: ${this.colors.primary}; text-transform: uppercase; letter-spacing: 2px;">PRECA</h1>
                      <p style="margin: 5px 0 0 0; font-size: 12px; color: ${this.colors.textSecondary}; text-transform: uppercase; letter-spacing: 1px;">Buró de Crédito</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 40px;">
                      ${content}
                    </td>
                  </tr>

                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid ${this.colors.border};">
                      <p style="margin: 0 0 10px 0; font-size: 13px; color: ${this.colors.textSecondary};">
                        ¿Tienes dudas? Responde a este correo.
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                        © ${new Date().getFullYear()} Preca. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
                
                <div style="height: 40px; line-height: 40px;">&nbsp;</div>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  async sendPaymentConfirmation(
    toEmail: string,
    applicantName: string,
    serviceName: string,
    amount: number
  ): Promise<void> {
    const subject = '✅ Confirmación de Pago - Preca';
    
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; padding: 12px; background-color: #ecfdf5; border-radius: 50%; margin-bottom: 15px;">
          <span style="font-size: 32px; line-height: 1;">✅</span>
        </div>
        <h2 style="margin: 0; color: ${this.colors.textMain}; font-size: 20px; font-weight: 700;">Pago Confirmado</h2>
        <p style="margin: 10px 0 0 0; color: ${this.colors.textSecondary}; font-size: 16px;">
          Hola ${applicantName}, hemos recibido tu pago correctamente.
        </p>
      </div>

      <div style="background-color: #fafafa; border: 1px solid ${this.colors.border}; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 10px; color: ${this.colors.textSecondary}; font-size: 14px;">Servicio Contratado</td>
            <td style="padding-bottom: 10px; text-align: right; color: ${this.colors.textMain}; font-weight: 600; font-size: 14px;">${serviceName}</td>
          </tr>
          <tr>
            <td style="padding-top: 10px; border-top: 1px dashed ${this.colors.border}; color: ${this.colors.textSecondary}; font-size: 14px;">Total Pagado</td>
            <td style="padding-top: 10px; border-top: 1px dashed ${this.colors.border}; text-align: right; color: ${this.colors.primary}; font-weight: 700; font-size: 18px;">$${amount.toFixed(2)} MXN</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${this.colors.textMain}; font-weight: 600;">Siguientes Pasos</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="24" style="vertical-align: top; padding-bottom: 15px;">
              <span style="display: inline-block; width: 20px; height: 20px; background-color: ${this.colors.primary}; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; font-weight: bold;">1</span>
            </td>
            <td style="padding-bottom: 15px; padding-left: 10px; color: ${this.colors.textSecondary}; font-size: 15px;">
              Recibirás instrucciones por WhatsApp para validar tu identidad.
            </td>
          </tr>
          <tr>
            <td width="24" style="vertical-align: top; padding-bottom: 15px;">
              <span style="display: inline-block; width: 20px; height: 20px; background-color: #e5e7eb; color: ${this.colors.textSecondary}; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; font-weight: bold;">2</span>
            </td>
            <td style="padding-bottom: 15px; padding-left: 10px; color: ${this.colors.textSecondary}; font-size: 15px;">
              Procesaremos tu solicitud inmediatamente tras la verificación.
            </td>
          </tr>
          <tr>
            <td width="24" style="vertical-align: top;">
              <span style="display: inline-block; width: 20px; height: 20px; background-color: #e5e7eb; color: ${this.colors.textSecondary}; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; font-weight: bold;">3</span>
            </td>
            <td style="padding-left: 10px; color: ${this.colors.textSecondary}; font-size: 15px;">
              Te notificaremos por correo cuando tu reporte esté listo (24-48h).
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #eff6ff; border-left: 3px solid ${this.colors.info}; padding: 15px; border-radius: 4px;">
        <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.5;">
          <strong>Importante:</strong> Mantén tu teléfono disponible para la verificación vía WhatsApp.
        </p>
      </div>
    `;

    const htmlBody = this.wrapHtml('Pago Confirmado', content);

    const textBody = `
PRECA - Confirmación de Pago

Hola ${applicantName}, hemos recibido tu pago correctamente.

DETALLES:
Servicio: ${serviceName}
Monto: $${amount.toFixed(2)} MXN

SIGUIENTES PASOS:
1. Recibirás instrucciones por WhatsApp para validar tu identidad.
2. Procesaremos tu solicitud inmediatamente tras la verificación.
3. Te notificaremos por correo cuando tu reporte esté listo (24-48h).

Importante: Mantén tu teléfono disponible.

© ${new Date().getFullYear()} Preca.
    `;

    await this.send({ to: toEmail, subject, htmlBody, textBody });
  }

  async sendReportReady(
    toEmail: string,
    applicantName: string,
    reportUrls: string[],
    reportAttachments?: EmailAttachment[]
  ): Promise<void> {
    const fileCount = reportUrls.length;
    const subject = `📄 ${fileCount > 1 ? 'Tus Reportes están Listos' : 'Tu Reporte está Listo'} - Preca`;

    const downloadButtons = reportUrls.map((url, index) => `
      <a href="${url}" style="display: block; width: 100%; box-sizing: border-box; background-color: ${this.colors.primary}; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 6px; font-size: 16px; font-weight: 600; text-align: center; margin-bottom: ${index === reportUrls.length - 1 ? '0' : '10px'};">
        Descargar ${fileCount > 1 ? `Reporte ${index + 1}` : 'Mi Reporte'}
      </a>
    `).join('');

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; padding: 12px; background-color: #ecfdf5; border-radius: 50%; margin-bottom: 15px;">
          <span style="font-size: 32px; line-height: 1;">📄</span>
        </div>
        <h2 style="margin: 0; color: ${this.colors.textMain}; font-size: 20px; font-weight: 700;">¡Resultados Listos!</h2>
        <p style="margin: 10px 0 0 0; color: ${this.colors.textSecondary}; font-size: 16px;">
          Hola ${applicantName}, hemos completado tu consulta de Buró de Crédito.
        </p>
      </div>

      <div style="margin-bottom: 30px;">
        ${downloadButtons}
      </div>

      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
        <div style="color: #991b1b; font-size: 13px; font-weight: 700; margin-bottom: 5px;">⚠️ Información Confidencial</div>
        <p style="margin: 0; color: #7f1d1d; font-size: 13px; line-height: 1.5;">
          ${fileCount > 1 ? 'Estos documentos contienen' : 'Este documento contiene'} información sensible. Guárdalo en un lugar seguro y no lo compartas con personas no autorizadas.
        </p>
      </div>

      ${reportAttachments && reportAttachments.length > 0 ? `
        <div style="text-align: center; font-size: 13px; color: ${this.colors.textSecondary}; border-top: 1px solid ${this.colors.border}; padding-top: 20px;">
          📎 También puedes encontrar ${reportAttachments.length > 1 ? 'los archivos adjuntos' : 'el archivo adjunto'} en este correo.
        </div>
      ` : ''}
    `;

    const htmlBody = this.wrapHtml(fileCount > 1 ? 'Reportes Listos' : 'Reporte Listo', content);

    const reportUrlsList = reportUrls.map((url, index) => `${index + 1}. ${url}`).join('\n');
    const textBody = `
PRECA - Reporte Listo

Hola ${applicantName}, tu consulta de Buró de Crédito ha finalizado.

DESCARGAR:
${reportUrlsList}

ADVERTENCIA: Información confidencial. No compartir con terceros.

© ${new Date().getFullYear()} Preca.
    `;

    await this.send({ to: toEmail, subject, htmlBody, textBody, attachments: reportAttachments });
  }

  async sendVerificationReminder(
    toEmail: string,
    applicantName: string,
    verificationUrl: string
  ): Promise<void> {
    const subject = '⏰ Acción Requerida: Verifica tu Identidad';

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; padding: 12px; background-color: #fffbeb; border-radius: 50%; margin-bottom: 15px;">
          <span style="font-size: 32px; line-height: 1;">⏰</span>
        </div>
        <h2 style="margin: 0; color: ${this.colors.textMain}; font-size: 20px; font-weight: 700;">Verificación Pendiente</h2>
        <p style="margin: 10px 0 0 0; color: ${this.colors.textSecondary}; font-size: 16px;">
          Hola ${applicantName}, necesitamos que completes tu verificación para continuar con la consulta.
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${verificationUrl}" style="display: inline-block; background-color: ${this.colors.warning}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
          Verificar Identidad Ahora
        </a>
      </div>

      <p style="text-align: center; font-size: 14px; color: ${this.colors.textSecondary}; margin: 0;">
        Este proceso es seguro y solo toma 2 minutos.
      </p>
    `;

    const htmlBody = this.wrapHtml('Verificación Pendiente', content);

    const textBody = `
PRECA - Verificación Pendiente

Hola ${applicantName}, necesitamos que completes tu verificación para continuar.

ENLACE DE VERIFICACIÓN:
${verificationUrl}

Este proceso es obligatorio para generar tu reporte.

© ${new Date().getFullYear()} Preca.
    `;

    await this.send({ to: toEmail, subject, htmlBody, textBody });
  }

  async sendRejectionNotification(
    toEmail: string,
    applicantName: string,
    reason: string
  ): Promise<void> {
    const subject = 'Actualización de tu Solicitud - Preca';

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; padding: 12px; background-color: #fef2f2; border-radius: 50%; margin-bottom: 15px;">
          <span style="font-size: 32px; line-height: 1;">❌</span>
        </div>
        <h2 style="margin: 0; color: ${this.colors.textMain}; font-size: 20px; font-weight: 700;">No pudimos procesar tu solicitud</h2>
        <p style="margin: 10px 0 0 0; color: ${this.colors.textSecondary}; font-size: 16px;">
          Hola ${applicantName},
        </p>
      </div>

      <div style="background-color: #fff1f2; border-left: 3px solid ${this.colors.error}; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
        <p style="margin: 0 0 5px 0; color: #9f1239; font-size: 13px; font-weight: 700; text-transform: uppercase;">Motivo</p>
        <p style="margin: 0; color: #881337; font-size: 15px; line-height: 1.5;">
          ${reason}
        </p>
      </div>

      <p style="color: ${this.colors.textSecondary}; font-size: 14px; line-height: 1.6;">
        Si consideras que esto es un error o necesitas más detalles, por favor responde a este correo y un agente revisará tu caso manualmente.
      </p>
    `;

    const htmlBody = this.wrapHtml('Actualización de Solicitud', content);

    const textBody = `
PRECA - Solicitud No Procesada

Hola ${applicantName}, no pudimos procesar tu solicitud.

MOTIVO:
${reason}

Si crees que es un error, responde a este correo.

© ${new Date().getFullYear()} Preca.
    `;

    await this.send({ to: toEmail, subject, htmlBody, textBody });
  }

  async sendAdminScreeningNotification(
    toEmail: string,
    applicantName: string,
    screeningId: string,
    dashboardUrl: string
  ): Promise<void> {
    const subject = '🔔 Nueva Solicitud Lista - Preca Admin';

    const content = `
      <div style="margin-bottom: 25px; border-bottom: 1px solid ${this.colors.border}; padding-bottom: 20px;">
        <h2 style="margin: 0; color: ${this.colors.info}; font-size: 18px; font-weight: 700;">Nueva Solicitud Firmada</h2>
        <p style="margin: 5px 0 0 0; color: ${this.colors.textSecondary}; font-size: 14px;">
          El cliente ha completado la autorización legal.
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
        <tr>
          <td style="padding: 8px 0; color: ${this.colors.textSecondary}; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Cliente</td>
          <td style="padding: 8px 0; color: ${this.colors.textMain}; font-weight: 600; font-size: 14px; text-align: right; border-bottom: 1px solid #f3f4f6;">${applicantName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${this.colors.textSecondary}; font-size: 14px; border-bottom: 1px solid #f3f4f6;">ID Solicitud</td>
          <td style="padding: 8px 0; color: ${this.colors.textMain}; font-family: monospace; font-size: 14px; text-align: right; border-bottom: 1px solid #f3f4f6;">${screeningId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${this.colors.textSecondary}; font-size: 14px;">Estado</td>
          <td style="padding: 8px 0; color: ${this.colors.primary}; font-weight: 600; font-size: 14px; text-align: right;">Autorizado / Pendiente de Reporte</td>
        </tr>
      </table>

      <div style="text-align: center;">
        <a href="${dashboardUrl}" style="display: inline-block; background-color: ${this.colors.info}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 15px; font-weight: 600;">
          Abrir Dashboard
        </a>
      </div>
    `;

    const htmlBody = this.wrapHtml('Admin Notification', content);

    const textBody = `
NUEVA SOLICITUD LISTA

Cliente: ${applicantName}
ID: ${screeningId}
Estado: Autorizado

Dashboard: ${dashboardUrl}
    `;

    await this.send({ to: toEmail, subject, htmlBody, textBody });
  }
}