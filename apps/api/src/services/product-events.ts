import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { ProductEvent, ProductEventName } from '../models/ProductEvent';

export interface RecordProductEventInput {
  eventId?: string;
  name: ProductEventName;
  occurredAt?: Date;
  actorUserId?: string | Types.ObjectId;
  studentId?: string | Types.ObjectId;
  jobId?: string | Types.ObjectId;
  applicationId?: string | Types.ObjectId;
  sessionId?: string;
  modelVersion?: string;
  experimentId?: string;
  experimentVariant?: string;
  rank?: number;
  candidateSetSize?: number;
  scores?: Record<string, number>;
  profileVersion?: string;
  jobVersion?: string;
  sourceProvider?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

const objectId = (value?: string | Types.ObjectId): Types.ObjectId | undefined => {
  if (!value) return undefined;
  return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
};

class ProductEventService {
  async record(input: RecordProductEventInput): Promise<void> {
    try {
      const eventId = input.eventId || randomUUID();
      await ProductEvent.updateOne(
        { eventId },
        {
          $setOnInsert: {
            ...input,
            eventId,
            occurredAt: input.occurredAt || new Date(),
            actorUserId: objectId(input.actorUserId),
            studentId: objectId(input.studentId),
            jobId: objectId(input.jobId),
            applicationId: objectId(input.applicationId)
          }
        },
        { upsert: true }
      );
    } catch (error) {
      // Telemetry must not break recommendations or applications.
      console.error('Failed to record product event:', error);
    }
  }

  async recordMany(inputs: RecordProductEventInput[]): Promise<void> {
    if (!inputs.length) return;
    await Promise.all(inputs.map(input => this.record(input)));
  }
}

export default new ProductEventService();
