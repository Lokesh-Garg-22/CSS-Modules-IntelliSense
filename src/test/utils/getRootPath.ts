import * as path from "path";

const getRootPath = () => {
  const testDir = "dist";
  let dir = __dirname;

  while (path.basename(dir) !== testDir) {
    dir = path.dirname(dir);
  }

  return path.dirname(dir);
};

export default getRootPath;
