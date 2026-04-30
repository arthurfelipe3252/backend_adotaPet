import {
  AdoptionPreTriageStatus,
  AdoptionRequestStatus,
} from "@adoption/adoption-requests/domain/models/adoption-request.entity";

export interface CreateAdoptionRequestDto {
  petId: string;
  adopterId: string;
  notes?: string | null;
  matchScore?: number | null;
  matchAnswers?: Record<string, string | number | boolean | null> | null;
  preTriageStatus?: AdoptionPreTriageStatus;
}

export interface UpdateAdoptionRequestStatusDto {
  status: AdoptionRequestStatus;
}
