import { Observable, firstValueFrom } from "rxjs";
import { DataWithoutStatics, splitDataAndStatics } from "./DataWithStatics";
import { jsonifyTimestamps } from "@/firebase/jsonifyTimestamps";

export type PassFromServerToClientProp<
  InitialValuesType extends Record<string, any>,
  ParamsType extends Record<string, any> = {}
> = {
  _initialValues: InitialValuesType;
  params: ParamsType;
};
export type ComponentWithInitialValues<
  InitialValuesType extends Record<string, any>,
  ParamsType extends Record<string, any>,
  StaticProps extends Record<string, any> = {}
> = (
  props: PassFromServerToClientProp<InitialValuesType, ParamsType> & StaticProps
) => JSX.Element;

export type DataFnType<
  DataType extends Record<string, Observable<any>>,
  ParamsType extends Record<string, any>,
  PropsType extends Record<string, any> = {}
> = (args: { params: ParamsType; props: PropsType }) => DataType;

export const component = <
  ParamType extends Record<string, any>,
  DataType extends Record<string, Observable<any>>
>(
  dataFn: DataFnType<DataType, ParamType>,
  ClientComponent: ComponentWithInitialValues<
    DataWithoutStatics<DataType>,
    ParamType
  >
) => {
  const Component = async ({ params }: { params: ParamType }) => {
    const dataObj = dataFn({ params, props: {} });
    const { dataObs } = splitDataAndStatics(dataObj);
    const data = await firstValueFrom(dataObs);
    return (
      <ClientComponent
        _initialValues={jsonifyTimestamps(data) as DataWithoutStatics<DataType>}
        params={params}
      ></ClientComponent>
    );
  };
  return Component;
};
