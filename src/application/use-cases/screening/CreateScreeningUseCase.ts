/**
 * CreateScreeningUseCase
 *
 * Creates a new screening request.
 * Business logic: Validates that the service exists before creating the screening.
 * Generates a unique Stripe payment link for the screening.
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';
import { IStripeService } from '../../../domain/interfaces/services/IStripeService';
import { Screening } from '../../../domain/entities/Screening';
import { CreateScreeningDTO } from '../../dto/screening/ScreeningDTO';
import { IUserRepository } from '../../../domain/interfaces/repositories/IUserRepository';
import { IAdvisorRepository } from '../../../domain/interfaces/repositories/IAdvisorRepository';
import { User, UserRole } from '../../../domain/entities/User';
import { ValidationError as SchemaValidationError } from '../../../domain/value-objects/FormSchema';
import { RFC } from '../../../domain/value-objects/RFC';
import { Address } from '../../../domain/value-objects/Address';
import { PersonType } from '../../../domain/entities/ServiceCatalog';

export class FormDataValidationError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: SchemaValidationError[]
  ) {
    super(message);
    this.name = 'FormDataValidationError';
  }
}

export class CreateScreeningUseCase {
  constructor(
    private screeningRepository: IScreeningRepository,
    private serviceRepository: IServiceCatalogRepository,
    private stripeService: IStripeService,
    private userRepository: IUserRepository,
    private advisorRepository: IAdvisorRepository
  ) {}

  async execute(dto: CreateScreeningDTO): Promise<Screening> {
    // 1. Validate service exists
    const service = await this.serviceRepository.findById(Number(dto.serviceId));
    if (!service) {
      throw new Error(`Service with ID ${dto.serviceId} not found`);
    }

    // 2. Validate that the service is active
    if (!service.isActive) {
      throw new Error(`Service ${service.name} is not currently available`);
    }

    // 3. Validate that the service has Stripe configuration
    if (!service.stripePriceId) {
      throw new Error(`Service ${service.name} does not have a Stripe price configured`);
    }

    // 3.5. Validate form data against service's form schema
    if (service.hasFormSchema()) {
      const formSchema = service.formSchema!;
      const validationResult = formSchema.validateFormData(dto.formData);

      if (!validationResult.valid) {
        const errorMessages = validationResult.errors
          .map(err => `${err.field}: ${err.message}`)
          .join(', ');
        throw new FormDataValidationError(errorMessages, validationResult.errors);
      }
    }

    // 4. Determine User (Client) and Admin context
    let clientUserId = dto.userId;
    let adminUserId: string | null = null;
    
    // If a user ID is provided (authenticated request), check their role
    if (dto.userId) {
      const requestingUser = await this.userRepository.findById(dto.userId);
      
      // If the creator is an ADMIN, they are managing this screening, NOT the client
      if (requestingUser && requestingUser.role === UserRole.ADMIN) {
        adminUserId = requestingUser.id;
        clientUserId = undefined; // Reset so we find/create the actual client below
      }
    }

    // 5. Find or Create Client User
    // If we don't have a determined client yet (guest or admin-created), resolve via email
    if (!clientUserId) {
      const existingUser = await this.userRepository.findByEmail(dto.applicantEmail);

      if (existingUser) {
        clientUserId = existingUser.id;
      } else {
        // Create new provisional client
        const newUser = User.create(
          dto.applicantEmail,
          UserRole.CLIENT,
          null, // No password for guest/provisional
          dto.applicantName
        );
        await this.userRepository.save(newUser);
        clientUserId = newUser.id;
      }
    }

    // 5.5. Handle advisor lookup/creation
    let advisorId: number | null = null;

    if (dto.advisorId) {
      // If advisor ID is provided, validate it exists and is active
      const advisor = await this.advisorRepository.findById(Number(dto.advisorId));
      if (!advisor) {
        throw new Error(`Advisor with ID ${dto.advisorId} not found`);
      }
      if (!advisor.isActive) {
        throw new Error(`Advisor with ID ${dto.advisorId} is not active`);
      }
      advisorId = advisor.id;
    } else if (dto.advisorName && dto.advisorPhone) {
      // If no advisor ID but name and phone provided, find advisor
      const normalizedAdvisorPhone = this._normalizePhoneNumber(dto.advisorPhone);
      const normalizedAdvisorName = dto.advisorName.toLowerCase().trim();

      const advisor = await this.advisorRepository.findByPhoneAndName(
        normalizedAdvisorPhone,
        normalizedAdvisorName
      );
      if (advisor && advisor.isActive) {
        advisorId = advisor.id;
      }
    }
    // If neither advisorId nor (advisorName + advisorPhone), advisorId stays null

    // 5.7. Parse applicant detail value objects if provided
    let applicantRFC: RFC | null = null;
    let applicantAddress: Address | null = null;

    if (dto.applicantPersonType && dto.applicantRFC) {
      try {
        applicantRFC = RFC.create(dto.applicantRFC, dto.applicantPersonType);
      } catch (error) {
        throw new Error(`Invalid RFC: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (dto.applicantPersonType && dto.applicantStreet && dto.applicantColony &&
        dto.applicantMunicipality && dto.applicantState && dto.applicantZipCode) {
      try {
        applicantAddress = Address.create({
          street: dto.applicantStreet,
          colony: dto.applicantColony,
          municipality: dto.applicantMunicipality,
          state: dto.applicantState,
          zipCode: dto.applicantZipCode
        });
      } catch (error) {
        throw new Error(`Invalid address: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 6. Create the screening entity
    const screening = Screening.create(
      Number(dto.serviceId), // Ensure it's a number
      dto.applicantName,
      dto.applicantEmail,
      dto.formData,
      clientUserId || null,
      dto.applicantPhone || null,
      adminUserId,
      advisorId, // Advisor reference
      dto.applicantPersonType || null,
      dto.applicantLegalRepresentative || null,
      applicantRFC,
      applicantAddress
    );

    // 6. Generate unique payment link with screening tracking metadata
    const paymentLink = await this.stripeService.createPaymentLink({
      priceId: service.stripePriceId,
      quantity: 1,
      metadata: {
        client_reference_id: screening.clientReferenceId!,
        screening_id: screening.id,
        applicant_email: screening.applicantEmail,
        service_code: service.code,
        user_id: clientUserId || ''
      },
      afterCompletionType: 'hosted_confirmation',
      allowPromotionCodes: true
    });

    // 7. Set payment link on screening
    screening.setPaymentLink(paymentLink.url);

    // 8. Save to repository
    await this.screeningRepository.save(screening);

    // 9. Return the created screening with payment link
    return screening;
  }

  private _normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, '');
  }
}
