export interface RequestType {
  [key: string]: string
}
export interface ResponseType {
  [key: string]: string
}
export interface CurlDetails {
  url: string
  method: string
  headers: Record<string, string>
  body?: Record<string, any>
}
