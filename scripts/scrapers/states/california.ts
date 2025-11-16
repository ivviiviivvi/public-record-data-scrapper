/**
 * California UCC Scraper
 * 
 * Scrapes UCC filing data from California Secretary of State
 * Uses Puppeteer for real web scraping with anti-detection measures
 */

import { BaseScraper, ScraperResult } from '../base-scraper'
import puppeteer, { Browser, Page } from 'puppeteer'

export class CaliforniaScraper extends BaseScraper {
  private browser: Browser | null = null

  constructor() {
    super({
      state: 'CA',
      baseUrl: 'https://businesssearch.sos.ca.gov/',
      rateLimit: 5, // 5 requests per minute
      timeout: 30000,
      retryAttempts: 2
    })
  }

  /**
   * Initialize browser instance
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      })
    }
    return this.browser
  }

  /**
   * Close browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Search for UCC filings in California
   */
  async search(companyName: string): Promise<ScraperResult> {
    if (!this.validateSearch(companyName)) {
      this.log('error', 'Invalid company name provided', { companyName })
      return {
        success: false,
        error: 'Invalid company name',
        timestamp: new Date().toISOString()
      }
    }

    this.log('info', 'Starting UCC search', { companyName })

    // Rate limiting - wait 12 seconds between requests (5 per minute)
    await this.sleep(12000)

    const searchUrl = this.getManualSearchUrl(companyName)

    try {
      const { result, retryCount } = await this.retryWithBackoff(async () => {
        return await this.performSearch(companyName, searchUrl)
      }, `CA UCC search for ${companyName}`)

      this.log('info', 'UCC search completed successfully', { 
        companyName, 
        filingCount: result.filings?.length || 0,
        retryCount
      })

      return {
        ...result,
        retryCount
      }
    } catch (error) {
      this.log('error', 'UCC search failed after all retries', {
        companyName,
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        searchUrl,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Perform the actual search operation
   */
  private async performSearch(companyName: string, searchUrl: string): Promise<ScraperResult> {
    let page: Page | null = null

    try {
      const browser = await this.getBrowser()
      page = await browser.newPage()

      this.log('info', 'Browser page created', { companyName })

      // Set realistic user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')
      await page.setViewport({ width: 1920, height: 1080 })

      // Navigate to search page
      this.log('info', 'Navigating to search URL', { companyName, searchUrl })
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle0', 
        timeout: this.config.timeout 
      })

      // Wait for results to load
      try {
        await page.waitForSelector('.search-results, .no-results, .captcha', { 
          timeout: 10000 
        })
      } catch {
        this.log('warn', 'Results selector not found, proceeding anyway', { companyName })
      }

      // Check for CAPTCHA
      const hasCaptcha = await page.evaluate(() => {
        return document.body.innerText.toLowerCase().includes('captcha') ||
               document.body.innerText.toLowerCase().includes('robot') ||
               document.querySelector('iframe[src*="recaptcha"]') !== null
      })

      if (hasCaptcha) {
        this.log('error', 'CAPTCHA detected', { companyName })
        return {
          success: false,
          error: 'CAPTCHA detected - manual intervention required',
          searchUrl,
          timestamp: new Date().toISOString()
        }
      }

      // Scrape UCC filing data
      const { filings: rawFilings, errors: parseErrors } = await page.evaluate(() => {
        const results: Array<{
          filingNumber: string
          debtorName: string
          securedParty: string
          filingDate: string
          collateral: string
          status: 'active' | 'terminated' | 'lapsed'
          filingType: 'UCC-1' | 'UCC-3'
        }> = []
        const errors: string[] = []
        
        // Example selector pattern - adjust based on actual California SOS site structure
        const resultElements = document.querySelectorAll('.ucc-filing, tr.filing-row, .result-item')
        
        resultElements.forEach((element, index) => {
          try {
            // Extract filing data - adjust these selectors for the actual site
            const filingNumber = element.querySelector('.filing-number, .filing-id')?.textContent?.trim() || ''
            const debtorName = element.querySelector('.debtor-name, .debtor')?.textContent?.trim() || ''
            const securedParty = element.querySelector('.secured-party, .creditor')?.textContent?.trim() || ''
            const filingDate = element.querySelector('.filing-date, .date')?.textContent?.trim() || ''
            const status = element.querySelector('.status')?.textContent?.trim() || 'unknown'
            const collateral = element.querySelector('.collateral')?.textContent?.trim() || ''

            if (filingNumber || debtorName) {
              results.push({
                filingNumber,
                debtorName,
                securedParty,
                filingDate,
                collateral,
                status: status.toLowerCase().includes('active') ? 'active' : 
                       status.toLowerCase().includes('terminated') ? 'terminated' : 
                       status.toLowerCase().includes('lapsed') ? 'lapsed' : 'active',
                filingType: filingNumber.includes('UCC-3') ? 'UCC-3' : 'UCC-1'
              })
            }
          } catch (err) {
            errors.push(`Error parsing element ${index}: ${err instanceof Error ? err.message : String(err)}`)
          }
        })
        
        return { filings: results, errors }
      })

      // Validate filings and collect errors
      const { validatedFilings, validationErrors } = this.validateFilings(rawFilings, parseErrors)

      if (validationErrors.length > 0) {
        this.log('warn', 'Some filings had parsing or validation errors', {
          companyName,
          errorCount: validationErrors.length,
          errors: validationErrors
        })
      }

      this.log('info', 'Filings scraped and validated', {
        companyName,
        rawCount: rawFilings.length,
        validCount: validatedFilings.length,
        errorCount: validationErrors.length
      })

      return {
        success: true,
        filings: validatedFilings,
        searchUrl,
        timestamp: new Date().toISOString(),
        parsingErrors: validationErrors.length > 0 ? validationErrors : undefined
      }

    } finally {
      // Cleanup page in all cases
      if (page) {
        await page.close().catch((err) => {
          this.log('warn', 'Error closing page', { 
            error: err instanceof Error ? err.message : String(err) 
          })
        })
      }
    }
  }

  /**
   * Get manual search URL for California
   */
  getManualSearchUrl(companyName: string): string {
    return `${this.config.baseUrl}?SearchType=UCC&SearchCriteria=${encodeURIComponent(companyName)}`
  }
}
