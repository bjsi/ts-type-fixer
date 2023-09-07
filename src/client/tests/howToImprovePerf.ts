import * as fs from "fs";

const file =
  "/home/james/Projects/TS/type-fixer/src/client/runs/2023-09-05T13:25:55.784Z.json";
const exampleRun = fs.readFileSync(file, "utf8");

const prompt = `
Look at the history of the interaction between the user and assistant. They were trying to fix a type error in a TypeScript code base. 

In this case the error was actually caused by a typo - TrackerProps should have extended FocusableComponentContainerTrackerProps instead of FocusableComponentContainerProps. What things could be changed to improve the assistant's type error fixing performance?

export interface FocusableComponentContainerTrackerProps
  extends FocusableComponentContainerProps {
  isInFocus?: boolean;
  isInFocusOrHasChildInFocus: boolean;
  getFocusProps?: () => any;
  getFocusedElementId?: () => ComponentFocusId;
  takeFocus: (focusProps?: any) => void;
  focusProps?: any;
}

export function FocusableComponentContainer<
  ExternalProps extends FocusableComponentContainerProps,
  TrackerProps extends ExternalProps &
    Partial<FocusableComponentContainerProps>,
  State = any,
>(
  component:
    | {
        new (props: TrackerProps, state: State): Component<TrackerProps, State>;
      }
    | {
        new (props: TrackerProps): Component<TrackerProps>;
      }
    | { new (): Element | Component }
    | ((props: TrackerProps) => JSX.Element | null)
    | React.ForwardRefExoticComponent<TrackerProps>
    | React.MemoExoticComponent<React.ComponentType<TrackerProps>>,
  extraPropsFn?: (
    props: ExternalProps,
  ) => Omit<
    TrackerProps,
    keyof ExternalProps | keyof FocusableComponentContainerTrackerProps
  >,
  banDuplicateMounting = false,
) {


`;
