export async function handleSubmit<T>(
  apiCall: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
  }
): Promise<T> {
  try {
    const data = await apiCall();
    options?.onSuccess?.(data);
    return data;
  } catch (error) {
    options?.onError?.(error);
    throw error;
  }
}
