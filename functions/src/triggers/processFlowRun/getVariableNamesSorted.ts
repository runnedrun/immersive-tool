import { VariableData } from "@/models/types/Step";
import { sortBy } from "lodash";

export const getVariableNamesSorted = (
  variables: Record<string, VariableData>
) => {
  const variarblesToCollect = Object.keys(variables);

  return sortBy(variarblesToCollect, (_) => variables[_].createdAt.toMillis());
};
