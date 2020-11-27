const path = require("path");
const fs = require("fs");
const parseMD = require("parse-md").default;
const globby = require("globby");

const glossaryHeader = `---
id: glossary
title: Glossary
---`;

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

async function getFiles(basePath, noParseFiles, noThrow=false) {
  // Added the noThrow optional param
  // in case there is a call to this
  // function that does not want to
  // handle the error thrown
  let files = [];
  // get all files under dir
  try {
    // get all md files from basePath
    files = await globby(basePath+"**/*.{md,mdx}");
  } catch (err) {
    if (noThrow) {
      // handle error here
    } else {
      throw err;
    }
  };
  // filter with the noParseFiles option and return
  return files.diff(noParseFiles);
}

async function preloadTerms(termsFiles) {
  let terms = [];
  for (const term of termsFiles) {
    let fileContent = "";
    try {
      fileContent = await fs.promises.readFile(term, "utf8");
    } catch (err) {
      (err.code === 'ENOENT') ?
      console.log(`File ${term} not found.`) :
      console.log(`${err}\nExiting...`);
      process.exit(1);
    }
    let { metadata } = parseMD(fileContent);
    if (!metadata.id) {
      console.log(`! The term "${term}" lacks the attribute "id" and so is ` +
        `excluded from the term parsing functionality.`);
    } else {
      if (!metadata.hoverText || metadata.hoverText.length == 0) {
        console.log(`! The term "${term}" lacks the attribute "hoverText", ` +
          `so no popup text will be shown.`);
      }
      const data = {
        content: fileContent,
        filepath:  term,
        hoverText: metadata.hoverText || "",
        id: metadata.id,
        title: metadata.title || ""
      }
      terms.push(data);
    }
  }
  return terms;
}

function getCleanTokens(match, separator) {
  let tokens = match.split(separator);
  // remove file extension, if present
  tokens[1] = tokens[1].replace(/\.[^/.]+$/, "");
  tokens.forEach((token, index) => {
    tokens[index] = token.replace(/[\%]/g, "");
  });
  return tokens;
}

function splice(cont, idx, rem, str) {
    return cont.slice(0, idx) + str + cont.slice(idx + Math.abs(rem));
}

function addJSImportStatement(content) {
  const importStatement = `\n\nimport Term ` +
  `from "@docusaurus-terminology/term";\n`;
  const index = content.indexOf("---", 1) + "---".length;
  return splice(content, index, 0, importStatement);
}

function sortFiles(files) {
  files.sort((a, b) =>
    a.title.toLowerCase() > b.title.toLowerCase()
    ? 1
    : b.title.toLowerCase() > a.title.toLowerCase()
    ? -1
    : 0
  );
}

function cleanGlossaryTerms(terms) {
  const cleanTerms = terms.filter(item => {
    return item.title && item.title.length > 0 ? true : console.log(
      `! The file ${item.filepath} lacks the attribute "title" and so is ` +
      `excluded from the glossary.`);
  });
  // handle debug case here
  return cleanTerms;
}

function getGlossaryTerm(term, path) {
  const hover = term.hoverText != undefined ? term.hoverText : "";
  return hover.length > 0 ?
    `\n\n- **[${term.title}](${path})**: ${hover}\n` :
    `\n\n- **[${term.title}](${path})**`;
}

function getOrCreateGlossaryFile(path) {
  let fileContent = "";
  // TODO: Replace with async fs function
  if(!fs.existsSync(path)) {
    console.log(`! Glossary file does not exist in path: "${path}". Creating...`);
    fileContent = glossaryHeader;
    // TODO: Replace with async fs function
    fs.writeFileSync(path, fileContent, "utf8",
      (error) => { if (error) throw error; });
  } else {
    // keep only the header of file
    // TODO: Replace with async fs function
    const content = fs.readFileSync(path, "utf8", (err, data) => {
      console.log(err);
    });
    const index = content.indexOf("---", 1) + "---".length;
    fileContent = content.slice(0,index);
  }
  return fileContent;
}

function getRelativePath(source, target) {
  // calculate relative path from each file's parent dir
  const sourceDir = source.substr(0, source.lastIndexOf("/"));
  const targetDir = target.substr(0, target.lastIndexOf("/"));
  const relative_url = path.relative(sourceDir, targetDir);
  // construct the final url by appending the target's filename
  // if the relative url is empty, it means that the referenced
  // term is in the same dir, so add a `.`
  let final_url = relative_url === ""
    ? "." + target.substr(target.lastIndexOf("/"))
    : relative_url + target.substr(target.lastIndexOf("/"));
    //  remove .mdx suffix
  return final_url.replace(/(\.mdx?)/g, "")
}

module.exports = {
  getFiles: getFiles,
  getRelativePath: getRelativePath,
  getCleanTokens: getCleanTokens,
  preloadTerms: preloadTerms,
  addJSImportStatement: addJSImportStatement,
  sortFiles: sortFiles,
  cleanGlossaryTerms: cleanGlossaryTerms,
  getGlossaryTerm: getGlossaryTerm,
  getOrCreateGlossaryFile: getOrCreateGlossaryFile
};
