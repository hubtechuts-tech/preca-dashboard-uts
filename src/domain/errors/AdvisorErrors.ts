export class AdvisorNotFoundError extends Error {
    constructor(advisorId: number | string) {
        super(`Advisor with id ${advisorId} not found`);
        this.name = 'AdvisorNotFoundError';
    }
}
