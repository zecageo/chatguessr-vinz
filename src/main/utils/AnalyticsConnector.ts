export default class AnalyticsConnector{
    
  #settings: Settings
  #apiKey: String
  #apiEndpoint: String
  constructor(settings: Settings) {
    this.#settings = settings
    this.#apiKey = this.#settings.apiKey
    this.#apiEndpoint = this.#settings.apiEndpoint
    
  }
  async sendRoundResults() {
    console.log(this.#settings)
    console.log(this.#apiKey)
    console.log(this.#apiEndpoint)
  }
}