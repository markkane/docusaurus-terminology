import 'regenerator-runtime/runtime';

const path = require('path');
const {
  addJSImportStatement,
  getRelativePath,
  getCleanTokens,
  getFiles,
  preloadTerms
} = require('../src/lib.js');

describe('get relative path', () => {
    const source = '/docs/file1.md';
    const target = '/docs/dir/file2.md';
    const path = getRelativePath(source, target);
    it('finds the file', () => {
      expect(path).toBe('dir/file2');
    });
});


describe('add import statement', () => {
    const content = '--- id: hospitality ---';
    var newContent = addJSImportStatement(content);
    it('gets the updated content with the import statement', () => {
      expect(newContent).toBe(content
        + '\n\nimport Term from "@docusaurus-terminology/term";\n');
    });
});

describe('add import statement in empty file', () => {
    const content = '';
    var newContent = addJSImportStatement(content);
    it('gets the updated content with the import statement', () => {
      expect(newContent).toBe(content
        + '\n\nimport Term from "@docusaurus-terminology/term";\n');
    });
});


describe('get the term name and reference from the regex match', () => {
    const matchPattern = '%%Term name$term%%';
    const separator = '$';
    var tokens = getCleanTokens(matchPattern, separator);
    it('the clean tokens', () => {
      expect(tokens).toStrictEqual(['Term name', 'term']);
    });
});

describe('get the term name and reference (without the file extension)', () => {
    const matchPattern = '%%Mr.Doe$term.md%%';
    const separator = '$';
    var tokens = getCleanTokens(matchPattern, separator);
    it('the clean tokens', () => {
      expect(tokens).toStrictEqual(['Mr.Doe', 'term']);
    });
});

// async functions
it('get list of files to parse', async () => {
  const basePath = './packages/parser/__tests__/test_docs/';
  const excludeList = ['./packages/parser/__tests__/test_docs/exclude.md'];
  const files = await getFiles(basePath, excludeList);
  expect(files.length).toEqual(2);
});


it('get list of terms', async () => {
  const basePath = './packages/parser/__tests__/test_docs/';
  const files = await getFiles(basePath, []);
  const terms = await preloadTerms(files);
  expect(terms.length).toEqual(2);
});
