// Handle paste image into note editor
export function paste(view: any, event: any) {
  // USED when we paste image from clipboard
  let hasFiles = false;
  const reader = new FileReader();
  reader.onload = function (event) {
    const imageUrl = event?.target?.result;
    const node = view.state.schema.nodes.image.create({ src: imageUrl });
    const transaction = view.state.tr.replaceSelectionWith(node);
    view.dispatch(transaction);
  };

  Array.from(event?.clipboardData?.files)
    .filter((item: any) => item.type.startsWith('image'))
    .forEach((item: any) => {
      reader.readAsDataURL(item);
      hasFiles = true;
    });

  if (hasFiles) {
    event.preventDefault();
    return true;
  }
}
