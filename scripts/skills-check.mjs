import { spawn } from "node:child_process";

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const invocation = process.platform === "win32"
      ? { command: "cmd", args: ["/c", command, ...args] }
      : { command, args };
    const child = spawn(invocation.command, invocation.args, {
      stdio: "inherit"
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${command} ${args.join(" ")}), exit code ${code}`));
    });
  });
}

async function main() {
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  await runCommand(npx, ["skills", "check"]);
}

main().catch((error) => {
  console.error(`skills:check failed: ${error.message}`);
  process.exit(1);
});
