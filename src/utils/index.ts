export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const formatPhone = (phone: string): string => {
  return phone.replace(/\D/g, '').slice(0, 11);
};
