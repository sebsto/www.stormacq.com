function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var accept = request.headers.accept ? request.headers.accept.value : '';

  var wantsMarkdown = accept.indexOf('text/markdown') !== -1;

  if (uri.endsWith('/')) {
    request.uri += wantsMarkdown ? 'index.md' : 'index.html';
  } else if (!uri.includes('.')) {
    request.uri += wantsMarkdown ? '/index.md' : '/index.html';
  }

  return request;
}
