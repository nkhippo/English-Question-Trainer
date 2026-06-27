function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY'),
      'anthropic-version': '2023-06-01',
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  return ContentService.createTextOutput(res.getContentText())
    .setMimeType(ContentService.MimeType.JSON);
}
