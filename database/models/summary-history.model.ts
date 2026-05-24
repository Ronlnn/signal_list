import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface SummaryHistoryItem extends Document {
  userId: string;
  email: string;
  symbol: string;
  company: string;
  price: string;
  shortSummary: string;
  generatedAt: Date;
}

const SummaryHistorySchema = new Schema<SummaryHistoryItem>(
  {
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    price: { type: String, required: true, trim: true },
    shortSummary: { type: String, required: true, trim: true },
    generatedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: false }
);

SummaryHistorySchema.index({ userId: 1, generatedAt: -1 });

export const SummaryHistory: Model<SummaryHistoryItem> =
  (models?.SummaryHistory as Model<SummaryHistoryItem>) ||
  model<SummaryHistoryItem>('SummaryHistory', SummaryHistorySchema);
