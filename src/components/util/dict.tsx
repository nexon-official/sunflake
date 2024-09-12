export function delKey(object: any, key: string): any {
  delete object[key]
  return object
}

export function updateKey(object: any, key: string, value: any): any {
  return (value === undefined) ? delKey(object, key) : { ...object, [key]: value }
}
