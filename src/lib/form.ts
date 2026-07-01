export function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export function formFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File ? value : null;
}

export function orderedValues(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value));
}
