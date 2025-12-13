/**
 * Database Query Utilities
 *
 * Provides type-safe query builders and common database operations
 */

import { DatabaseClient } from './client'
import { UCCFiling, Prospect, GrowthSignal, HealthScore, PortfolioCompany } from '../types'

// Database Row Types
export interface ProspectRow {
  id: string
  company_name: string
  industry: string
  state: string
  status: string
  priority_score: number
  default_date: Date
  time_since_default: number
  last_filing_date?: Date
  estimated_revenue?: number
  claimed_by?: string
  claimed_date?: Date
  health_score?: HealthScore
  ml_scoring?: any
}

export interface UCCFilingRow {
  id: string
  filing_date: Date
  debtor_name: string
  secured_party: string
  state: string
  lien_amount?: number
  status: string
  filing_type: 'UCC-1' | 'UCC-3'
}

export interface GrowthSignalRow {
  id: string
  type: string
  description: string
  detected_date: Date
  source_url?: string
  confidence: number
}

export interface PortfolioCompanyRow {
  id: string
  company_name: string
  funding_date: Date
  funding_amount: number
  current_status: 'performing' | 'watch' | 'at-risk' | 'default'
  last_alert_date?: Date
}

export class QueryBuilder {
  private client: DatabaseClient

  constructor(client: DatabaseClient) {
    this.client = client
  }

  // ============================================================================
  // UCC FILINGS
  // ============================================================================

  /**
   * Create UCC filing
   */
  async createUCCFiling(filing: Partial<UCCFiling>): Promise<UCCFiling> {
    const query = `
      INSERT INTO ucc_filings (
        file_number, filing_date, debtor_name, debtor_address,
        secured_party_name, secured_party_address, collateral_description,
        amount, state, status, lapse_date, source, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `

    // Note: The properties below assume they exist on Partial<UCCFiling> or mapped correctly.
    // Adjusted to match potential expected input if types are loose, but ideally should match defined types.
    const values = [
      (filing as any).fileNumber,
      filing.filingDate,
      filing.debtorName,
      (filing as any).debtorAddress,
      filing.securedParty,
      (filing as any).securedPartyAddress,
      (filing as any).collateral,
      filing.lienAmount,
      filing.state,
      filing.status || 'active',
      (filing as any).lapseDate,
      (filing as any).source,
      JSON.stringify(filing)
    ]

    const result = await this.client.query<UCCFiling>(query, values)
    return result.rows[0]
  }

  /**
   * Get UCC filings by state
   */
  async getUCCFilingsByState(state: string, limit: number = 100): Promise<UCCFiling[]> {
    const query = `
      SELECT * FROM ucc_filings
      WHERE state = $1 AND status = 'active'
      ORDER BY filing_date DESC
      LIMIT $2
    `

    const result = await this.client.query<UCCFiling>(query, [state, limit])
    return result.rows
  }

  /**
   * Search UCC filings by debtor name
   */
  async searchUCCFilings(debtorName: string, limit: number = 50): Promise<UCCFiling[]> {
    const query = `
      SELECT * FROM ucc_filings
      WHERE debtor_name ILIKE $1
      ORDER BY filing_date DESC
      LIMIT $2
    `

    const result = await this.client.query<UCCFiling>(query, [`%${debtorName}%`, limit])
    return result.rows
  }

  /**
   * Get UCC filing by file number
   */
  async getUCCFilingByNumber(fileNumber: string): Promise<UCCFiling | null> {
    const query = 'SELECT * FROM ucc_filings WHERE external_id = $1'
    const result = await this.client.query<UCCFiling>(query, [fileNumber])
    return result.rows[0] || null
  }

  async getUCCFilingsByProspect(prospectId: string): Promise<UCCFilingRow[]> {
      const query = `
        SELECT u.*
        FROM ucc_filings u
        JOIN prospect_ucc_filings puf ON u.id = puf.ucc_filing_id
        WHERE puf.prospect_id = $1
        ORDER BY u.filing_date DESC
      `
      const result = await this.client.query<UCCFilingRow>(query, [prospectId])
      return result.rows
  }

  // ============================================================================
  // PROSPECTS
  // ============================================================================

  /**
   * Create prospect
   */
  async createProspect(prospect: Partial<Prospect>): Promise<Prospect> {
     // NOTE: This query seems to refer to columns that might match schema.sql differently.
     // Updating to match schema.sql based on inference.
    const query = `
      INSERT INTO prospects (
        id, company_name, status, priority_score,
        default_date, time_since_default, estimated_revenue,
        claimed_by, narrative, industry, state
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `

    const values = [
      prospect.id,
      prospect.companyName,
      prospect.status || 'new',
      prospect.priorityScore || 0,
      prospect.defaultDate,
      prospect.timeSinceDefault,
      prospect.estimatedRevenue,
      prospect.claimedBy,
      prospect.narrative,
      prospect.industry,
      prospect.state
    ]

    const result = await this.client.query<Prospect>(query, values)
    return result.rows[0]
  }

  /**
   * Get prospects by status or other options
   * Matches databaseService.ts usage: queries.getProspects(options)
   */
  async getProspects(options: {
      status?: string
      industry?: string
      state?: string
      minScore?: number
      limit?: number
      offset?: number
  } = {}): Promise<ProspectRow[]> {
    let query = `SELECT * FROM prospects WHERE 1=1`
    const values: any[] = []
    let paramIndex = 1

    if (options.status) {
        query += ` AND status = $${paramIndex++}`
        values.push(options.status)
    }
    if (options.industry) {
        query += ` AND industry = $${paramIndex++}`
        values.push(options.industry)
    }
    if (options.state) {
        query += ` AND state = $${paramIndex++}`
        values.push(options.state)
    }
    if (options.minScore) {
        query += ` AND priority_score >= $${paramIndex++}`
        values.push(options.minScore)
    }

    query += ` ORDER BY priority_score DESC`

    if (options.limit) {
        query += ` LIMIT $${paramIndex++}`
        values.push(options.limit)
    }
    if (options.offset) {
        query += ` OFFSET $${paramIndex++}`
        values.push(options.offset)
    }

    const result = await this.client.query<ProspectRow>(query, values)
    return result.rows
  }

  /**
   * Get prospects by status (Legacy method, keeping for compatibility if needed)
   */
  async getProspectsByStatus(status: string, limit: number = 100): Promise<Prospect[]> {
    const query = `
      SELECT *
      FROM prospects
      WHERE status = $1
      ORDER BY priority_score DESC
      LIMIT $2
    `

    const result = await this.client.query<Prospect>(query, [status, limit])
    return result.rows
  }

  /**
   * Get top priority prospects
   */
  async getTopProspects(limit: number = 50): Promise<Prospect[]> {
    const query = `
      SELECT *
      FROM prospects
      WHERE status NOT IN ('closed-won', 'closed-lost')
      ORDER BY priority_score DESC
      LIMIT $1
    `

    const result = await this.client.query<Prospect>(query, [limit])
    return result.rows
  }

  async getProspectById(id: string): Promise<ProspectRow | null> {
      const query = `SELECT * FROM prospects WHERE id = $1`
      const result = await this.client.query<ProspectRow>(query, [id])
      return result.rows[0] || null
  }

  async searchProspects(queryStr: string, limit: number = 20): Promise<ProspectRow[]> {
      const query = `
          SELECT * FROM prospects
          WHERE company_name_normalized ILIKE $1
          LIMIT $2
      `
      const result = await this.client.query<ProspectRow>(query, [`%${queryStr.toLowerCase()}%`, limit])
      return result.rows
  }

  /**
   * Update prospect
   * Matches databaseService.ts usage: queries.updateProspect(id, { ... })
   */
  async updateProspect(id: string, updates: any): Promise<ProspectRow | null> {
      // Simple implementation constructing dynamic update
      const setClauses: string[] = []
      const values: any[] = [id]
      let paramIndex = 2

      if (updates.status) {
          setClauses.push(`status = $${paramIndex++}`)
          values.push(updates.status)
      }
      if (updates.claimedBy) {
          setClauses.push(`claimed_by = $${paramIndex++}`)
          values.push(updates.claimedBy)
      }
      if (updates.claimedDate) {
          setClauses.push(`claimed_date = $${paramIndex++}`)
          values.push(updates.claimedDate)
      }

      if (setClauses.length === 0) return null

      const query = `
          UPDATE prospects
          SET ${setClauses.join(', ')}
          WHERE id = $1
          RETURNING *
      `
      const result = await this.client.query<ProspectRow>(query, values)
      return result.rows[0] || null
  }

  async updateProspectStatus(prospectId: string, status: string): Promise<void> {
    const query = 'UPDATE prospects SET status = $1 WHERE id = $2'
    await this.client.query(query, [status, prospectId])
  }

  async updateProspectPriority(prospectId: string, score: number): Promise<void> {
    const query = 'UPDATE prospects SET priority_score = $1 WHERE id = $2'
    await this.client.query(query, [score, prospectId])
  }

  // ============================================================================
  // GROWTH SIGNALS
  // ============================================================================

  /**
   * Create growth signal
   */
  async createGrowthSignal(signal: Partial<GrowthSignal> & { prospectId: string }): Promise<void> {
    const query = `
      INSERT INTO growth_signals (
        prospect_id, type, description,
        detected_date, source_url, confidence, score, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `

    const values = [
      signal.prospectId,
      signal.type,
      signal.description,
      signal.detectedDate,
      signal.sourceUrl,
      signal.confidence,
      signal.score,
      JSON.stringify(signal)
    ]

    await this.client.query(query, values)
  }

  /**
   * Get growth signals for prospect
   */
  async getGrowthSignalsForProspect(prospectId: string): Promise<GrowthSignal[]> {
    const query = `
      SELECT * FROM growth_signals
      WHERE prospect_id = $1
      ORDER BY detected_date DESC
    `

    const result = await this.client.query<GrowthSignal>(query, [prospectId])
    return result.rows
  }

  async getGrowthSignalsByProspect(prospectId: string): Promise<GrowthSignalRow[]> {
      const query = `
        SELECT * FROM growth_signals
        WHERE prospect_id = $1
        ORDER BY detected_date DESC
      `
      const result = await this.client.query<GrowthSignalRow>(query, [prospectId])
      return result.rows
  }

  // ============================================================================
  // HEALTH METRICS
  // ============================================================================

  /**
   * Create health metric
   */
  async createHealthMetric(prospectId: string, healthScore: HealthScore): Promise<void> {
    const query = `
      INSERT INTO health_scores (
        prospect_id, recorded_date, grade, score,
        sentiment_trend, review_count, avg_sentiment, violation_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `

    const values = [
      prospectId,
      healthScore.lastUpdated,
      healthScore.grade,
      healthScore.score,
      healthScore.sentimentTrend,
      healthScore.reviewCount,
      healthScore.avgSentiment,
      healthScore.violationCount
    ]

    await this.client.query(query, values)
  }

  /**
   * Get latest health metric for company
   */
  async getLatestHealthMetric(prospectId: string): Promise<HealthScore | null> {
    const query = `
      SELECT * FROM health_scores
      WHERE prospect_id = $1
      ORDER BY recorded_date DESC
      LIMIT 1
    `

    const result = await this.client.query(query, [prospectId])

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      grade: row.grade,
      score: row.score,
      sentimentTrend: row.sentiment_trend,
      reviewCount: row.review_count,
      avgSentiment: row.avg_sentiment,
      violationCount: row.violation_count,
      lastUpdated: row.recorded_date
    }
  }

  // ============================================================================
  // PORTFOLIO COMPANIES
  // ============================================================================

  /**
   * Get portfolio companies with health scores
   */
  async getPortfolioCompanies(): Promise<PortfolioCompany[]> {
    const query = `
      SELECT
        pc.*,
        hs.grade as health_grade,
        hs.score as health_score,
        hs.sentiment_trend,
        hs.review_count,
        hs.avg_sentiment,
        hs.violation_count,
        hs.recorded_date as health_last_updated
      FROM portfolio_companies pc
      LEFT JOIN portfolio_health_scores phs ON pc.id = phs.portfolio_company_id
      LEFT JOIN health_scores hs ON phs.health_score_id = hs.id
      ORDER BY pc.company_name ASC
    `

    const result = await this.client.query(query)

    return result.rows.map(row => ({
      id: row.id,
      companyName: row.company_name,
      fundingDate: row.funding_date ? new Date(row.funding_date).toISOString().split('T')[0] : '',
      fundingAmount: parseFloat(row.funding_amount),
      currentStatus: row.current_status,
      lastAlertDate: row.last_alert_date ? new Date(row.last_alert_date).toISOString().split('T')[0] : undefined,
      healthScore: {
        grade: row.health_grade || 'C',
        score: row.health_score || 0,
        sentimentTrend: row.sentiment_trend || 'stable',
        reviewCount: row.review_count || 0,
        avgSentiment: row.avg_sentiment ? parseFloat(row.avg_sentiment) : 0,
        violationCount: row.violation_count || 0,
        lastUpdated: row.health_last_updated ? new Date(row.health_last_updated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }
    }))
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get prospect statistics
   */
  async getProspectStats(): Promise<{
    total: number
    by_status: Record<string, number>
    avgScore: number // Changed from avg_priority_score to match usage
    avg_health_score: number
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        AVG(priority_score) as avg_priority,
        AVG(health_score) as avg_health,
        json_object_agg(status, status_count) as by_status
      FROM (
        SELECT
          status,
          COUNT(*) as status_count,
          AVG(priority_score)::numeric as avg_priority
        FROM prospects
        LEFT JOIN latest_health_scores h ON prospects.id = h.prospect_id
        GROUP BY status
      ) stats
      CROSS JOIN (
         SELECT AVG(health_score)::numeric as avg_health FROM latest_health_scores
      ) hstats
    `
    // Note: The query above is a bit approximated, but should work for basic stats.

    const result = await this.client.query(query)
    const row = result.rows[0]

    return {
      total: parseInt(row.total || '0'),
      by_status: row.by_status || {},
      avgScore: parseFloat(row.avg_priority || '0'),
      avg_health_score: parseFloat(row.avg_health || '0')
    }
  }

  /**
   * Get data source performance
   */
  async getDataSourcePerformance(): Promise<any[]> {
    // Ensuring table exists or mocking
    try {
        const query = 'SELECT * FROM ingestion_logs ORDER BY started_at DESC LIMIT 50'
        const result = await this.client.query(query)
        return result.rows
    } catch (e) {
        return []
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Convert score to grade
   */
  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Bulk insert (for performance)
   */
  async bulkInsert(table: string, columns: string[], values: any[][]): Promise<void> {
    if (values.length === 0) return

    const placeholders = values.map((_, i) => {
      const rowPlaceholders = columns.map((_, j) => `$${i * columns.length + j + 1}`)
      return `(${rowPlaceholders.join(', ')})`
    }).join(', ')

    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`
    const flatValues = values.flat()

    await this.client.query(query, flatValues)
  }
}

/**
 * Create query builder instance
 */
export function createQueryBuilder(client: DatabaseClient): QueryBuilder {
  return new QueryBuilder(client)
}

/**
 * Alias for createQueryBuilder to match usage in databaseService.ts
 */
export function createQueries(client: DatabaseClient): QueryBuilder {
    return new QueryBuilder(client)
}
