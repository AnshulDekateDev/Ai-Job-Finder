package com.aijobfinder.provider.scraper;

public class PageResult {
    private String url;
    private int statusCode;
    private String htmlContent;
    private String contentType;
    private boolean successful;
    private String errorMessage;

    public PageResult() {}

    public PageResult(String url, int statusCode, String htmlContent, String contentType, boolean successful) {
        this.url = url;
        this.statusCode = statusCode;
        this.htmlContent = htmlContent;
        this.contentType = contentType;
        this.successful = successful;
    }

    public static PageResult failure(String url, String errorMessage) {
        PageResult res = new PageResult();
        res.setUrl(url);
        res.setSuccessful(false);
        res.setErrorMessage(errorMessage);
        return res;
    }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public int getStatusCode() { return statusCode; }
    public void setStatusCode(int statusCode) { this.statusCode = statusCode; }

    public String getHtmlContent() { return htmlContent; }
    public void setHtmlContent(String htmlContent) { this.htmlContent = htmlContent; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public boolean isSuccessful() { return successful; }
    public void setSuccessful(boolean successful) { this.successful = successful; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
