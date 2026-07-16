export async function compressGzip(str) {
  const buf = new TextEncoder().encode(str);

  const stream = new Blob([buf]).stream().pipeThrough(new CompressionStream('gzip'));

  const compressedBuf = await new Response(stream).arrayBuffer();

  // 替换特殊符号保证可以作为URL参数
  return btoa(String.fromCharCode(...new Uint8Array(compressedBuf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function decompressGzip(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }

  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const decompressedResponse = new Response(stream);
  const decompressedStr = await decompressedResponse.text();

  return decompressedStr;
}
