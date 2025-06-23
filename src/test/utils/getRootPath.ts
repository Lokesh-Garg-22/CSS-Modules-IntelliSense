const getRootPath = () => {
  const testDir = "dist";
  const path = __dirname.split("/");

  while (path[path.length - 1] !== testDir) {
    path.pop();
  }
  path.pop();

  return path.join("/");
};

export default getRootPath;
