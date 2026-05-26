const _DEFAULT_API = process.env.RONZZ_API ?? "http://localhost:5173"
const _DEFAULT_TOKEN = process.env.RONZZ_TOKEN ?? ""

export interface ApiClientConfig {
  api: string
  token: string
}

export class ApiClient {
  private api: string
  private token: string

  constructor(config: ApiClientConfig) {
    this.api = config.api.replace(/\/+$/, "")
    this.token = config.token
  }

  /** Update API base URL and bearer token after construction. */
  setAuth(api: string, token: string): void {
    this.api = api.replace(/\/+$/, "")
    this.token = token
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const url = `${this.api}${path}`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    // Handle 204 No Content (DELETE responses) — no body to parse
    if (response.status === 204) {
      return { deleted: true }
    }

    return response.json()
  }

  // Token commands
  async createToken(name: string): Promise<{ id: string; token: string }> {
    return this.request("POST", "/lib/login/token", { name }) as Promise<{
      id: string
      token: string
    }>
  }

  async listTokens(): Promise<{ id: string; name: string }[]> {
    return this.request("GET", "/api/v1/admin/tokens") as Promise<{ id: string; name: string }[]>
  }

  async revokeToken(id: string): Promise<{ deleted: boolean }> {
    return this.request("DELETE", `/api/v1/admin/tokens?id=${id}`) as Promise<{
      deleted: boolean
    }>
  }

  // Resource commands
  async listResources(limit = 50, offset = 0): Promise<{ resources: unknown[]; total: number }> {
    return this.request(
      "GET",
      `/lib/api/v1/admin/resources?limit=${limit}&offset=${offset}`,
    ) as Promise<{ resources: unknown[]; total: number }>
  }

  async createResource(data: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", "/lib/api/v1/admin/resources", data)
  }

  async deleteResource(id: string): Promise<{ deleted: boolean }> {
    return this.request("DELETE", `/lib/api/v1/admin/resources?id=${id}`) as Promise<{
      deleted: boolean
    }>
  }

  async listTrashResources(): Promise<{ resources: unknown[] }> {
    return this.request("GET", "/lib/api/v1/admin/resources/trash") as Promise<{
      resources: unknown[]
    }>
  }

  async restoreResource(id: string): Promise<{ restored: boolean }> {
    return this.request("POST", `/lib/api/v1/admin/resources/${id}/restore`) as Promise<{
      restored: boolean
    }>
  }

  async purgeResource(id: string): Promise<{ purged: boolean }> {
    return this.request("DELETE", `/lib/api/v1/admin/resources/${id}/purge`) as Promise<{
      purged: boolean
    }>
  }

  // Dataset commands
  async listDatasets(limit = 50, offset = 0): Promise<{ datasets: unknown[]; total: number }> {
    return this.request(
      "GET",
      `/stats/api/v1/admin/datasets?limit=${limit}&offset=${offset}`,
    ) as Promise<{ datasets: unknown[]; total: number }>
  }

  async createDataset(data: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", "/stats/api/v1/admin/datasets", data)
  }

  async deleteDataset(id: string): Promise<{ deleted: boolean }> {
    return this.request("DELETE", `/stats/api/v1/admin/datasets?id=${id}`) as Promise<{
      deleted: boolean
    }>
  }

  async listTrashDatasets(): Promise<{ datasets: unknown[] }> {
    return this.request("GET", "/stats/api/v1/admin/datasets/trash") as Promise<{
      datasets: unknown[]
    }>
  }

  async restoreDataset(id: string): Promise<{ restored: boolean }> {
    return this.request("POST", `/stats/api/v1/admin/datasets/${id}/restore`) as Promise<{
      restored: boolean
    }>
  }

  async purgeDataset(id: string): Promise<{ purged: boolean }> {
    return this.request("DELETE", `/stats/api/v1/admin/datasets/${id}/purge`) as Promise<{
      purged: boolean
    }>
  }

  // Article commands
  async listArticles(limit = 50, offset = 0): Promise<{ articles: unknown[]; total: number }> {
    return this.request(
      "GET",
      `/encik/api/v1/admin/articles?limit=${limit}&offset=${offset}`,
    ) as Promise<{ articles: unknown[]; total: number }>
  }

  async createArticle(data: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", "/encik/api/v1/admin/articles", data)
  }

  async deleteArticle(id: string): Promise<{ deleted: boolean }> {
    return this.request("DELETE", `/encik/api/v1/admin/articles?id=${id}`) as Promise<{
      deleted: boolean
    }>
  }

  async listTrashArticles(): Promise<{ articles: unknown[] }> {
    return this.request("GET", "/encik/api/v1/admin/articles/trash") as Promise<{
      articles: unknown[]
    }>
  }

  async restoreArticle(id: string): Promise<{ restored: boolean }> {
    return this.request("POST", `/encik/api/v1/admin/articles/${id}/restore`) as Promise<{
      restored: boolean
    }>
  }

  async purgeArticle(id: string): Promise<{ purged: boolean }> {
    return this.request("DELETE", `/encik/api/v1/admin/articles/${id}/purge`) as Promise<{
      purged: boolean
    }>
  }

  // Search commands
  async reindexSearch(data: { documents: unknown[] }): Promise<unknown> {
    return this.request("POST", "/api/v1/search/index", data)
  }

  async search(q: string, type?: string): Promise<{ results: unknown[]; total: number }> {
    const params = new URLSearchParams({ q })
    if (type) params.set("type", type)
    return this.request("GET", `/api/v1/search?${params}`) as Promise<{
      results: unknown[]
      total: number
    }>
  }
}
