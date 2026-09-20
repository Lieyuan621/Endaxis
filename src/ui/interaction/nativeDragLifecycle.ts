/** Native DnD has no pointer capture: its source may disappear without a bubbling dragend. */
export function observeNativeDragLifetime(source: Element, onEnd: () => void): () => void {
  const document = source.ownerDocument;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    document.removeEventListener('dragend', dragEnd, true);
    observer.disconnect();
  };
  const finish = () => {
    if (disposed) return;
    dispose();
    onEnd();
  };
  const dragEnd = (event: Event) => {
    if (event.target === source) finish();
  };
  const observer = new MutationObserver(() => {
    // Moving the same node within the document does not cancel a drag.
    if (!source.isConnected) finish();
  });
  document.addEventListener('dragend', dragEnd, true);
  observer.observe(document, { childList: true, subtree: true });
  if (!source.isConnected) finish();
  return dispose;
}
