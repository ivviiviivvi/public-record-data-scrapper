export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F'
export type SignalType = 'hiring' | 'permit' | 'contract' | 'expansion' | 'equipment'
export type ProspectStatus = 'new' | 'claimed' | 'contacted' | 'qualified' | 'dead'
export type IndustryType = 'restaurant' | 'retail' | 'construction' | 'healthcare' | 'manufacturing' | 'services' | 'technology'

export interface UCCFiling {
  id: string
  filingDate: string
  debtorName: string
  securedParty: string
  state: string
  lienAmount?: number
  status: 'active' | 'terminated' | 'lapsed'
  filingType: 'UCC-1' | 'UCC-3'
}

export interface GrowthSignal {
  id: string
  type: SignalType
  description: string
  detectedDate: string
  sourceUrl?: string
  score: number
  confidence: number
  mlConfidence?: number // ML model confidence in signal validity (0-100)
}

export interface HealthScore {
  grade: HealthGrade
  score: number
  sentimentTrend: 'improving' | 'stable' | 'declining'
  reviewCount: number
  avgSentiment: number
  violationCount: number
  lastUpdated: string
}

export interface MLScoring {
  confidence: number // Overall ML confidence in prospect quality (0-100)
  recoveryLikelihood: number // Predicted likelihood of default recovery (0-100)
  modelVersion: string
  lastUpdated: string
  factors: {
    healthTrend: number
    signalQuality: number
    industryRisk: number
    timeToRecovery: number
    financialStability: number
  }
}

export interface Prospect {
  id: string
  companyName: string
  industry: IndustryType
  state: string
  status: ProspectStatus
  priorityScore: number
  defaultDate: string
  timeSinceDefault: number
  lastFilingDate?: string
  uccFilings: UCCFiling[]
  growthSignals: GrowthSignal[]
  healthScore: HealthScore
  narrative: string
  estimatedRevenue?: number
  claimedBy?: string
  claimedDate?: string
  mlScoring?: MLScoring // ML confidence and recovery prediction
}

export interface CompetitorData {
  lenderName: string
  filingCount: number
  avgDealSize: number
  marketShare: number
  industries: IndustryType[]
  topState: string
  monthlyTrend: number
}

export interface PortfolioCompany {
  id: string
  companyName: string
  fundingDate: string
  fundingAmount: number
  currentStatus: 'performing' | 'watch' | 'at-risk' | 'default'
  healthScore: HealthScore
  lastAlertDate?: string
}

export interface RequalificationLead {
  id: string
  originalProspect: Prospect
  newSignals: GrowthSignal[]
  netScore: number
  recommendation: 'revive' | 'dismiss'
  reasoning: string
}

export interface DashboardStats {
  totalProspects: number
  highValueProspects: number
  avgPriorityScore: number
  newSignalsToday: number
  portfolioAtRisk: number
  avgHealthGrade: string
}

export interface ProspectNote {
  id: string
  prospectId: string
  content: string
  createdBy: string
  createdAt: string
  updatedAt?: string
}

export interface FollowUpReminder {
  id: string
  prospectId: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  description: string
  completed: boolean
  createdBy: string
  createdAt: string
  completedAt?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: 'initial-outreach' | 'follow-up' | 'recovery-offer' | 'check-in'
  variables: string[] // e.g., ['companyName', 'priorityScore', 'industryType']
}

export interface OutreachEmail {
  id: string
  prospectId: string
  templateId: string
  subject: string
  body: string
  status: 'draft' | 'sent' | 'scheduled'
  sentAt?: string
  scheduledFor?: string
  createdBy: string
  createdAt: string
}
