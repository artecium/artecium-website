/** Checkbox fields only submit when checked (`value="true"`). */
export function readFormCheckbox(formData: FormData, name: string): boolean {
  return formData.get(name) === "true";
}

export function readFormCheckboxWithDefault(
  formData: FormData,
  name: string,
  defaultValue: boolean,
): boolean {
  if (!formData.has(name)) return defaultValue;
  return readFormCheckbox(formData, name);
}