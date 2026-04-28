export type SqlFragment = { text: string; values: unknown[] }

function isSqlFragment(value: unknown): value is SqlFragment {
  return typeof value === 'object' && value !== null && 'text' in value && 'values' in value
}

export function sql(strings: TemplateStringsArray, ...values: unknown[]): SqlFragment {
  let text = ''
  const params: unknown[] = []

  strings.forEach((chunk, index) => {
    text += chunk

    if (index >= values.length) {
      return
    }

    const value = values[index]

    if (isSqlFragment(value)) {
      const offset = params.length
      text += value.text.replace(/\$(\d+)/g, (_m, p1) => '$' + String(Number(p1) + offset))
      params.push(...value.values)
      return
    }

    params.push(value)
    text += '$' + String(params.length)
  })

  return { text, values: params }
}
