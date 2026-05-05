/**
 * Infrastructure Layer - Puppeteer PDF Generator Service
 *
 * Generates PDFs from HTML templates using Puppeteer and Handlebars.
 * Templates are stored in src/templates/reports/
 */

import puppeteer, { Browser, Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import path from 'path';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import Handlebars from 'handlebars';
import {
  IPdfGeneratorService,
  PdfGeneratorOptions,
  PdfGeneratorResult
} from '../../domain/interfaces/services/IPdfGeneratorService';
import {
  TemplateNotFoundError,
  PdfGenerationError
} from '../../domain/errors/ReportErrors';
import { SupabaseStorageService } from './SupabaseStorageService';

export class PuppeteerPdfGeneratorService implements IPdfGeneratorService {
  private storageService: SupabaseStorageService | null = null;
  private browser: Browser | null = null;
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  private partialsRegistered: boolean = false;
  private templatesPath: string;
  private logoBase64Cache: string | null = null;

  constructor(templatesPath?: string) {
    this.templatesPath = templatesPath || path.join(process.cwd(), 'src/templates/reports');
    this.registerHelpers();
  }

  /**
   * Load logo as base64 for embedding in PDF headers
   */
  private getLogoBase64(): string {
    if (this.logoBase64Cache) {
      return this.logoBase64Cache;
    }

    const possiblePaths = [
      path.join(process.cwd(), 'public', 'logopreca.png'),
      path.join(process.cwd(), 'public', 'logo.png'),
    ];

    for (const logoPath of possiblePaths) {
      if (fsSync.existsSync(logoPath)) {
        const logoBuffer = fsSync.readFileSync(logoPath);
        this.logoBase64Cache = logoBuffer.toString('base64');
        return this.logoBase64Cache;
      }
    }

    console.warn('[PuppeteerPdfGeneratorService] Logo file not found');
    return '';
  }

  /**
   * Generate the PDF header template HTML
   * Uses ONLY inline styles - no <style> tags (Puppeteer limitation)
   */
  private generateHeaderTemplate(data: Record<string, any>): string {
    const logoBase64 = data.logoBase64 || this.getLogoBase64();
    const folio = data.folio || '';
    const fecha = data.generatedAt
      ? new Date(data.generatedAt).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Logo height is 45px, bars should be half (~22px)
    const barHeight = '22px';
    const logoHeight = '45px';

    return `<div style="width: 100%; margin: 0; padding: 0; font-family: Calibri, Arial, sans-serif; font-size: 12px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
  <table style="width: 100%; border-collapse: collapse; border-spacing: 0; height: ${logoHeight};">
    <tr>
      <td style="width: 3.67cm; vertical-align: bottom; padding: 0;">
        <div style="height: ${barHeight}; background-color: #4CAF50; -webkit-print-color-adjust: exact !important;"></div>
      </td>
      <td style="width: 6.73cm; vertical-align: bottom; padding: 0;">
        <div style="height: ${barHeight}; background-color: #1e3a4c; -webkit-print-color-adjust: exact !important;"></div>
      </td>
      <td style="width: auto; vertical-align: bottom; padding: 0 10px 0 45px;">
        ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" style="height: ${logoHeight}; width: auto; vertical-align: bottom;">` : ''}
      </td>
      <td style="width: auto; padding: 0;"></td>
      <td style="width: 1.80cm; vertical-align: bottom; padding: 0;">
        <div style="height: ${barHeight}; background-color: #4CAF50; -webkit-print-color-adjust: exact !important;"></div>
      </td>
    </tr>
  </table>
  <div style="margin-top: 12px; padding-left: 25px;">
    <div style="font-size: 13px; font-weight: bold; color: #1e3a4c; margin-bottom: 1px;">FECHA: ${fecha}</div>
    <div style="font-size: 13px; font-weight: bold; color: #1e3a4c;">FOLIO: ${folio}</div>
  </div>
</div>`;
  }

  /**
   * Generate the PDF footer template HTML
   * Uses ONLY inline styles - no <style> tags (Puppeteer limitation)
   */
  private generateFooterTemplate(): string {
    return `<div style="width: 100%; margin: 0; padding: 0; font-family: Calibri, Arial, sans-serif; font-size: 10px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
  <div style="padding: 5px 25px;">
    <div style="margin-bottom: 3px; color: #374151;">
      <span style="display: inline-block; width: 10px; height: 10px; border: 1.5px solid #6b7280; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
      <span style="vertical-align: middle;">Av Central Poniente 1377 PA, Tuxtla Gutierrez, Chis.</span>
    </div>
    <div style="margin-bottom: 3px; color: #374151;">
      <span style="display: inline-block; width: 10px; height: 10px; border: 1.5px solid #6b7280; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
      <span style="vertical-align: middle;">www.preca.com.mx</span>
    </div>
    <div style="margin-bottom: 3px; color: #374151;">
      <span style="display: inline-block; width: 10px; height: 10px; border: 1.5px solid #6b7280; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
      <span style="vertical-align: middle;">contacto@preca.com.mx</span>
    </div>
    <div style="margin-bottom: 3px; color: #374151;">
      <span style="display: inline-block; width: 10px; height: 10px; border: 1.5px solid #6b7280; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
      <span style="vertical-align: middle;">961 5508233 y 34</span>
    </div>
  </div>
  <div style="text-align: center; font-size: 10px; color: #6b7280; margin: 5px 0;">
    Pagina <span class="pageNumber"></span> de <span class="totalPages"></span>
  </div>
  <table style="width: 100%; border-collapse: collapse; border-spacing: 0;">
    <tr>
      <td style="width: 7.4cm; height: 0.82cm; background-color: #1e3a4c; -webkit-print-color-adjust: exact !important;"></td>
      <td style="height: 0.82cm; background-color: #4CAF50; -webkit-print-color-adjust: exact !important;"></td>
      <td style="width: 7.4cm; height: 0.82cm; background-color: #1e3a4c; -webkit-print-color-adjust: exact !important;"></td>
    </tr>
  </table>
</div>`;
  }

  /**
   * Register Handlebars helpers for formatting
   */
  private registerHelpers(): void {
    // Currency formatting (MXN)
    Handlebars.registerHelper('currency', (value: number) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(value || 0);
    });

    // Date formatting (Spanish)
    Handlebars.registerHelper('dateFormat', (date: string | Date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    });

    // Short date formatting (DD/MM/YYYY)
    Handlebars.registerHelper('dateShort', (date: string | Date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    });

    // Percentage formatting
    Handlebars.registerHelper('percentage', (value: number) => {
      return `${(value || 0).toFixed(2)}%`;
    });

    // Score color helper (for credit scores)
    Handlebars.registerHelper('scoreColor', (score: number) => {
      if (score >= 700) return '#22c55e'; // green
      if (score >= 550) return '#eab308'; // yellow
      return '#ef4444'; // red
    });

    // Score rating helper
    Handlebars.registerHelper('scoreRating', (score: number) => {
      if (score >= 750) return 'Excelente';
      if (score >= 700) return 'Muy Bueno';
      if (score >= 650) return 'Bueno';
      if (score >= 550) return 'Regular';
      if (score >= 400) return 'Bajo';
      return 'Muy Bajo';
    });

    // Status color helper
    Handlebars.registerHelper('statusColor', (status: string) => {
      const colors: Record<string, string> = {
        'good': '#22c55e',
        'warning': '#eab308',
        'bad': '#ef4444',
        'neutral': '#6b7280'
      };
      return colors[status] || colors.neutral;
    });

    // Equality check
    Handlebars.registerHelper('ifEquals', function (this: any, arg1: any, arg2: any, options: any) {
      return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    });

    // Not equal check
    Handlebars.registerHelper('ifNotEquals', function (this: any, arg1: any, arg2: any, options: any) {
      return (arg1 !== arg2) ? options.fn(this) : options.inverse(this);
    });

    // Greater than check
    Handlebars.registerHelper('ifGreater', function (this: any, arg1: number, arg2: number, options: any) {
      return (arg1 > arg2) ? options.fn(this) : options.inverse(this);
    });

    // Less than check
    Handlebars.registerHelper('ifLess', function (this: any, arg1: number, arg2: number, options: any) {
      return (arg1 < arg2) ? options.fn(this) : options.inverse(this);
    });

    // Number formatting
    Handlebars.registerHelper('number', (value: number, decimals: number = 0) => {
      return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value || 0);
    });

    // Uppercase helper
    Handlebars.registerHelper('uppercase', (str: string) => {
      return (str || '').toUpperCase();
    });

    // Default value helper
    Handlebars.registerHelper('default', (value: any, defaultValue: any) => {
      return value ?? defaultValue;
    });

    // Array length check
    Handlebars.registerHelper('ifArrayLength', function (this: any, array: any[], length: number, options: any) {
      return (array && array.length >= length) ? options.fn(this) : options.inverse(this);
    });
  }

  /**
   * Get or create Puppeteer browser instance
   * Creates a fresh browser for each call to avoid stale connections in Docker
   */
  private async getBrowser(): Promise<Browser> {
    // Close any existing browser to avoid stale connections
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // Ignore close errors
      }
      this.browser = null;
    }

    // Prefer system Chromium (Docker production) via env var, fallback to @sparticuz/chromium
    const systemChromePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    const executablePath = systemChromePath || await chromium.executablePath();

    console.log(`[PuppeteerPdfGeneratorService] Launching Chromium at: ${executablePath}`);

    // Comprehensive args for running in Docker/container environments
    const browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--single-process',
      '--no-zygote',
      '--no-first-run',
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-translate',
      '--disable-sync',
      '--hide-scrollbars',
      '--mute-audio',
      '--font-render-hinting=none',
    ];

    this.browser = await puppeteer.launch({
      args: browserArgs,
      executablePath,
      headless: true,
      timeout: 60000,
    });

    return this.browser;
  }

  /**
   * Load and compile a Handlebars template
   */
  private async loadTemplate(templateId: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(templateId)) {
      return this.templateCache.get(templateId)!;
    }

    const templatePath = path.join(this.templatesPath, `${templateId}.hbs`);

    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = Handlebars.compile(templateContent);
      this.templateCache.set(templateId, compiled);
      return compiled;
    } catch (error) {
      throw new TemplateNotFoundError(templateId);
    }
  }

  /**
   * Convert a fileKey or URL to base64 data URI
   * Handles both fileKeys (downloaded from storage) and full URLs
   */
  private async imageToBase64(fileKeyOrUrl: string, storageService?: any): Promise<string> {
    try {
      // If it's a full URL, try to fetch it (backward compatibility)
      if (fileKeyOrUrl.startsWith('http')) {
        const response = await fetch(fileKeyOrUrl);
        if (!response.ok) {
          console.warn(`[PuppeteerPdfGeneratorService] Failed to fetch image URL: ${fileKeyOrUrl}`);
          return '';
        }
        const contentType = response.headers.get('content-type') || 'image/png';
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:${contentType};base64,${base64}`;
      }

      // Otherwise, it's a fileKey - download from storage
      if (storageService) {
        console.log(`[PuppeteerPdfGeneratorService] Downloading image from storage: ${fileKeyOrUrl}`);
        try {
          const buffer = await storageService.downloadFile(fileKeyOrUrl);

          if (!buffer || buffer.length === 0) {
            console.warn(`[PuppeteerPdfGeneratorService] Downloaded buffer is empty for: ${fileKeyOrUrl}`);
            return '';
          }

          // Determine content type from file extension
          const ext = fileKeyOrUrl.split('.').pop()?.toLowerCase() || 'png';
          const contentTypeMap: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp'
          };
          const contentType = contentTypeMap[ext] || 'image/png';

          const base64 = buffer.toString('base64');
          if (!base64 || base64.length === 0) {
            console.warn(`[PuppeteerPdfGeneratorService] Base64 conversion resulted in empty string for: ${fileKeyOrUrl}`);
            return '';
          }

          return `data:${contentType};base64,${base64}`;
        } catch (downloadError) {
          console.error(`[PuppeteerPdfGeneratorService] Failed to download file from storage: ${fileKeyOrUrl}`, downloadError);
          return '';
        }
      }

      console.warn(`[PuppeteerPdfGeneratorService] No storage service available for fileKey: ${fileKeyOrUrl}`);
      return '';
    } catch (error) {
      console.warn(`[PuppeteerPdfGeneratorService] Error converting image to base64: ${fileKeyOrUrl}`, error);
      return '';
    }
  }

  /**
   * Process data to convert image fileKeys/URLs to base64
   * Handles both single image fields and arrays of images
   */
  private async processImagesInData(data: Record<string, any>, storageService?: any): Promise<Record<string, any>> {
    const processed = { ...data };

    // List of known image array fields
    const imageArrayFields = ['satSearchImages'];

    for (const field of imageArrayFields) {
      if (Array.isArray(processed[field]) && processed[field].length > 0) {
        console.log(`[PuppeteerPdfGeneratorService] Processing ${processed[field].length} images for field: ${field}`);
        const base64Images = await Promise.all(
          processed[field].map((fileKeyOrUrl: string) => this.imageToBase64(fileKeyOrUrl, storageService))
        );
        // Filter out any failed conversions (empty strings)
        processed[field] = base64Images.filter(img => img !== '');
        console.log(`[PuppeteerPdfGeneratorService] Successfully converted ${processed[field].length} images`);
      }
    }

    return processed;
  }

  /**
   * Load and register all partials from the partials directory
   */
  private async loadPartials(): Promise<void> {
    if (this.partialsRegistered) return;

    const partialsPath = path.join(this.templatesPath, 'partials');

    try {
      const files = await fs.readdir(partialsPath);

      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const partialName = file.replace('.hbs', '');
          const partialContent = await fs.readFile(
            path.join(partialsPath, file),
            'utf-8'
          );
          Handlebars.registerPartial(partialName, partialContent);
        }
      }

      this.partialsRegistered = true;
    } catch (error) {
      console.warn('[PuppeteerPdfGeneratorService] Could not load partials:', error);
    }
  }

  /**
   * Generate PDF from a template ID and data
   */
  async generateReport(
    templateId: string,
    data: Record<string, any>,
    options?: PdfGeneratorOptions
  ): Promise<PdfGeneratorResult> {
    try {
      // Load partials first
      await this.loadPartials();

      // Load and compile template
      const template = await this.loadTemplate(templateId);

      // Initialize storage service for downloading images (lazy initialization)
      if (!this.storageService) {
        try {
          this.storageService = SupabaseStorageService.getInstance();
        } catch (error) {
          console.warn('[PuppeteerPdfGeneratorService] Could not initialize storage service for images:', error);
        }
      }

      // Process images (convert fileKeys/URLs to base64 for Puppeteer)
      const dataWithImages = await this.processImagesInData(data, this.storageService);

      // Add logo base64 to data if not present
      const dataWithLogo = {
        ...dataWithImages,
        logoBase64: dataWithImages.logoBase64 || this.getLogoBase64(),
        generatedAt: dataWithImages.generatedAt || new Date().toISOString(),
        currentYear: new Date().getFullYear()
      };

      // Render HTML with data
      const html = template(dataWithLogo);

      // Generate Puppeteer header/footer templates (appear on every page)
      const headerTemplate = this.generateHeaderTemplate(dataWithLogo);
      const footerTemplate = this.generateFooterTemplate();

      // Use margins to make room for header/footer
      const pdfOptions: PdfGeneratorOptions = {
        ...options,
        displayHeaderFooter: true,
        headerTemplate,
        footerTemplate,
        margin: {
          top: '110px',     // Space for header
          right: '15mm',
          bottom: '140px',  // Space for footer
          left: '15mm'
        }
      };

      return this.generateFromHtml(html, pdfOptions);
    } catch (error) {
      if (error instanceof TemplateNotFoundError) {
        throw error;
      }
      throw new PdfGenerationError(
        `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error as Error
      );
    }
  }

  /**
   * Generate PDF from raw HTML string
   */
  async generateFromHtml(
    html: string,
    options?: PdfGeneratorOptions
  ): Promise<PdfGeneratorResult> {
    let page: Page | null = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Set content with network idle wait
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options?.format || 'A4',
        landscape: options?.landscape || false,
        margin: options?.margin || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: options?.displayHeaderFooter ?? false,
        headerTemplate: options?.headerTemplate || '<div></div>',
        footerTemplate: options?.footerTemplate || '<div></div>',
        printBackground: true
      });

      // Estimate page count
      const pageCount = Math.max(1, Math.ceil(Buffer.from(pdfBuffer).length / 50000));

      return {
        buffer: Buffer.from(pdfBuffer),
        pageCount,
        generatedAt: new Date()
      };
    } catch (error) {
      throw new PdfGenerationError(
        `HTML to PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error as Error
      );
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Get list of available template IDs
   */
  getAvailableTemplates(): string[] {
    return [
      'preca-basica-pfae',
      'preca-basica-pm',
      'preca-pro-pfae',
      'preca-pro-pm'
    ];
  }

  /**
   * Check if a template exists
   */
  templateExists(templateId: string): boolean {
    return this.getAvailableTemplates().includes(templateId);
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
    this.partialsRegistered = false;
    this.logoBase64Cache = null;
  }
}
