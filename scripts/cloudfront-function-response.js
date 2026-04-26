function handler(event) {
  var response = event.response;

  response.headers['link'] = {
    value: '</llms.txt>; rel="describedby", </feed.xml>; rel="alternate"; type="application/rss+xml"'
  };

  if (event.request.uri.endsWith('.md')) {
    response.headers['content-type'] = { value: 'text/markdown; charset=utf-8' };
  }

  return response;
}
