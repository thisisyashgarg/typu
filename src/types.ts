export interface CurlDetails {
  url: string
  method: string
  headers: Record<string, string>
  body?: any
}
