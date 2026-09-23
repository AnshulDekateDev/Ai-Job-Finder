package com.aijobfinder.provider.scraper;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class FetchRequest {
    private String url;
    private String method = "GET";
    private Map<String, String> headers = new HashMap<>();
    private Map<String, String> queryParams = new HashMap<>();
    private boolean renderJs = false;
    private String countryCode;

    public FetchRequest() {}

    public FetchRequest(String url) {
        this.url = url;
    }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public Map<String, String> getHeaders() { return headers; }
    public void setHeaders(Map<String, String> headers) { this.headers = headers; }

    public Map<String, String> getQueryParams() { return queryParams; }
    public void setQueryParams(Map<String, String> queryParams) { this.queryParams = queryParams; }

    public boolean isRenderJs() { return renderJs; }
    public void setRenderJs(boolean renderJs) { this.renderJs = renderJs; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
}
