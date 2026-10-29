import { vi } from 'vitest'
import { createTableEngine } from './index'
import type { TableEntity, CompiledTableDef } from '@shared/ui/table/mdap/table-entity'

export interface TableCoreTestOptions {
  entity?: Partial<TableEntity<any>>
  data?: any[]
}

export function createTestTableEntity<T>(overrides: Partial<TableEntity<T>> = {}): TableEntity<T> {
  return {
    id: 'test-table',
    name: 'Test Table',
    content: {
      columns: [
        { id: 'id', label: 'ID', sortable: true },
        { id: 'name', label: 'Name', sortable: true },
        { id: 'status', label: 'Status' },
      ],
      getRowId: (row: T) => (row as any).id || String(Math.random()),
    },
    behavior: {
      client: { data: [], totalCount: 0 },
    },
    surface: {
      pagination: true,
      toolbar: true,
    },
    presentation: {
      striped: true,
      bordered: true,
    },
    ...overrides,
  }
}

export function createTestTableData(count: number = 10) {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i + 1}`,
    name: `Item ${i + 1}`,
    status: i % 2 === 0 ? 'active' : 'inactive',
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }))
}

export function createMockTableEngine(options: TableCoreTestOptions = {}) {
  const entity = createTestTableEntity(options.entity)
  if (options.data) {
    entity.behavior = { client: { data: options.data, totalCount: options.data.length } }
  }
  return createTableEngine(entity)
}

export function createMockCompiledTableDef(overrides: Partial<CompiledTableDef> = {}): CompiledTableDef {
  return {
    meta: {
      id: 'mock-table',
      columns: [
        { id: 'id', label: 'ID', sortable: true },
        { id: 'name', label: 'Name', sortable: true },
      ],
    },
    columns: [
      { id: 'id', header: 'ID', accessor: 'id', sortable: true },
      { id: 'name', header: 'Name', accessor: 'name', sortable: true },
    ],
    source: { type: 'client', data: [] },
    totalCount: 0,
    pagination: true,
    toolbar: true,
    filterBar: false,
    selectionActionBar: false,
    chrome: {
      exportBtn: false,
      importBtn: false,
      deleteBtn: false,
      filterStatusBadge: false,
    },
    ...overrides,
  }
}

export function createMockTanStackAdapter() {
  return {
    getRowId: vi.fn((row: any) => row.id),
    getColumns: vi.fn(() => []),
    getState: vi.fn(() => ({})),
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    ...vi.fn(),
  }
}

export function createMockDataSource<T>(data: T[], totalCount?: number) {
  return {
    type: 'client' as const,
    data,
    totalCount: totalCount ?? data.length,
  }
}

export function createMockServerDataSource<T>(
  fetcher: () => Promise<{ rows: T[]; totalCount: number }>,
  guard?: () => boolean,
  gate?: 'auto' | 'manual'
) {
  return {
    type: 'server' as const,
    fetcher,
    guard,
    gate,
  }
}

export const mockFetcher = vi.fn(async () => ({
  rows: createTestTableData(5),
  totalCount: 5,
}))

export const mockGuard = vi.fn(() => true)

export const mockCreateExport = vi.fn()

export const mockOnImport = vi.fn()

export function resetTableMocks() {
  mockFetcher.mockReset()
  mockGuard.mockReset()
  mockCreateExport.mockReset()
  mockOnImport.mockReset()
}

export async function waitForTableState(
  tableEngine: ReturnType<typeof createTableEngine>,
  predicate: (state: any) => boolean,
  timeout = 5000
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (predicate(tableEngine.getState())) {
      return
    }
    await new Promise((r) => setTimeout(r, 10))
  }
  throw new Error(`waitForTableState timed out after ${timeout}ms`)
}

export function expectTableData<T extends Record<string, any>>(tableEngine: ReturnType<typeof createTableEngine>, expectedData: T[]) {
  const state = tableEngine.getState() as any
  const actualData = (state.data || []) as any[]
  if (actualData.length !== expectedData.length) {
    throw new Error(`Expected ${expectedData.length} rows, but got ${actualData.length}`)
  }
  expectedData.forEach((expected, i) => {
    const actual = actualData[i] || {}
    Object.keys(expected).forEach((key) => {
      if (actual[key] !== expected[key]) {
        throw new Error(
          `Row ${i}, column "${key}": expected ${JSON.stringify(expected[key])}, got ${JSON.stringify(actual[key])}`
        )
      }
    })
  })
}

export function expectTableSorted(tableEngine: ReturnType<typeof createTableEngine>, column: string, direction: 'asc' | 'desc') {
  const state = tableEngine.getState() as any
  const sortModel = state.sorting || []
  const columnSort = sortModel.find((s: any) => s.id === column)
  if (!columnSort) {
    throw new Error(`Table not sorted by column "${column}"`)
  }
  if (columnSort.desc !== (direction === 'desc')) {
    throw new Error(`Expected sort direction "${direction}", got "${columnSort.desc ? 'desc' : 'asc'}"`)
  }
}

export function expectTableFiltered(tableEngine: ReturnType<typeof createTableEngine>, filter: Record<string, any>) {
  const state = tableEngine.getState() as any
  const filterModel = state.filtering || state.columnFilters || {}
  Object.entries(filter).forEach(([key, value]) => {
    if (filterModel[key] !== value) {
      throw new Error(`Expected filter "${key}" to be "${value}", got "${filterModel[key]}"`)
    }
  })
}