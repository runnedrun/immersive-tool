declare module "batch-promises" {
  export default function batchPromises<T>(
    batchSize: number,
    listToProcess: T[],
    process: (entry: T) => Promise<any>
  ): Promise<any>;
}
