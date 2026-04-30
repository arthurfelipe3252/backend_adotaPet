export type AdoptionRequestStatus = "received" | "in_analysis" | "approved" | "rejected";

export type AdoptionPreTriageStatus = "qualified" | "review" | "disqualified";

export interface AdoptionRequestProps {
  id?: string;
  petId: string;
  adopterId: string;
  status: AdoptionRequestStatus;
  preTriageStatus: AdoptionPreTriageStatus;
  matchScore?: number | null;
  matchAnswers?: Record<string, string | number | boolean | null> | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AdoptionRequest {
  private readonly _id?: string;
  private _petId: string;
  private _adopterId: string;
  private _status: AdoptionRequestStatus;
  private _preTriageStatus: AdoptionPreTriageStatus;
  private _matchScore?: number | null;
  private _matchAnswers?: Record<string, string | number | boolean | null> | null;
  private _notes?: string | null;
  private readonly _createdAt?: Date;
  private _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined {
    return this._id;
  }

  get petId(): string {
    return this._petId;
  }

  get adopterId(): string {
    return this._adopterId;
  }

  get status(): AdoptionRequestStatus {
    return this._status;
  }

  get preTriageStatus(): AdoptionPreTriageStatus {
    return this._preTriageStatus;
  }

  get matchScore(): number | null | undefined {
    return this._matchScore;
  }

  get matchAnswers(): Record<string, string | number | boolean | null> | null | undefined {
    return this._matchAnswers;
  }

  get notes(): string | null | undefined {
    return this._notes;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  withStatus(status: AdoptionRequestStatus) {
    this._status = status;
    return this;
  }

  withPreTriageStatus(status: AdoptionPreTriageStatus) {
    this._preTriageStatus = status;
    return this;
  }

  withMatchScore(score?: number | null) {
    this._matchScore = score ?? null;
    return this;
  }

  withMatchAnswers(answers?: Record<string, string | number | boolean | null> | null) {
    this._matchAnswers = answers ?? null;
    return this;
  }

  withNotes(notes?: string | null) {
    this._notes = notes;
    return this;
  }

  touch(updatedAt: Date) {
    this._updatedAt = updatedAt;
    return this;
  }

  static create(
    props: Omit<
      AdoptionRequestProps,
      "id" | "createdAt" | "updatedAt" | "status" | "preTriageStatus"
    > & {
      status?: AdoptionRequestStatus;
      preTriageStatus?: AdoptionPreTriageStatus;
    },
  ): AdoptionRequest {
    const now = new Date();
    const entity = new AdoptionRequest(undefined, now, now);
    entity._petId = props.petId;
    entity._adopterId = props.adopterId;
    entity._status = props.status ?? "received";
    entity._preTriageStatus = props.preTriageStatus ?? "review";
    entity._matchScore = props.matchScore ?? null;
    entity._matchAnswers = props.matchAnswers ?? null;
    entity._notes = props.notes ?? null;
    return entity;
  }

  static restore(props?: AdoptionRequestProps): AdoptionRequest | null {
    if (!props) return null;
    const entity = new AdoptionRequest(props.id, props.createdAt, props.updatedAt);
    entity._petId = props.petId;
    entity._adopterId = props.adopterId;
    entity._status = props.status;
    entity._preTriageStatus = props.preTriageStatus;
    entity._matchScore = props.matchScore ?? null;
    entity._matchAnswers = props.matchAnswers ?? null;
    entity._notes = props.notes ?? null;
    return entity;
  }
}
