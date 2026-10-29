import { vi } from 'vitest'
import { FormCore } from './engine'
import type { FormDefinition } from './domain'

export interface FormCoreTestOptions {
  definition?: Partial<FormDefinition>
  initialData?: Record<string, unknown>
  onSubmit?: (data: Record<string, unknown>) => Promise<unknown> | void
}

export function createFormCore(
  definition: FormDefinition,
  initialData?: Record<string, unknown>,
  _onSubmit?: (data: Record<string, unknown>) => Promise<unknown> | void
) {
  return new FormCore(definition, initialData)
}

export function createTestFormCore(options: FormCoreTestOptions = {}) {
  const definition: FormDefinition = {
    id: 'test-form',
    title: 'Test Form',
    submitLabel: 'Submit',
    sections: [
      {
        id: 'section-1',
        title: 'Section 1',
        fields: [
          {
            id: 'field-1',
            name: 'testField',
            type: 'text',
            label: 'Test Field',
          },
        ],
      },
    ],
    ...options.definition,
  }

  return createFormCore(definition, options.initialData, options.onSubmit)
}

export function createMockFormDefinition(overrides: Partial<FormDefinition> = {}): FormDefinition {
  return {
    id: 'mock-form',
    title: 'Mock Form',
    submitLabel: 'Submit',
    sections: [
      {
        id: 'section-1',
        title: 'Section 1',
        fields: [
          {
            id: 'field-1',
            name: 'name',
            type: 'text',
            label: 'Name',
            required: true,
          },
          {
            id: 'field-2',
            name: 'email',
            type: 'email',
            label: 'Email',
            required: true,
          },
        ],
      },
    ],
    ...overrides,
  }
}

export function createAsyncMockFormDefinition(overrides: Partial<FormDefinition> = {}): FormDefinition {
  return {
    id: 'async-mock-form',
    title: 'Async Mock Form',
    submitLabel: 'Submit',
    sections: [
      {
        id: 'section-1',
        title: 'Section 1',
        fields: [
          {
            id: 'field-1',
            name: 'asyncField',
            type: 'select',
            label: 'Async Field',
            options: [],
            remoteOptions: {
              url: '/api/options',
              method: 'GET',
            },
          },
        ],
      },
    ],
    ...overrides,
  }
}

export const mockOnSubmit = vi.fn(async (data: Record<string, unknown>) => {
  return { success: true, data }
})

export const mockOnChange = vi.fn((fieldName: string, value: unknown) => {
  return { fieldName, value }
})

export const mockOnBlur = vi.fn((fieldName: string, value: unknown) => {
  return { fieldName, value }
})

export function resetFormMocks() {
  mockOnSubmit.mockReset()
  mockOnChange.mockReset()
  mockOnBlur.mockReset()
}

export async function waitForFormState(
  formCore: FormCore,
  predicate: (state: any) => boolean,
  timeout = 5000
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (predicate(formCore.state)) {
      return
    }
    await new Promise((r) => setTimeout(r, 10))
  }
  throw new Error(`waitForFormState timed out after ${timeout}ms`)
}

export function expectFormValid(formCore: FormCore, expected = true) {
  const isValid = formCore.isValid
  if (isValid !== expected) {
    throw new Error(
      `Expected form to be ${expected ? 'valid' : 'invalid'}, but got ${isValid ? 'valid' : 'invalid'}.\n` +
        `Errors: ${JSON.stringify(formCore.validity, null, 2)}`
    )
  }
}

export function expectFieldValue(formCore: FormCore, fieldName: string, expectedValue: unknown) {
  const actualValue = (formCore.values as Record<string, any>)[fieldName]
  if (actualValue !== expectedValue) {
    throw new Error(
      `Expected field "${fieldName}" to be ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(actualValue)}`
    )
  }
}

export function expectFieldError(formCore: FormCore, fieldName: string, expectedMessage?: string) {
  const field = formCore.resolver.resolve(fieldName)
  const fieldId = field?.id || fieldName
  const fieldValidity = formCore.validity[fieldId]
  const error = fieldValidity?.errors?.map((e) => e.message).join(', ')
  if (!error) {
    throw new Error(`Expected field "${fieldName}" to have an error, but it has none`)
  }
  if (expectedMessage && !error.includes(expectedMessage)) {
    throw new Error(
      `Expected field "${fieldName}" error to contain "${expectedMessage}", but got "${error}"`
    )
  }
}