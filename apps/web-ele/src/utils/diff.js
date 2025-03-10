// utils/diff.js
import * as Diff from 'diff';

/**
 * 比较两段HTML内容并返回带有差异标记的HTML
 * @param {string} oldHtml 旧版本HTML内容
 * @param {string} newHtml 新版本HTML内容
 * @returns {string} 带有差异标记的HTML
 */
export function diffHtml(oldHtml, newHtml) {
  const diff = Diff.diffWords(oldHtml, newHtml, { ignoreWhitespace: true });
  let result = '';
  diff.forEach((part) => {
    // 添加或删除的部分添加相应标记
    if (part.added) {
      result += `<ins style="background:#e6ffe6">${part.value}</ins>`;
    } else if (part.removed) {
      result += `<del style="background:#ffe6e6">${part.value}</del>`;
    } else {
      result += part.value;
    }
  });

  return result;
}

/**
 * 比较两段纯文本内容并返回带有差异标记的HTML
 * @param {string} oldText 旧版本文本内容
 * @param {string} newText 新版本文本内容
 * @returns {string} 带有差异标记的HTML
 */
export function diffText(oldText, newText) {
  const diff = Diff.diffLines(oldText, newText, { ignoreWhitespace: true });

  let result = '';
  diff.forEach((part) => {
    if (part.added) {
      result += `<ins style="background:#e6ffe6">${part.value}</ins>`;
    } else if (part.removed) {
      result += `<del style="background:#ffe6e6">${part.value}</del>`;
    } else {
      result += part.value;
    }
  });

  return result;
}
