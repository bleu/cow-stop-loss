export function preventNegativeKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
) {
  if (e.key === "-") {
    e.preventDefault();
  }
}

export function pasteAbsoluteValue(e: React.ClipboardEvent<HTMLInputElement>) {
  e.preventDefault();
  const pastedText = e.clipboardData.getData("text");
  const numericValue = parseFloat(pastedText);

  if (!isNaN(numericValue)) {
    const absoluteValue = Math.abs(numericValue);
    const input = e.target as HTMLInputElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = input.value;
    const newValue =
      currentValue.substring(0, start) +
      absoluteValue +
      currentValue.substring(end);
    input.value = newValue;

    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
