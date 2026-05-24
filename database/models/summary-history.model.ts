import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface SummaryHistoryItem extends Document {
  userId: string;
  email: string;
  symbol: string;
  company: string;
  price: string;
  shortSummary: string;
  impactRating: number;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  priceImpact: string;
  businessImpact: string;
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
    impactRating: { type: Number, required: true, min: 1, max: 5, default: 1 },
    sentiment: {
      type: String,
      required: true,
      enum: ['positive', 'neutral', 'negative', 'mixed'],
      default: 'neutral',
    },
    priceImpact: { type: String, required: true, trim: true, default: 'Влияние на цену ограничено.' },
    businessImpact: { type: String, required: true, trim: true, default: 'Существенных изменений в положении компании не выявлено.' },
    generatedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: false }
);

SummaryHistorySchema.index({ userId: 1, generatedAt: -1 });

export const SummaryHistory: Model<SummaryHistoryItem> =
  (models?.SummaryHistory as Model<SummaryHistoryItem>) ||
  model<SummaryHistoryItem>('SummaryHistory', SummaryHistorySchema);
