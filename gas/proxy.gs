/**
 * Claude API プロキシ（GAS ウェブアプリ）
 *
 * デプロイ: ウェブアプリ / 実行ユーザー=自分 / アクセス=全員
 * Script Properties: CLAUDE_API_KEY
 *
 * フロントは POST body を text/plain で送る（application/json だと CORS プリフライトで失敗する）。
 */
function doPost(e) {
  if (!e?.postData?.contents) {
    return ContentService.createTextOutput(JSON.stringify({ error: { message: 'Empty request body' } }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: { message: 'Invalid JSON body' } }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!apiKey) {
    return ContentService.createTextOutput(JSON.stringify({ error: { message: 'CLAUDE_API_KEY not configured' } }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  return ContentService.createTextOutput(res.getContentText())
    .setMimeType(ContentService.MimeType.JSON);
}
