import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('app module', () => {
  it('exports the app component', () => {
    expect(App).toBeTypeOf('function')
  })
})
