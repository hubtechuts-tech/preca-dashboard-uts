/**
 * ConsoleEmailService
 *
 * Development implementation of IEmailService that logs emails to console.
 * Use this during development to avoid sending real emails.
 */

import {
  IEmailService,
  EmailOptions,
  EmailAttachment,
} from '../../domain/interfaces/services/IEmailService';

export class ConsoleEmailService implements IEmailService {
  async send(options: EmailOptions): Promise<void> {
    console.log('\n📧 ===== EMAIL SENT (CONSOLE MODE) =====');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('---');
    console.log('HTML Body:');
    console.log(options.htmlBody);
    if (options.textBody) {
      console.log('---');
      console.log('Text Body:');
      console.log(options.textBody);
    }
    if (options.attachments && options.attachments.length > 0) {
      console.log('---');
      console.log('Attachments:');
      options.attachments.forEach((attachment, index) => {
        console.log(`  ${index + 1}. ${attachment.filename} (${attachment.contentType})`);
      });
    }
    console.log('========================================\n');
  }

  async sendPaymentConfirmation(
    toEmail: string,
    applicantName: string,
    serviceName: string,
    amount: number
  ): Promise<void> {
    const subject = '✅ Pago Confirmado - Preca';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">¡Pago Confirmado!</h2>
          <p>Hola <strong>${applicantName}</strong>,</p>
          <p>Hemos recibido tu pago por el servicio de <strong>${serviceName}</strong>.</p>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Monto pagado:</strong> $${amount.toFixed(2)} MXN</p>
          </div>

          <p>A continuación, necesitamos verificar tu identidad. Recibirás un mensaje de WhatsApp con las instrucciones.</p>

          <p>Una vez completada la verificación, procesaremos tu solicitud en un plazo de 24-48 horas hábiles.</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            Si tienes alguna pregunta, contáctanos respondiendo a este correo.
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            <strong>Preca</strong><br>
            Consulta de Buró de Crédito
          </p>
        </body>
      </html>
    `;

    const textBody = `
¡Pago Confirmado!

Hola ${applicantName},

Hemos recibido tu pago por el servicio de ${serviceName}.

Monto pagado: $${amount.toFixed(2)} MXN

A continuación, necesitamos verificar tu identidad. Recibirás un mensaje de WhatsApp con las instrucciones.

Una vez completada la verificación, procesaremos tu solicitud en un plazo de 24-48 horas hábiles.

Si tienes alguna pregunta, contáctanos respondiendo a este correo.

Preca
Consulta de Buró de Crédito
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
      <div style="text-align: center; margin: 15px 0;">
        <a href="${url}"
           style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Descargar ${fileCount > 1 ? `Reporte ${index + 1}` : 'Reporte'}
        </a>
      </div>
    `).join('');

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">¡${fileCount > 1 ? 'Tus Reportes están Listos' : 'Tu Reporte está Listo'}!</h2>
          <p>Hola <strong>${applicantName}</strong>,</p>
          <p>Hemos completado el procesamiento de tu consulta de Buró de Crédito. ${fileCount > 1 ? `Tus ${fileCount} reportes están listos para descargar` : 'Tu reporte está listo para descargar'}.</p>

          ${downloadButtons}

          <p style="color: #dc2626; font-size: 14px;">
            <strong>Importante:</strong> ${fileCount > 1 ? 'Estos reportes contienen' : 'Este reporte contiene'} información confidencial. Manté${fileCount > 1 ? 'nlos' : 'nlo'} seguro${fileCount > 1 ? 's' : ''} y no ${fileCount > 1 ? 'los' : 'lo'} compartas.
          </p>

          ${reportAttachments && reportAttachments.length > 0 ? `
          <p style="font-size: 14px;">
            <strong>📎 Adjunto${reportAttachments.length > 1 ? 's' : ''}:</strong> ${reportAttachments.length} archivo${reportAttachments.length > 1 ? 's' : ''} adjunto${reportAttachments.length > 1 ? 's' : ''}.
          </p>
          ` : ''}

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            Si tienes alguna pregunta sobre ${fileCount > 1 ? 'tus reportes' : 'tu reporte'}, contáctanos respondiendo a este correo.
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            <strong>Preca</strong><br>
            Consulta de Buró de Crédito
          </p>
        </body>
      </html>
    `;

    const reportUrlsList = reportUrls.map((url, index) => `${index + 1}. ${url}`).join('\n');
    const textBody = `
¡${fileCount > 1 ? 'Tus Reportes están Listos' : 'Tu Reporte está Listo'}!

Hola ${applicantName},

Hemos completado el procesamiento de tu consulta de Buró de Crédito. ${fileCount > 1 ? `Tus ${fileCount} reportes están listos para descargar` : 'Tu reporte está listo para descargar'}.

${fileCount > 1 ? 'Descarga tus reportes:' : 'Descarga tu reporte:'}
${reportUrlsList}

IMPORTANTE: ${fileCount > 1 ? 'Estos reportes contienen' : 'Este reporte contiene'} información confidencial. Manté${fileCount > 1 ? 'nlos' : 'nlo'} seguro${fileCount > 1 ? 's' : ''} y no ${fileCount > 1 ? 'los' : 'lo'} compartas.

Si tienes alguna pregunta sobre ${fileCount > 1 ? 'tus reportes' : 'tu reporte'}, contáctanos respondiendo a este correo.

Preca
Consulta de Buró de Crédito
    `;

    await this.send({ to: toEmail, subject, htmlBody, textBody, attachments: reportAttachments });
  }

  async sendVerificationReminder(
    toEmail: string,
    applicantName: string,
    verificationUrl: string
  ): Promise<void> {
    const subject = '⏰ Recordatorio: Verifica tu Identidad - Preca';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f59e0b;">Recordatorio: Verificación Pendiente</h2>
          <p>Hola <strong>${applicantName}</strong>,</p>
          <p>Notamos que aún no has completado la verificación de identidad para tu solicitud de consulta de Buró de Crédito.</p>

          <p>Para continuar con el proceso, necesitamos que verifiques tu identidad.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Verificar Ahora
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            El proceso de verificación solo toma unos minutos.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            Si tienes problemas con la verificación, contáctanos respondiendo a este correo.
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            <strong>Preca</strong><br>
            Consulta de Buró de Crédito
          </p>
        </body>
      </html>
    `;

    const textBody = `
Recordatorio: Verificación Pendiente

Hola ${applicantName},

Notamos que aún no has completado la verificación de identidad para tu solicitud de consulta de Buró de Crédito.

Para continuar con el proceso, necesitamos que verifiques tu identidad.

Verifica aquí: ${verificationUrl}

El proceso de verificación solo toma unos minutos.

Si tienes problemas con la verificación, contáctanos respondiendo a este correo.

Preca
Consulta de Buró de Crédito
    `;

    await this.send({ to: toEmail, subject, htmlBody, textBody });
  }

  async sendRejectionNotification(
    toEmail: string,
    applicantName: string,
    reason: string
  ): Promise<void> {
    const subject = '❌ Actualización de tu Solicitud - Preca';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Actualización de tu Solicitud</h2>
          <p>Hola <strong>${applicantName}</strong>,</p>
          <p>Lamentamos informarte que no pudimos procesar tu solicitud de consulta de Buró de Crédito.</p>

          <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Motivo:</strong> ${reason}</p>
          </div>

          <p>Si crees que esto es un error o deseas obtener más información, por favor contáctanos.</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            Estamos aquí para ayudarte. Responde a este correo para más información.
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            <strong>Preca</strong><br>
            Consulta de Buró de Crédito
          </p>
        </body>
      </html>
    `;

    const textBody = `
Actualización de tu Solicitud

Hola ${applicantName},

Lamentamos informarte que no pudimos procesar tu solicitud de consulta de Buró de Crédito.

Motivo: ${reason}

Si crees que esto es un error o deseas obtener más información, por favor contáctanos.

Estamos aquí para ayudarte. Responde a este correo para más información.

Preca
Consulta de Buró de Crédito
    `;

    await this.send({ to: toEmail, subject, htmlBody, textBody });
  }

  async sendAdminScreeningNotification(
    toEmail: string,
    applicantName: string,
    screeningId: string,
    dashboardUrl: string
  ): Promise<void> {
    const subject = '🔔 Nueva Solicitud Lista para Procesar - Preca Admin';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6;">Nueva Solicitud Lista</h2>
          <p>El cliente <strong>${applicantName}</strong> ha completado la firma del documento de autorización y su solicitud está lista para ser procesada.</p>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Cliente:</strong> ${applicantName}</p>
            <p style="margin: 5px 0;"><strong>ID de Solicitud:</strong> ${screeningId}</p>
            <p style="margin: 5px 0; color: #059669;"><strong>Estado:</strong> ✓ Autorización Firmada</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}"
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Ver Solicitud en Dashboard
            </a>
          </div>

          <p style="color: #1e40af; font-size: 14px;">
            <strong>📋 Siguientes pasos:</strong> Revisa la solicitud en el dashboard, sube el reporte de Buró de Crédito y completa el proceso.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            <strong>Preca Admin</strong><br>
            Panel de Administración
          </p>
        </body>
      </html>
    `;

    const textBody = `
Nueva Solicitud Lista para Procesar

El cliente ${applicantName} ha completado la firma del documento de autorización y su solicitud está lista para ser procesada.

Cliente: ${applicantName}
ID de Solicitud: ${screeningId}
Estado: ✓ Autorización Firmada

Ver solicitud en dashboard: ${dashboardUrl}

Siguientes pasos: Revisa la solicitud en el dashboard, sube el reporte de Buró de Crédito y completa el proceso.

Preca Admin
Panel de Administración
    `;

    await this.send({ to: toEmail, subject, htmlBody, textBody });
  }
}
