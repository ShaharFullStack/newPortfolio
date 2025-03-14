class AppConfig {

    private readonly baseUrl = process.env.REACT_APP_BASE_URL;

	public readonly listUrl = this.baseUrl + "api/___/";
	public readonly addUrl = this.baseUrl + "api/___/";
}

export const appConfig = new AppConfig();
