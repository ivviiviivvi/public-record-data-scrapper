
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryBuilder } from './queries'
import { DatabaseClient } from './client'

// Mock DatabaseClient
const mockQuery = vi.fn()
const mockClient = {
  query: mockQuery
} as unknown as DatabaseClient

describe('QueryBuilder', () => {
  let queryBuilder: QueryBuilder

  beforeEach(() => {
    queryBuilder = new QueryBuilder(mockClient)
    vi.clearAllMocks()
  })

  describe('bulkInsert', () => {
    it('should construct valid query for valid inputs', async () => {
      const table = 'users'
      const columns = ['name', 'email']
      const values = [['Alice', 'alice@example.com'], ['Bob', 'bob@example.com']]

      await queryBuilder.bulkInsert(table, columns, values)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users (name, email) VALUES ($1, $2), ($3, $4)'),
        ['Alice', 'alice@example.com', 'Bob', 'bob@example.com']
      )
    })

    it('should support schema-qualified table names', async () => {
      const table = 'public.users'
      const columns = ['name']
      const values = [['Alice']]

      await queryBuilder.bulkInsert(table, columns, values)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.users (name) VALUES ($1)'),
        ['Alice']
      )
    })

    it('should throw error for invalid table name', async () => {
      const table = 'users; DROP TABLE users; --'
      const columns = ['name']
      const values = [['Alice']]

      await expect(queryBuilder.bulkInsert(table, columns, values))
        .rejects
        .toThrow('Invalid identifier')
    })

    it('should throw error for invalid column name', async () => {
      const table = 'users'
      const columns = ['name', 'email; --']
      const values = [['Alice', 'alice@example.com']]

      await expect(queryBuilder.bulkInsert(table, columns, values))
        .rejects
        .toThrow('Invalid identifier')
    })
  })
})
