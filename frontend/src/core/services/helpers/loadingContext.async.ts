import { LoadingContext } from "./loading-context";

export async function wrapAsync<T>(
  loader: LoadingContext,
  fn: () => Promise<T>
): Promise<T> {
  loader.start();
  try {
    const res = await fn();
    loader.success();
    return res;
  } catch (err: any) {
    loader.error(err?.message ?? "Failed");
    throw err;
  }
}
