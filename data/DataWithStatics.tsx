import { Observable, combineLatest, isObservable } from "rxjs";

export type DataWithStatics<DataType extends Record<string, Observable<any>>> =
  {
    [key in keyof DataType]: DataType[key] extends Observable<infer T>
      ? T
      : DataType[key];
  };

export type DataWithoutStatics<
  DataType extends Record<string, Observable<any>>
> = {
  [key in keyof DataType]: DataType[key] extends Observable<infer T>
    ? T
    : never;
};

export type DataObsWithoutStatics<
  DataType extends Record<string, Observable<any>>
> = {
  [key in keyof DataType]: DataType[key] extends Observable<any>
    ? DataType[key]
    : never;
};

export const splitDataAndStatics = <DataType extends Record<string, any>>(
  dataObj: DataType
) => {
  const dataWithoutStatics = {} as Record<string, Observable<any>>;
  const statics = {} as Record<string, any>;
  Object.keys(dataObj).forEach((key) => {
    const value = dataObj[key];
    if (isObservable(value)) {
      dataWithoutStatics[key] = value;
    } else {
      statics[key] = value;
    }
  });
  const oneObs = combineLatest(dataWithoutStatics);
  return { dataObs: oneObs, statics };
};
