import * as readline from "readline";

export function getHumanInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function confirmContinue(): Promise<boolean> {
  const answer = await getHumanInput("Do you want to continue? (y/n) ");
  return answer.toLowerCase() === "y";
}
