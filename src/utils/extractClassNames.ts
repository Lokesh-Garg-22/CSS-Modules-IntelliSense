import * as fs from "fs";
import safeParser from "postcss-safe-parser";

const extractClassNames = async (filePath: string): Promise<string[]> => {
  const content = fs.readFileSync(filePath, "utf-8");
  const root = safeParser(content);
  const names = new Set<string>();

  root.walkRules((rule) => {
    const matches = rule.selector.match(/\.(\w[\w-]*)/g);
    if (matches) {
      matches.forEach((m) => names.add(m.slice(1)));
    }
  });

  return Array.from(names);
};

export default extractClassNames;
