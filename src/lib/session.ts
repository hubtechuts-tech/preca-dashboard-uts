import { JWTSessionService } from "@/infrastructure/security/JWTSessionService";
import { SessionData } from "@/domain/interfaces/services/ISessionService";

const sessionService = new JWTSessionService();

export async function verifySession(token: string): Promise<SessionData> {
  return await sessionService.verifySessionToken(token);
}
