/** Windows commonly has python3 as a Store alias rather than an interpreter. */
export function pythonCommand() {
  return (
    process.env.RNAS_PYTHON ||
    (process.platform === "win32" ? "python" : "python3")
  );
}
