import { setGlobalFunctionObservers } from "modelfusion";
import dotenv from "dotenv";
import { loggingObserver } from "./logging";
import { fixNextTypeError } from "./fixTypeError";
import { trpc } from "./trpc";

dotenv.config();
setGlobalFunctionObservers([loggingObserver]);

const main = async () => {
  const args = process.argv.slice(2);
  const mode =
    args.length === 0 ? "real" : args[0] === "test" ? "test" : undefined;
  if (!mode) {
    console.log("Invalid mode");
    return;
  }

  console.log("Running in " + mode + " mode");
  if (mode === "test") {
    const test = "used-wrong-interface";
    await trpc.initTestProject.query({
      directory: test,
    });
    await fixNextTypeError({
      startFile: "main.ts",
      runLoggingEnabled: false,
    });
  } else {
    await trpc.initRealProject.query({
      sourceFiles: [
        "/home/james/Projects/TS/remnote-new/client/src/global.d.ts",
        "/home/james/Projects/TS/remnote-new/client/**/*.tsx",
        "/home/james/Projects/TS/remnote-new/client/**/*.ts",
      ],
      tsConfigFilePath:
        "/home/james/Projects/TS/remnote-new/client/tsconfig.json",
    });
    await fixNextTypeError({
      startFile:
        "/home/james/Projects/TS/remnote-new/client/src/js/api/component_focus/FocusableComponentContainer.tsx",
      runLoggingEnabled: true,
    });
  }
};

main();
