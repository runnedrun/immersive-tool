export const replaceTemplate = (
  startingTemplate: string,
  allVariablesAvailable: Record<string, string>
) => {
  const allVariableNames = Object.keys(allVariablesAvailable);

  return allVariableNames.reduce((acc, variableName) => {
    return acc.replace(
      new RegExp(`{{${variableName}}}`, "g"),
      allVariablesAvailable[variableName]
    );
  }, startingTemplate);
};
