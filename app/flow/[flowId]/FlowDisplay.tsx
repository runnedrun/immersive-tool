"use client";

import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { withData } from "@/data/withData";
import { fbCreate, fbSet } from "@/firebase/settersFe";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import { StepDisplay } from "./StepDisplay";
import { flowDataFn } from "./flowDataFn";
import { getAllDefinedVariablesForSteps } from "./getAllDefinedVariablesForSteps";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { ToastContainer, toast } from "react-toastify";

import { ChevronLeft as ChevronLeftIcon } from "@mui/icons-material";
import MenuIcon from "@mui/icons-material/Menu";
import {
  IconButton,
  AppBar as MuiAppBar,
  AppBarProps as MuiAppBarProps,
  Toolbar,
} from "@mui/material";
import Drawer from "@mui/material/Drawer";
import { styled } from "@mui/material/styles";
import { TestFunctionPanel } from "./TestFunctionPanel";
import { Step } from "@/models/types/Step";
import { Flow } from "@/models/types/Flow";
import { isServerside } from "@/lib/isServerSide";
import { FlowIdentifierDisplay } from "./FlowIdentifierDisplay";
import { GlobalVariableDisplay } from "./VariableDisplay";

const drawerWidth = 450;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `0`,
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: `${drawerWidth}px`,
  }),
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const NewStepButton = ({
  indexOfPrevStep,
  steps,
  flow,
}: {
  indexOfPrevStep: number;
  steps: Step[];
  flow: Flow;
}) => {
  return (
    <div className="flex justify-center">
      <Button
        className={"my-4 w-24"}
        onClick={() => {
          const newStep = {
            flowKey: flow.uid,
            title: "New Step",
            index: indexOfPrevStep + 1,
            variableCollectionInstructions: null,
            template: "",
            outputVariableDescriptions: null,
            responseDescription: null,
            variableDescriptions: null,
          } as Step;
          const newSteps = [...steps];
          newSteps.splice(indexOfPrevStep + 1, 0, newStep);
          newSteps.map((step, i) => {
            if (i === indexOfPrevStep + 1) {
              fbCreate("step", {
                flowKey: flow.uid,
                title: "New Step",
                index: i,
                variableCollectionInstructions: null,
                template: "",
                outputVariableDescriptions: null,
                responseDescription: null,
                variableDescriptions: null,
              });
            } else {
              fbSet("step", step.uid, { index: i });
            }
          });
        }}
      >
        <PlusIcon></PlusIcon> Step
      </Button>
    </div>
  );
};

export const FlowDisplay = withData(flowDataFn, ({ data: { flow, steps } }) => {
  const [isOpen, setOpen] = useState(false);
  return (
    <div>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setOpen(!isOpen)}
            edge="start"
            sx={{ mr: 2, ...(isOpen && { display: "none" }) }}
          >
            <MenuIcon />
          </IconButton>
          <div>Immerse</div>
        </Toolbar>
      </AppBar>
      <Drawer
        className="relative h-full"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={isOpen}
      >
        <DrawerHeader>
          <IconButton onClick={() => setOpen(false)}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <TestFunctionPanel flowId={flow.uid}></TestFunctionPanel>
      </Drawer>
      <Main open={isOpen}>
        <div className="flex w-full justify-center mt-20 relative">
          <div className="flex-col flex gap-6">
            <div className="w-[40rem] flex flex-col gap-3 p-3 bg-zinc-100 shadow-lg rounded-md">
              <div>Global Variables:</div>
              <GlobalVariableDisplay flow={flow}></GlobalVariableDisplay>
            </div>
            <div className="w-[40rem] flex flex-col gap-3 p-3 bg-zinc-100 shadow-lg rounded-md">
              <div className="text-lg w-full">
                <div className="bg-gray-200 p-2 rounded-md flex justify-between items-center">
                  <div>Flow:</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div>
                      <Button target="_blank" href={`/history/${flow.uid}`}>
                        History
                      </Button>
                    </div>
                    <div>
                      {
                        <CopyToClipboard
                          text={
                            isServerside()
                              ? "loading..."
                              : new URL(`/start/${flow.uid}`, document.baseURI)
                                  .href
                          }
                          onCopy={() => toast("Copied")}
                        >
                          <Button>Copy Start Link</Button>
                        </CopyToClipboard>
                      }
                    </div>
                    <div>
                      <Button
                        target="_blank"
                        href={`/start/${flow.uid}?debug=true`}
                      >
                        Open with Debug Mode
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Field>
                    <Label>Title</Label>
                    <Input
                      className={"border-none"}
                      value={flow.title || ""}
                      onChange={(e) => {
                        fbSet("flow", flow.uid, { title: e.target.value });
                      }}
                    ></Input>
                  </Field>
                  <Field>
                    <Label>Flow Run Identifier (Optional)</Label>
                    <FlowIdentifierDisplay
                      flow={flow}
                      steps={steps}
                    ></FlowIdentifierDisplay>
                  </Field>
                </div>
                <div>
                  <Field>
                    <Label>
                      AI Name (Defaults to {'"'}AI{'"'})
                    </Label>
                    <Input
                      className={"border-none"}
                      value={flow.aiName || ""}
                      placeholder="AI Helper"
                      onChange={(e) => {
                        fbSet("flow", flow.uid, { aiName: e.target.value });
                      }}
                    ></Input>
                  </Field>
                </div>
                <div>
                  <Field>
                    <Label>Description</Label>
                    <Input
                      className={"border-none"}
                      value={flow.description || ""}
                      onChange={(e) => {
                        fbSet("flow", flow.uid, {
                          description: e.target.value,
                        });
                      }}
                    ></Input>
                  </Field>
                </div>
                <div>
                  <Field>
                    <Label>Introduction Message</Label>
                    <Input
                      className={"border-none"}
                      value={flow.introductionMessage || ""}
                      onChange={(e) => {
                        fbSet("flow", flow.uid, {
                          introductionMessage: e.target.value,
                        });
                      }}
                    ></Input>
                  </Field>
                </div>
              </div>
            </div>
            <div className="w-[40rem] flex flex-col gap-3 p-3">
              <NewStepButton
                indexOfPrevStep={-1}
                steps={steps}
                flow={flow}
              ></NewStepButton>
              <div className="flex flex-col gap-5">
                {steps.map((step, i) => {
                  const previousSteps = steps.slice(0, i);
                  const variablesFromPreviousSteps =
                    getAllDefinedVariablesForSteps(previousSteps, flow);
                  return (
                    <div key={step.uid}>
                      <StepDisplay
                        step={step}
                        variablesFromPreviousSteps={variablesFromPreviousSteps}
                        onStepDelete={(id) => {
                          steps
                            .filter((_) => _.uid !== id)
                            .map((step, i) => {
                              fbSet("step", step.uid, { index: i });
                            });
                        }}
                      ></StepDisplay>
                      <NewStepButton
                        indexOfPrevStep={i}
                        steps={steps}
                        flow={flow}
                      ></NewStepButton>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Main>
    </div>
  );
});
