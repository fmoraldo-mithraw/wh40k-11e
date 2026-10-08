// GÉNÉRÉ — ne pas éditer. Copie autonome du parser de cogitator-bellicum
// (scripts/bsdata-parser.mjs + dépendances), repli de build-map.mjs.
// Régénérer : editor/mfm/vendor/sync-parser.sh
// source-commit: 2300e4b
// source-sha256: 8b8248e4d9ccd90c
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/fast-xml-parser/src/util.js
var require_util = __commonJS({
  "node_modules/fast-xml-parser/src/util.js"(exports) {
    "use strict";
    var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
    var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
    var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
    var regexName = new RegExp("^" + nameRegexp + "$");
    var getAllMatches = function(string, regex) {
      const matches = [];
      let match = regex.exec(string);
      while (match) {
        const allmatches = [];
        allmatches.startIndex = regex.lastIndex - match[0].length;
        const len = match.length;
        for (let index = 0; index < len; index++) {
          allmatches.push(match[index]);
        }
        matches.push(allmatches);
        match = regex.exec(string);
      }
      return matches;
    };
    var isName = function(string) {
      const match = regexName.exec(string);
      return !(match === null || typeof match === "undefined");
    };
    exports.isExist = function(v) {
      return typeof v !== "undefined";
    };
    exports.isEmptyObject = function(obj) {
      return Object.keys(obj).length === 0;
    };
    exports.merge = function(target, a, arrayMode) {
      if (a) {
        const keys = Object.keys(a);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          if (arrayMode === "strict") {
            target[keys[i]] = [a[keys[i]]];
          } else {
            target[keys[i]] = a[keys[i]];
          }
        }
      }
    };
    exports.getValue = function(v) {
      if (exports.isExist(v)) {
        return v;
      } else {
        return "";
      }
    };
    var DANGEROUS_PROPERTY_NAMES = [
      // '__proto__',
      // 'constructor',
      // 'prototype',
      "hasOwnProperty",
      "toString",
      "valueOf",
      "__defineGetter__",
      "__defineSetter__",
      "__lookupGetter__",
      "__lookupSetter__"
    ];
    var criticalProperties = ["__proto__", "constructor", "prototype"];
    exports.isName = isName;
    exports.getAllMatches = getAllMatches;
    exports.nameRegexp = nameRegexp;
    exports.DANGEROUS_PROPERTY_NAMES = DANGEROUS_PROPERTY_NAMES;
    exports.criticalProperties = criticalProperties;
  }
});

// node_modules/fast-xml-parser/src/validator.js
var require_validator = __commonJS({
  "node_modules/fast-xml-parser/src/validator.js"(exports) {
    "use strict";
    var util = require_util();
    var defaultOptions = {
      allowBooleanAttributes: false,
      //A tag can have attributes without any value
      unpairedTags: []
    };
    exports.validate = function(xmlData, options) {
      options = Object.assign({}, defaultOptions, options);
      const tags = [];
      let tagFound = false;
      let reachedRoot = false;
      if (xmlData[0] === "\uFEFF") {
        xmlData = xmlData.substr(1);
      }
      for (let i = 0; i < xmlData.length; i++) {
        if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
          i += 2;
          i = readPI(xmlData, i);
          if (i.err) return i;
        } else if (xmlData[i] === "<") {
          let tagStartPos = i;
          i++;
          if (xmlData[i] === "!") {
            i = readCommentAndCDATA(xmlData, i);
            continue;
          } else {
            let closingTag = false;
            if (xmlData[i] === "/") {
              closingTag = true;
              i++;
            }
            let tagName = "";
            for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) {
              tagName += xmlData[i];
            }
            tagName = tagName.trim();
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substring(0, tagName.length - 1);
              i--;
            }
            if (!validateTagName(tagName)) {
              let msg;
              if (tagName.trim().length === 0) {
                msg = "Invalid space after '<'.";
              } else {
                msg = "Tag '" + tagName + "' is an invalid name.";
              }
              return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
            }
            const result = readAttributeStr(xmlData, i);
            if (result === false) {
              return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
            }
            let attrStr = result.value;
            i = result.index;
            if (attrStr[attrStr.length - 1] === "/") {
              const attrStrStart = i - attrStr.length;
              attrStr = attrStr.substring(0, attrStr.length - 1);
              const isValid = validateAttributeString(attrStr, options);
              if (isValid === true) {
                tagFound = true;
              } else {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
              }
            } else if (closingTag) {
              if (!result.tagClosed) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
              } else if (attrStr.trim().length > 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
              } else if (tags.length === 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
              } else {
                const otg = tags.pop();
                if (tagName !== otg.tagName) {
                  let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
                  return getErrorObject(
                    "InvalidTag",
                    "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                    getLineNumberForPosition(xmlData, tagStartPos)
                  );
                }
                if (tags.length == 0) {
                  reachedRoot = true;
                }
              }
            } else {
              const isValid = validateAttributeString(attrStr, options);
              if (isValid !== true) {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
              }
              if (reachedRoot === true) {
                return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
              } else if (options.unpairedTags.indexOf(tagName) !== -1) {
              } else {
                tags.push({ tagName, tagStartPos });
              }
              tagFound = true;
            }
            for (i++; i < xmlData.length; i++) {
              if (xmlData[i] === "<") {
                if (xmlData[i + 1] === "!") {
                  i++;
                  i = readCommentAndCDATA(xmlData, i);
                  continue;
                } else if (xmlData[i + 1] === "?") {
                  i = readPI(xmlData, ++i);
                  if (i.err) return i;
                } else {
                  break;
                }
              } else if (xmlData[i] === "&") {
                const afterAmp = validateAmpersand(xmlData, i);
                if (afterAmp == -1)
                  return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
                i = afterAmp;
              } else {
                if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
                  return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
                }
              }
            }
            if (xmlData[i] === "<") {
              i--;
            }
          }
        } else {
          if (isWhiteSpace(xmlData[i])) {
            continue;
          }
          return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
        }
      }
      if (!tagFound) {
        return getErrorObject("InvalidXml", "Start tag expected.", 1);
      } else if (tags.length == 1) {
        return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
      } else if (tags.length > 0) {
        return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
      }
      return true;
    };
    function isWhiteSpace(char) {
      return char === " " || char === "	" || char === "\n" || char === "\r";
    }
    function readPI(xmlData, i) {
      const start = i;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] == "?" || xmlData[i] == " ") {
          const tagname = xmlData.substr(start, i - start);
          if (i > 5 && tagname === "xml") {
            return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
          } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
            i++;
            break;
          } else {
            continue;
          }
        }
      }
      return i;
    }
    function readCommentAndCDATA(xmlData, i) {
      if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
        for (i += 3; i < xmlData.length; i++) {
          if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
            i += 2;
            break;
          }
        }
      } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
        let angleBracketsCount = 1;
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            angleBracketsCount++;
          } else if (xmlData[i] === ">") {
            angleBracketsCount--;
            if (angleBracketsCount === 0) {
              break;
            }
          }
        }
      } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
            i += 2;
            break;
          }
        }
      }
      return i;
    }
    var doubleQuote = '"';
    var singleQuote = "'";
    function readAttributeStr(xmlData, i) {
      let attrStr = "";
      let startChar = "";
      let tagClosed = false;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
          if (startChar === "") {
            startChar = xmlData[i];
          } else if (startChar !== xmlData[i]) {
          } else {
            startChar = "";
          }
        } else if (xmlData[i] === ">") {
          if (startChar === "") {
            tagClosed = true;
            break;
          }
        }
        attrStr += xmlData[i];
      }
      if (startChar !== "") {
        return false;
      }
      return {
        value: attrStr,
        index: i,
        tagClosed
      };
    }
    var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
    function validateAttributeString(attrStr, options) {
      const matches = util.getAllMatches(attrStr, validAttrStrRegxp);
      const attrNames = {};
      for (let i = 0; i < matches.length; i++) {
        if (matches[i][1].length === 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] !== void 0 && matches[i][4] === void 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) {
          return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
        }
        const attrName = matches[i][2];
        if (!validateAttrName(attrName)) {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
        }
        if (!attrNames.hasOwnProperty(attrName)) {
          attrNames[attrName] = 1;
        } else {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
        }
      }
      return true;
    }
    function validateNumberAmpersand(xmlData, i) {
      let re = /\d/;
      if (xmlData[i] === "x") {
        i++;
        re = /[\da-fA-F]/;
      }
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === ";")
          return i;
        if (!xmlData[i].match(re))
          break;
      }
      return -1;
    }
    function validateAmpersand(xmlData, i) {
      i++;
      if (xmlData[i] === ";")
        return -1;
      if (xmlData[i] === "#") {
        i++;
        return validateNumberAmpersand(xmlData, i);
      }
      let count = 0;
      for (; i < xmlData.length; i++, count++) {
        if (xmlData[i].match(/\w/) && count < 20)
          continue;
        if (xmlData[i] === ";")
          break;
        return -1;
      }
      return i;
    }
    function getErrorObject(code, message, lineNumber) {
      return {
        err: {
          code,
          msg: message,
          line: lineNumber.line || lineNumber,
          col: lineNumber.col
        }
      };
    }
    function validateAttrName(attrName) {
      return util.isName(attrName);
    }
    function validateTagName(tagname) {
      return util.isName(tagname);
    }
    function getLineNumberForPosition(xmlData, index) {
      const lines = xmlData.substring(0, index).split(/\r?\n/);
      return {
        line: lines.length,
        // column number is last line's length + 1, because column numbering starts at 1:
        col: lines[lines.length - 1].length + 1
      };
    }
    function getPositionFromMatch(match) {
      return match.startIndex + match[1].length;
    }
  }
});

// node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
var require_OptionsBuilder = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js"(exports) {
    var { DANGEROUS_PROPERTY_NAMES, criticalProperties } = require_util();
    var defaultOnDangerousProperty = (name) => {
      if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
        return "__" + name;
      }
      return name;
    };
    var defaultOptions = {
      preserveOrder: false,
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      removeNSPrefix: false,
      // remove NS from tag name or attribute name if true
      allowBooleanAttributes: false,
      //a tag can have attributes without any value
      //ignoreRootElement : false,
      parseTagValue: true,
      parseAttributeValue: false,
      trimValues: true,
      //Trim string values of tag and attributes
      cdataPropName: false,
      numberParseOptions: {
        hex: true,
        leadingZeros: true,
        eNotation: true
      },
      tagValueProcessor: function(tagName, val) {
        return val;
      },
      attributeValueProcessor: function(attrName, val) {
        return val;
      },
      stopNodes: [],
      //nested tags will not be parsed even for errors
      alwaysCreateTextNode: false,
      isArray: () => false,
      commentPropName: false,
      unpairedTags: [],
      processEntities: true,
      htmlEntities: false,
      ignoreDeclaration: false,
      ignorePiTags: false,
      transformTagName: false,
      transformAttributeName: false,
      updateTag: function(tagName, jPath, attrs) {
        return tagName;
      },
      // skipEmptyListItem: false
      captureMetaData: false,
      maxNestedTags: 100,
      strictReservedNames: true,
      onDangerousProperty: defaultOnDangerousProperty
    };
    function validatePropertyName(propertyName, optionName) {
      if (typeof propertyName !== "string") {
        return;
      }
      const normalized = propertyName.toLowerCase();
      if (DANGEROUS_PROPERTY_NAMES.some((dangerous) => normalized === dangerous.toLowerCase())) {
        throw new Error(
          `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
        );
      }
      if (criticalProperties.some((dangerous) => normalized === dangerous.toLowerCase())) {
        throw new Error(
          `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
        );
      }
    }
    function normalizeProcessEntities(value) {
      if (typeof value === "boolean") {
        return {
          enabled: value,
          // true or false
          maxEntitySize: 1e4,
          maxExpansionDepth: 10,
          maxTotalExpansions: 1e3,
          maxExpandedLength: 1e5,
          allowedTags: null,
          tagFilter: null
        };
      }
      if (typeof value === "object" && value !== null) {
        return {
          enabled: value.enabled !== false,
          maxEntitySize: Math.max(1, value.maxEntitySize ?? 1e4),
          maxExpansionDepth: Math.max(1, value.maxExpansionDepth ?? 1e4),
          maxTotalExpansions: Math.max(1, value.maxTotalExpansions ?? Infinity),
          maxExpandedLength: Math.max(1, value.maxExpandedLength ?? 1e5),
          maxEntityCount: Math.max(1, value.maxEntityCount ?? 1e3),
          allowedTags: value.allowedTags ?? null,
          tagFilter: value.tagFilter ?? null
        };
      }
      return normalizeProcessEntities(true);
    }
    var buildOptions = function(options) {
      const built = Object.assign({}, defaultOptions, options);
      const propertyNameOptions = [
        { value: built.attributeNamePrefix, name: "attributeNamePrefix" },
        { value: built.attributesGroupName, name: "attributesGroupName" },
        { value: built.textNodeName, name: "textNodeName" },
        { value: built.cdataPropName, name: "cdataPropName" },
        { value: built.commentPropName, name: "commentPropName" }
      ];
      for (const { value, name } of propertyNameOptions) {
        if (value) {
          validatePropertyName(value, name);
        }
      }
      if (built.onDangerousProperty === null) {
        built.onDangerousProperty = defaultOnDangerousProperty;
      }
      built.processEntities = normalizeProcessEntities(built.processEntities);
      return built;
    };
    exports.buildOptions = buildOptions;
    exports.defaultOptions = defaultOptions;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
var require_xmlNode = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/xmlNode.js"(exports, module) {
    "use strict";
    var XmlNode = class {
      constructor(tagname) {
        this.tagname = tagname;
        this.child = [];
        this[":@"] = {};
      }
      add(key, val) {
        if (key === "__proto__") key = "#__proto__";
        this.child.push({ [key]: val });
      }
      addChild(node) {
        if (node.tagname === "__proto__") node.tagname = "#__proto__";
        if (node[":@"] && Object.keys(node[":@"]).length > 0) {
          this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
        } else {
          this.child.push({ [node.tagname]: node.child });
        }
      }
    };
    module.exports = XmlNode;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
var require_DocTypeReader = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js"(exports, module) {
    var util = require_util();
    var DocTypeReader = class {
      constructor(options) {
        this.suppressValidationErr = !options;
        this.options = options || {};
      }
      readDocType(xmlData, i) {
        const entities = /* @__PURE__ */ Object.create(null);
        let entityCount = 0;
        if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
          i = i + 9;
          let angleBracketsCount = 1;
          let hasBody = false, comment = false;
          let exp = "";
          for (; i < xmlData.length; i++) {
            if (xmlData[i] === "<" && !comment) {
              if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
                i += 7;
                let entityName, val;
                [entityName, val, i] = this.readEntityExp(xmlData, i + 1, this.suppressValidationErr);
                if (val.indexOf("&") === -1) {
                  if (this.options.enabled !== false && this.options.maxEntityCount != null && entityCount >= this.options.maxEntityCount) {
                    throw new Error(
                      `Entity count (${entityCount + 1}) exceeds maximum allowed (${this.options.maxEntityCount})`
                    );
                  }
                  const escaped = entityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                  entities[entityName] = {
                    regx: RegExp(`&${escaped};`, "g"),
                    val
                  };
                  entityCount++;
                }
              } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
                i += 8;
                const { index } = this.readElementExp(xmlData, i + 1);
                i = index;
              } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) {
                i += 8;
              } else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
                i += 9;
                const { index } = this.readNotationExp(xmlData, i + 1, this.suppressValidationErr);
                i = index;
              } else if (hasSeq(xmlData, "!--", i)) {
                comment = true;
              } else {
                throw new Error(`Invalid DOCTYPE`);
              }
              angleBracketsCount++;
              exp = "";
            } else if (xmlData[i] === ">") {
              if (comment) {
                if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
                  comment = false;
                  angleBracketsCount--;
                }
              } else {
                angleBracketsCount--;
              }
              if (angleBracketsCount === 0) {
                break;
              }
            } else if (xmlData[i] === "[") {
              hasBody = true;
            } else {
              exp += xmlData[i];
            }
          }
          if (angleBracketsCount !== 0) {
            throw new Error(`Unclosed DOCTYPE`);
          }
        } else {
          throw new Error(`Invalid Tag instead of DOCTYPE`);
        }
        return { entities, i };
      }
      readEntityExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let entityName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
          entityName += xmlData[i];
          i++;
        }
        validateEntityName(entityName);
        i = skipWhitespace(xmlData, i);
        if (!this.suppressValidationErr) {
          if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
            throw new Error("External entities are not supported");
          } else if (xmlData[i] === "%") {
            throw new Error("Parameter entities are not supported");
          }
        }
        let entityValue = "";
        [i, entityValue] = this.readIdentifierVal(xmlData, i, "entity");
        if (this.options.enabled !== false && this.options.maxEntitySize != null && entityValue.length > this.options.maxEntitySize) {
          throw new Error(
            `Entity "${entityName}" size (${entityValue.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`
          );
        }
        i--;
        return [entityName, entityValue, i];
      }
      readNotationExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let notationName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          notationName += xmlData[i];
          i++;
        }
        !this.suppressValidationErr && validateEntityName(notationName);
        i = skipWhitespace(xmlData, i);
        const identifierType = xmlData.substring(i, i + 6).toUpperCase();
        if (!this.suppressValidationErr && identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
          throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
        }
        i += identifierType.length;
        i = skipWhitespace(xmlData, i);
        let publicIdentifier = null;
        let systemIdentifier = null;
        if (identifierType === "PUBLIC") {
          [i, publicIdentifier] = this.readIdentifierVal(xmlData, i, "publicIdentifier");
          i = skipWhitespace(xmlData, i);
          if (xmlData[i] === '"' || xmlData[i] === "'") {
            [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
          }
        } else if (identifierType === "SYSTEM") {
          [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
          if (!this.suppressValidationErr && !systemIdentifier) {
            throw new Error("Missing mandatory system identifier for SYSTEM notation");
          }
        }
        return { notationName, publicIdentifier, systemIdentifier, index: --i };
      }
      readIdentifierVal(xmlData, i, type) {
        let identifierVal = "";
        const startChar = xmlData[i];
        if (startChar !== '"' && startChar !== "'") {
          throw new Error(`Expected quoted string, found "${startChar}"`);
        }
        i++;
        while (i < xmlData.length && xmlData[i] !== startChar) {
          identifierVal += xmlData[i];
          i++;
        }
        if (xmlData[i] !== startChar) {
          throw new Error(`Unterminated ${type} value`);
        }
        i++;
        return [i, identifierVal];
      }
      readElementExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let elementName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          elementName += xmlData[i];
          i++;
        }
        if (!this.suppressValidationErr && !util.isName(elementName)) {
          throw new Error(`Invalid element name: "${elementName}"`);
        }
        i = skipWhitespace(xmlData, i);
        let contentModel = "";
        if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i)) {
          i += 4;
        } else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i)) {
          i += 2;
        } else if (xmlData[i] === "(") {
          i++;
          while (i < xmlData.length && xmlData[i] !== ")") {
            contentModel += xmlData[i];
            i++;
          }
          if (xmlData[i] !== ")") {
            throw new Error("Unterminated content model");
          }
        } else if (!this.suppressValidationErr) {
          throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
        }
        return {
          elementName,
          contentModel: contentModel.trim(),
          index: i
        };
      }
      readAttlistExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let elementName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          elementName += xmlData[i];
          i++;
        }
        validateEntityName(elementName);
        i = skipWhitespace(xmlData, i);
        let attributeName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          attributeName += xmlData[i];
          i++;
        }
        if (!validateEntityName(attributeName)) {
          throw new Error(`Invalid attribute name: "${attributeName}"`);
        }
        i = skipWhitespace(xmlData, i);
        let attributeType = "";
        if (xmlData.substring(i, i + 8).toUpperCase() === "NOTATION") {
          attributeType = "NOTATION";
          i += 8;
          i = skipWhitespace(xmlData, i);
          if (xmlData[i] !== "(") {
            throw new Error(`Expected '(', found "${xmlData[i]}"`);
          }
          i++;
          let allowedNotations = [];
          while (i < xmlData.length && xmlData[i] !== ")") {
            let notation = "";
            while (i < xmlData.length && xmlData[i] !== "|" && xmlData[i] !== ")") {
              notation += xmlData[i];
              i++;
            }
            notation = notation.trim();
            if (!validateEntityName(notation)) {
              throw new Error(`Invalid notation name: "${notation}"`);
            }
            allowedNotations.push(notation);
            if (xmlData[i] === "|") {
              i++;
              i = skipWhitespace(xmlData, i);
            }
          }
          if (xmlData[i] !== ")") {
            throw new Error("Unterminated list of notations");
          }
          i++;
          attributeType += " (" + allowedNotations.join("|") + ")";
        } else {
          while (i < xmlData.length && !/\s/.test(xmlData[i])) {
            attributeType += xmlData[i];
            i++;
          }
          const validTypes = ["CDATA", "ID", "IDREF", "IDREFS", "ENTITY", "ENTITIES", "NMTOKEN", "NMTOKENS"];
          if (!this.suppressValidationErr && !validTypes.includes(attributeType.toUpperCase())) {
            throw new Error(`Invalid attribute type: "${attributeType}"`);
          }
        }
        i = skipWhitespace(xmlData, i);
        let defaultValue = "";
        if (xmlData.substring(i, i + 8).toUpperCase() === "#REQUIRED") {
          defaultValue = "#REQUIRED";
          i += 8;
        } else if (xmlData.substring(i, i + 7).toUpperCase() === "#IMPLIED") {
          defaultValue = "#IMPLIED";
          i += 7;
        } else {
          [i, defaultValue] = this.readIdentifierVal(xmlData, i, "ATTLIST");
        }
        return {
          elementName,
          attributeName,
          attributeType,
          defaultValue,
          index: i
        };
      }
    };
    var skipWhitespace = (data, index) => {
      while (index < data.length && /\s/.test(data[index])) {
        index++;
      }
      return index;
    };
    function hasSeq(data, seq, i) {
      for (let j = 0; j < seq.length; j++) {
        if (seq[j] !== data[i + j + 1]) return false;
      }
      return true;
    }
    function validateEntityName(name) {
      if (util.isName(name))
        return name;
      else
        throw new Error(`Invalid entity name ${name}`);
    }
    module.exports = DocTypeReader;
  }
});

// node_modules/strnum/strnum.js
var require_strnum = __commonJS({
  "node_modules/strnum/strnum.js"(exports, module) {
    var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
    var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
    var consider = {
      hex: true,
      // oct: false,
      leadingZeros: true,
      decimalPoint: ".",
      eNotation: true
      //skipLike: /regex/
    };
    function toNumber(str, options = {}) {
      options = Object.assign({}, consider, options);
      if (!str || typeof str !== "string") return str;
      let trimmedStr = str.trim();
      if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr)) return str;
      else if (str === "0") return 0;
      else if (options.hex && hexRegex.test(trimmedStr)) {
        return parse_int(trimmedStr, 16);
      } else if (trimmedStr.search(/[eE]/) !== -1) {
        const notation = trimmedStr.match(/^([-\+])?(0*)([0-9]*(\.[0-9]*)?[eE][-\+]?[0-9]+)$/);
        if (notation) {
          if (options.leadingZeros) {
            trimmedStr = (notation[1] || "") + notation[3];
          } else {
            if (notation[2] === "0" && notation[3][0] === ".") {
            } else {
              return str;
            }
          }
          return options.eNotation ? Number(trimmedStr) : str;
        } else {
          return str;
        }
      } else {
        const match = numRegex.exec(trimmedStr);
        if (match) {
          const sign = match[1];
          const leadingZeros = match[2];
          let numTrimmedByZeros = trimZeros(match[3]);
          if (!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".") return str;
          else if (!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".") return str;
          else if (options.leadingZeros && leadingZeros === str) return 0;
          else {
            const num = Number(trimmedStr);
            const numStr = "" + num;
            if (numStr.search(/[eE]/) !== -1) {
              if (options.eNotation) return num;
              else return str;
            } else if (trimmedStr.indexOf(".") !== -1) {
              if (numStr === "0" && numTrimmedByZeros === "") return num;
              else if (numStr === numTrimmedByZeros) return num;
              else if (sign && numStr === "-" + numTrimmedByZeros) return num;
              else return str;
            }
            if (leadingZeros) {
              return numTrimmedByZeros === numStr || sign + numTrimmedByZeros === numStr ? num : str;
            } else {
              return trimmedStr === numStr || trimmedStr === sign + numStr ? num : str;
            }
          }
        } else {
          return str;
        }
      }
    }
    function trimZeros(numStr) {
      if (numStr && numStr.indexOf(".") !== -1) {
        numStr = numStr.replace(/0+$/, "");
        if (numStr === ".") numStr = "0";
        else if (numStr[0] === ".") numStr = "0" + numStr;
        else if (numStr[numStr.length - 1] === ".") numStr = numStr.substr(0, numStr.length - 1);
        return numStr;
      }
      return numStr;
    }
    function parse_int(numStr, base) {
      if (parseInt) return parseInt(numStr, base);
      else if (Number.parseInt) return Number.parseInt(numStr, base);
      else if (window && window.parseInt) return window.parseInt(numStr, base);
      else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
    }
    module.exports = toNumber;
  }
});

// node_modules/fast-xml-parser/src/ignoreAttributes.js
var require_ignoreAttributes = __commonJS({
  "node_modules/fast-xml-parser/src/ignoreAttributes.js"(exports, module) {
    function getIgnoreAttributesFn(ignoreAttributes) {
      if (typeof ignoreAttributes === "function") {
        return ignoreAttributes;
      }
      if (Array.isArray(ignoreAttributes)) {
        return (attrName) => {
          for (const pattern of ignoreAttributes) {
            if (typeof pattern === "string" && attrName === pattern) {
              return true;
            }
            if (pattern instanceof RegExp && pattern.test(attrName)) {
              return true;
            }
          }
        };
      }
      return () => false;
    }
    module.exports = getIgnoreAttributesFn;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
var require_OrderedObjParser = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js"(exports, module) {
    "use strict";
    var util = require_util();
    var xmlNode = require_xmlNode();
    var DocTypeReader = require_DocTypeReader();
    var toNumber = require_strnum();
    var getIgnoreAttributesFn = require_ignoreAttributes();
    var OrderedObjParser = class {
      constructor(options) {
        this.options = options;
        this.currentNode = null;
        this.tagsNodeStack = [];
        this.docTypeEntities = {};
        this.lastEntities = {
          "apos": { regex: /&(apos|#39|#x27);/g, val: "'" },
          "gt": { regex: /&(gt|#62|#x3E);/g, val: ">" },
          "lt": { regex: /&(lt|#60|#x3C);/g, val: "<" },
          "quot": { regex: /&(quot|#34|#x22);/g, val: '"' }
        };
        this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
        this.htmlEntities = {
          "space": { regex: /&(nbsp|#160);/g, val: " " },
          // "lt" : { regex: /&(lt|#60);/g, val: "<" },
          // "gt" : { regex: /&(gt|#62);/g, val: ">" },
          // "amp" : { regex: /&(amp|#38);/g, val: "&" },
          // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
          // "apos" : { regex: /&(apos|#39);/g, val: "'" },
          "cent": { regex: /&(cent|#162);/g, val: "\xA2" },
          "pound": { regex: /&(pound|#163);/g, val: "\xA3" },
          "yen": { regex: /&(yen|#165);/g, val: "\xA5" },
          "euro": { regex: /&(euro|#8364);/g, val: "\u20AC" },
          "copyright": { regex: /&(copy|#169);/g, val: "\xA9" },
          "reg": { regex: /&(reg|#174);/g, val: "\xAE" },
          "inr": { regex: /&(inr|#8377);/g, val: "\u20B9" },
          "num_dec": { regex: /&#([0-9]{1,7});/g, val: (_, str) => fromCodePoint(str, 10, "&#") },
          "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => fromCodePoint(str, 16, "&#x") }
        };
        this.addExternalEntities = addExternalEntities;
        this.parseXml = parseXml;
        this.parseTextData = parseTextData;
        this.resolveNameSpace = resolveNameSpace;
        this.buildAttributesMap = buildAttributesMap;
        this.isItStopNode = isItStopNode;
        this.replaceEntitiesValue = replaceEntitiesValue;
        this.readStopNodeData = readStopNodeData;
        this.saveTextToParentTag = saveTextToParentTag;
        this.addChild = addChild;
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
        this.entityExpansionCount = 0;
        this.currentExpandedLength = 0;
        if (this.options.stopNodes && this.options.stopNodes.length > 0) {
          this.stopNodesExact = /* @__PURE__ */ new Set();
          this.stopNodesWildcard = /* @__PURE__ */ new Set();
          for (let i = 0; i < this.options.stopNodes.length; i++) {
            const stopNodeExp = this.options.stopNodes[i];
            if (typeof stopNodeExp !== "string") continue;
            if (stopNodeExp.startsWith("*.")) {
              this.stopNodesWildcard.add(stopNodeExp.substring(2));
            } else {
              this.stopNodesExact.add(stopNodeExp);
            }
          }
        }
      }
    };
    function addExternalEntities(externalEntities) {
      const entKeys = Object.keys(externalEntities);
      for (let i = 0; i < entKeys.length; i++) {
        const ent = entKeys[i];
        const escaped = ent.replace(/[.\-+*:]/g, "\\.");
        this.lastEntities[ent] = {
          regex: new RegExp("&" + escaped + ";", "g"),
          val: externalEntities[ent]
        };
      }
    }
    function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
      if (val !== void 0) {
        if (this.options.trimValues && !dontTrim) {
          val = val.trim();
        }
        if (val.length > 0) {
          if (!escapeEntities) val = this.replaceEntitiesValue(val, tagName, jPath);
          const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
          if (newval === null || newval === void 0) {
            return val;
          } else if (typeof newval !== typeof val || newval !== val) {
            return newval;
          } else if (this.options.trimValues) {
            return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
          } else {
            const trimmedVal = val.trim();
            if (trimmedVal === val) {
              return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
            } else {
              return val;
            }
          }
        }
      }
    }
    function resolveNameSpace(tagname) {
      if (this.options.removeNSPrefix) {
        const tags = tagname.split(":");
        const prefix = tagname.charAt(0) === "/" ? "/" : "";
        if (tags[0] === "xmlns") {
          return "";
        }
        if (tags.length === 2) {
          tagname = prefix + tags[1];
        }
      }
      return tagname;
    }
    var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
    function buildAttributesMap(attrStr, jPath, tagName) {
      if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
        const matches = util.getAllMatches(attrStr, attrsRegx);
        const len = matches.length;
        const attrs = {};
        for (let i = 0; i < len; i++) {
          const attrName = this.resolveNameSpace(matches[i][1]);
          if (this.ignoreAttributesFn(attrName, jPath)) {
            continue;
          }
          let oldVal = matches[i][4];
          let aName = this.options.attributeNamePrefix + attrName;
          if (attrName.length) {
            if (this.options.transformAttributeName) {
              aName = this.options.transformAttributeName(aName);
            }
            aName = sanitizeName(aName, this.options);
            if (oldVal !== void 0) {
              if (this.options.trimValues) {
                oldVal = oldVal.trim();
              }
              oldVal = this.replaceEntitiesValue(oldVal, tagName, jPath);
              const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
              if (newVal === null || newVal === void 0) {
                attrs[aName] = oldVal;
              } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
                attrs[aName] = newVal;
              } else {
                attrs[aName] = parseValue(
                  oldVal,
                  this.options.parseAttributeValue,
                  this.options.numberParseOptions
                );
              }
            } else if (this.options.allowBooleanAttributes) {
              attrs[aName] = true;
            }
          }
        }
        if (!Object.keys(attrs).length) {
          return;
        }
        if (this.options.attributesGroupName) {
          const attrCollection = {};
          attrCollection[this.options.attributesGroupName] = attrs;
          return attrCollection;
        }
        return attrs;
      }
    }
    var parseXml = function(xmlData) {
      xmlData = xmlData.replace(/\r\n?/g, "\n");
      const xmlObj = new xmlNode("!xml");
      let currentNode = xmlObj;
      let textData = "";
      let jPath = "";
      this.entityExpansionCount = 0;
      this.currentExpandedLength = 0;
      const docTypeReader = new DocTypeReader(this.options.processEntities);
      for (let i = 0; i < xmlData.length; i++) {
        const ch = xmlData[i];
        if (ch === "<") {
          if (xmlData[i + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
            let tagName = xmlData.substring(i + 2, closeIndex).trim();
            if (this.options.removeNSPrefix) {
              const colonIndex = tagName.indexOf(":");
              if (colonIndex !== -1) {
                tagName = tagName.substr(colonIndex + 1);
              }
            }
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            if (currentNode) {
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
            }
            const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
            if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
              throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
            }
            let propIndex = 0;
            if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
              propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
              this.tagsNodeStack.pop();
            } else {
              propIndex = jPath.lastIndexOf(".");
            }
            jPath = jPath.substring(0, propIndex);
            currentNode = this.tagsNodeStack.pop();
            textData = "";
            i = closeIndex;
          } else if (xmlData[i + 1] === "?") {
            let tagData = readTagExp(xmlData, i, false, "?>");
            if (!tagData) throw new Error("Pi Tag is not closed.");
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {
            } else {
              const childNode = new xmlNode(tagData.tagName);
              childNode.add(this.options.textNodeName, "");
              if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
              }
              this.addChild(currentNode, childNode, jPath, i);
            }
            i = tagData.closeIndex + 1;
          } else if (xmlData.substr(i + 1, 3) === "!--") {
            const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
            if (this.options.commentPropName) {
              const comment = xmlData.substring(i + 4, endIndex - 2);
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
              currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
            }
            i = endIndex;
          } else if (xmlData.substr(i + 1, 2) === "!D") {
            const result = docTypeReader.readDocType(xmlData, i);
            this.docTypeEntities = result.entities;
            i = result.i;
          } else if (xmlData.substr(i + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
            const tagExp = xmlData.substring(i + 9, closeIndex);
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
            if (val == void 0) val = "";
            if (this.options.cdataPropName) {
              currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
            } else {
              currentNode.add(this.options.textNodeName, val);
            }
            i = closeIndex + 2;
          } else {
            let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
            let tagName = result.tagName;
            const rawTagName = result.rawTagName;
            let tagExp = result.tagExp;
            let attrExpPresent = result.attrExpPresent;
            let closeIndex = result.closeIndex;
            if (this.options.transformTagName) {
              const newTagName = this.options.transformTagName(tagName);
              if (tagExp === tagName) {
                tagExp = newTagName;
              }
              tagName = newTagName;
            }
            if (this.options.strictReservedNames && (tagName === this.options.commentPropName || tagName === this.options.cdataPropName || tagName === this.options.textNodeName || tagName === this.options.attributesGroupName)) {
              throw new Error(`Invalid tag name: ${tagName}`);
            }
            if (currentNode && textData) {
              if (currentNode.tagname !== "!xml") {
                textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
              }
            }
            const lastTag = currentNode;
            if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
              currentNode = this.tagsNodeStack.pop();
              jPath = jPath.substring(0, jPath.lastIndexOf("."));
            }
            if (tagName !== xmlObj.tagname) {
              jPath += jPath ? "." + tagName : tagName;
            }
            const startIndex = i;
            if (this.isItStopNode(this.stopNodesExact, this.stopNodesWildcard, jPath, tagName)) {
              let tagContent = "";
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                i = result.closeIndex;
              } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                i = result.closeIndex;
              } else {
                const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
                if (!result2) throw new Error(`Unexpected end of ${rawTagName}`);
                i = result2.i;
                tagContent = result2.tagContent;
              }
              const childNode = new xmlNode(tagName);
              if (tagName !== tagExp && attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
              }
              if (tagContent) {
                tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
              }
              jPath = jPath.substr(0, jPath.lastIndexOf("."));
              childNode.add(this.options.textNodeName, tagContent);
              this.addChild(currentNode, childNode, jPath, startIndex);
            } else {
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                if (this.options.transformTagName) {
                  const newTagName = this.options.transformTagName(tagName);
                  if (tagExp === tagName) {
                    tagExp = newTagName;
                  }
                  tagName = newTagName;
                }
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath, startIndex);
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
              } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath);
                }
                this.addChild(currentNode, childNode, jPath, startIndex);
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
                i = result.closeIndex;
                continue;
              } else {
                const childNode = new xmlNode(tagName);
                if (this.tagsNodeStack.length > this.options.maxNestedTags) {
                  throw new Error("Maximum nested tags exceeded");
                }
                this.tagsNodeStack.push(currentNode);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath);
                currentNode = childNode;
              }
              textData = "";
              i = closeIndex;
            }
          }
        } else {
          textData += xmlData[i];
        }
      }
      return xmlObj.child;
    };
    function addChild(currentNode, childNode, jPath, startIndex) {
      if (!this.options.captureMetaData) startIndex = void 0;
      const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
      if (result === false) {
      } else if (typeof result === "string") {
        childNode.tagname = result;
        currentNode.addChild(childNode, startIndex);
      } else {
        currentNode.addChild(childNode, startIndex);
      }
    }
    var replaceEntitiesValue = function(val, tagName, jPath) {
      if (val.indexOf("&") === -1) {
        return val;
      }
      const entityConfig = this.options.processEntities;
      if (!entityConfig.enabled) {
        return val;
      }
      if (entityConfig.allowedTags) {
        if (!entityConfig.allowedTags.includes(tagName)) {
          return val;
        }
      }
      if (entityConfig.tagFilter) {
        if (!entityConfig.tagFilter(tagName, jPath)) {
          return val;
        }
      }
      for (let entityName in this.docTypeEntities) {
        const entity = this.docTypeEntities[entityName];
        const matches = val.match(entity.regx);
        if (matches) {
          this.entityExpansionCount += matches.length;
          if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
            throw new Error(
              `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
            );
          }
          const lengthBefore = val.length;
          val = val.replace(entity.regx, entity.val);
          if (entityConfig.maxExpandedLength) {
            this.currentExpandedLength += val.length - lengthBefore;
            if (this.currentExpandedLength > entityConfig.maxExpandedLength) {
              throw new Error(
                `Total expanded content size exceeded: ${this.currentExpandedLength} > ${entityConfig.maxExpandedLength}`
              );
            }
          }
        }
      }
      if (val.indexOf("&") === -1) return val;
      for (const entityName of Object.keys(this.lastEntities)) {
        const entity = this.lastEntities[entityName];
        const matches = val.match(entity.regex);
        if (matches) {
          this.entityExpansionCount += matches.length;
          if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
            throw new Error(
              `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
            );
          }
        }
        val = val.replace(entity.regex, entity.val);
      }
      if (val.indexOf("&") === -1) return val;
      if (this.options.htmlEntities) {
        for (const entityName of Object.keys(this.htmlEntities)) {
          const entity = this.htmlEntities[entityName];
          const matches = val.match(entity.regex);
          if (matches) {
            this.entityExpansionCount += matches.length;
            if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
              throw new Error(
                `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
              );
            }
          }
          val = val.replace(entity.regex, entity.val);
        }
      }
      val = val.replace(this.ampEntity.regex, this.ampEntity.val);
      return val;
    };
    function saveTextToParentTag(textData, parentNode, jPath, isLeafNode) {
      if (textData) {
        if (isLeafNode === void 0) isLeafNode = parentNode.child.length === 0;
        textData = this.parseTextData(
          textData,
          parentNode.tagname,
          jPath,
          false,
          parentNode[":@"] ? Object.keys(parentNode[":@"]).length !== 0 : false,
          isLeafNode
        );
        if (textData !== void 0 && textData !== "")
          parentNode.add(this.options.textNodeName, textData);
        textData = "";
      }
      return textData;
    }
    function isItStopNode(stopNodesExact, stopNodesWildcard, jPath, currentTagName) {
      if (stopNodesWildcard && stopNodesWildcard.has(currentTagName)) return true;
      if (stopNodesExact && stopNodesExact.has(jPath)) return true;
      return false;
    }
    function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
      let attrBoundary;
      let tagExp = "";
      for (let index = i; index < xmlData.length; index++) {
        let ch = xmlData[index];
        if (attrBoundary) {
          if (ch === attrBoundary) attrBoundary = "";
        } else if (ch === '"' || ch === "'") {
          attrBoundary = ch;
        } else if (ch === closingChar[0]) {
          if (closingChar[1]) {
            if (xmlData[index + 1] === closingChar[1]) {
              return {
                data: tagExp,
                index
              };
            }
          } else {
            return {
              data: tagExp,
              index
            };
          }
        } else if (ch === "	") {
          ch = " ";
        }
        tagExp += ch;
      }
    }
    function findClosingIndex(xmlData, str, i, errMsg) {
      const closingIndex = xmlData.indexOf(str, i);
      if (closingIndex === -1) {
        throw new Error(errMsg);
      } else {
        return closingIndex + str.length - 1;
      }
    }
    function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
      const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
      if (!result) return;
      let tagExp = result.data;
      const closeIndex = result.index;
      const separatorIndex = tagExp.search(/\s/);
      let tagName = tagExp;
      let attrExpPresent = true;
      if (separatorIndex !== -1) {
        tagName = tagExp.substring(0, separatorIndex);
        tagExp = tagExp.substring(separatorIndex + 1).trimStart();
      }
      const rawTagName = tagName;
      if (removeNSPrefix) {
        const colonIndex = tagName.indexOf(":");
        if (colonIndex !== -1) {
          tagName = tagName.substr(colonIndex + 1);
          attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
        }
      }
      return {
        tagName,
        tagExp,
        closeIndex,
        attrExpPresent,
        rawTagName
      };
    }
    function readStopNodeData(xmlData, tagName, i) {
      const startIndex = i;
      let openTagCount = 1;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === "<") {
          if (xmlData[i + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
            let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
            if (closeTagName === tagName) {
              openTagCount--;
              if (openTagCount === 0) {
                return {
                  tagContent: xmlData.substring(startIndex, i),
                  i: closeIndex
                };
              }
            }
            i = closeIndex;
          } else if (xmlData[i + 1] === "?") {
            const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
            i = closeIndex;
          } else if (xmlData.substr(i + 1, 3) === "!--") {
            const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
            i = closeIndex;
          } else if (xmlData.substr(i + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
            i = closeIndex;
          } else {
            const tagData = readTagExp(xmlData, i, ">");
            if (tagData) {
              const openTagName = tagData && tagData.tagName;
              if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
                openTagCount++;
              }
              i = tagData.closeIndex;
            }
          }
        }
      }
    }
    function parseValue(val, shouldParse, options) {
      if (shouldParse && typeof val === "string") {
        const newval = val.trim();
        if (newval === "true") return true;
        else if (newval === "false") return false;
        else return toNumber(val, options);
      } else {
        if (util.isExist(val)) {
          return val;
        } else {
          return "";
        }
      }
    }
    function fromCodePoint(str, base, prefix) {
      const codePoint = Number.parseInt(str, base);
      if (codePoint >= 0 && codePoint <= 1114111) {
        return String.fromCodePoint(codePoint);
      } else {
        return prefix + str + ";";
      }
    }
    function sanitizeName(name, options) {
      if (util.criticalProperties.includes(name)) {
        throw new Error(`[SECURITY] Invalid name: "${name}" is a reserved JavaScript keyword that could cause prototype pollution`);
      } else if (util.DANGEROUS_PROPERTY_NAMES.includes(name)) {
        return options.onDangerousProperty(name);
      }
      return name;
    }
    module.exports = OrderedObjParser;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/node2json.js
var require_node2json = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/node2json.js"(exports) {
    "use strict";
    function prettify(node, options) {
      return compress(node, options);
    }
    function compress(arr2, options, jPath) {
      let text;
      const compressedObj = {};
      for (let i = 0; i < arr2.length; i++) {
        const tagObj = arr2[i];
        const property = propName(tagObj);
        let newJpath = "";
        if (jPath === void 0) newJpath = property;
        else newJpath = jPath + "." + property;
        if (property === options.textNodeName) {
          if (text === void 0) text = tagObj[property];
          else text += "" + tagObj[property];
        } else if (property === void 0) {
          continue;
        } else if (tagObj[property]) {
          let val = compress(tagObj[property], options, newJpath);
          const isLeaf = isLeafTag(val, options);
          if (tagObj[":@"]) {
            assignAttributes(val, tagObj[":@"], newJpath, options);
          } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
            val = val[options.textNodeName];
          } else if (Object.keys(val).length === 0) {
            if (options.alwaysCreateTextNode) val[options.textNodeName] = "";
            else val = "";
          }
          if (compressedObj[property] !== void 0 && compressedObj.hasOwnProperty(property)) {
            if (!Array.isArray(compressedObj[property])) {
              compressedObj[property] = [compressedObj[property]];
            }
            compressedObj[property].push(val);
          } else {
            if (options.isArray(property, newJpath, isLeaf)) {
              compressedObj[property] = [val];
            } else {
              compressedObj[property] = val;
            }
          }
        }
      }
      if (typeof text === "string") {
        if (text.length > 0) compressedObj[options.textNodeName] = text;
      } else if (text !== void 0) compressedObj[options.textNodeName] = text;
      return compressedObj;
    }
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key !== ":@") return key;
      }
    }
    function assignAttributes(obj, attrMap, jpath, options) {
      if (attrMap) {
        const keys = Object.keys(attrMap);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          const atrrName = keys[i];
          if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
            obj[atrrName] = [attrMap[atrrName]];
          } else {
            obj[atrrName] = attrMap[atrrName];
          }
        }
      }
    }
    function isLeafTag(obj, options) {
      const { textNodeName } = options;
      const propCount = Object.keys(obj).length;
      if (propCount === 0) {
        return true;
      }
      if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
        return true;
      }
      return false;
    }
    exports.prettify = prettify;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
var require_XMLParser = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/XMLParser.js"(exports, module) {
    var { buildOptions } = require_OptionsBuilder();
    var OrderedObjParser = require_OrderedObjParser();
    var { prettify } = require_node2json();
    var validator = require_validator();
    var XMLParser2 = class {
      constructor(options) {
        this.externalEntities = {};
        this.options = buildOptions(options);
      }
      /**
       * Parse XML dats to JS object 
       * @param {string|Buffer} xmlData 
       * @param {boolean|Object} validationOption 
       */
      parse(xmlData, validationOption) {
        if (typeof xmlData === "string") {
        } else if (xmlData.toString) {
          xmlData = xmlData.toString();
        } else {
          throw new Error("XML data is accepted in String or Bytes[] form.");
        }
        if (validationOption) {
          if (validationOption === true) validationOption = {};
          const result = validator.validate(xmlData, validationOption);
          if (result !== true) {
            throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
          }
        }
        const orderedObjParser = new OrderedObjParser(this.options);
        orderedObjParser.addExternalEntities(this.externalEntities);
        const orderedResult = orderedObjParser.parseXml(xmlData);
        if (this.options.preserveOrder || orderedResult === void 0) return orderedResult;
        else return prettify(orderedResult, this.options);
      }
      /**
       * Add Entity which is not by default supported by this library
       * @param {string} key 
       * @param {string} value 
       */
      addEntity(key, value) {
        if (value.indexOf("&") !== -1) {
          throw new Error("Entity value can't have '&'");
        } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
          throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
        } else if (value === "&") {
          throw new Error("An entity with value '&' is not permitted");
        } else {
          this.externalEntities[key] = value;
        }
      }
    };
    module.exports = XMLParser2;
  }
});

// node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js
var require_orderedJs2Xml = __commonJS({
  "node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js"(exports, module) {
    var EOL = "\n";
    function toXml(jArray, options) {
      let indentation = "";
      if (options.format && options.indentBy.length > 0) {
        indentation = EOL;
      }
      return arrToStr(jArray, options, "", indentation);
    }
    function arrToStr(arr2, options, jPath, indentation) {
      let xmlStr = "";
      let isPreviousElementTag = false;
      if (!Array.isArray(arr2)) {
        if (arr2 !== void 0 && arr2 !== null) {
          let text = arr2.toString();
          text = replaceEntitiesValue(text, options);
          return text;
        }
        return "";
      }
      for (let i = 0; i < arr2.length; i++) {
        const tagObj = arr2[i];
        const tagName = propName(tagObj);
        if (tagName === void 0) continue;
        let newJPath = "";
        if (jPath.length === 0) newJPath = tagName;
        else newJPath = `${jPath}.${tagName}`;
        if (tagName === options.textNodeName) {
          let tagText = tagObj[tagName];
          if (!isStopNode(newJPath, options)) {
            tagText = options.tagValueProcessor(tagName, tagText);
            tagText = replaceEntitiesValue(tagText, options);
          }
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          xmlStr += tagText;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.cdataPropName) {
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          const cdataVal = String(tagObj[tagName][0][options.textNodeName]).replace(/\]\]>/g, "]]]]><![CDATA[>");
          xmlStr += `<![CDATA[${cdataVal}]]>`;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.commentPropName) {
          const commentVal = String(tagObj[tagName][0][options.textNodeName]).replace(/--/g, "- -").replace(/-$/, "- ");
          xmlStr += indentation + `<!--${commentVal}-->`;
          isPreviousElementTag = true;
          continue;
        } else if (tagName[0] === "?") {
          const attStr2 = attr_to_str(tagObj[":@"], options);
          const tempInd = tagName === "?xml" ? "" : indentation;
          let piTextNodeName = tagObj[tagName][0][options.textNodeName];
          piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : "";
          xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr2}?>`;
          isPreviousElementTag = true;
          continue;
        }
        let newIdentation = indentation;
        if (newIdentation !== "") {
          newIdentation += options.indentBy;
        }
        const attStr = attr_to_str(tagObj[":@"], options);
        const tagStart = indentation + `<${tagName}${attStr}`;
        const tagValue = arrToStr(tagObj[tagName], options, newJPath, newIdentation);
        if (options.unpairedTags.indexOf(tagName) !== -1) {
          if (options.suppressUnpairedNode) xmlStr += tagStart + ">";
          else xmlStr += tagStart + "/>";
        } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
          xmlStr += tagStart + "/>";
        } else if (tagValue && tagValue.endsWith(">")) {
          xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
        } else {
          xmlStr += tagStart + ">";
          if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
            xmlStr += indentation + options.indentBy + tagValue + indentation;
          } else {
            xmlStr += tagValue;
          }
          xmlStr += `</${tagName}>`;
        }
        isPreviousElementTag = true;
      }
      return xmlStr;
    }
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        if (key !== ":@") return key;
      }
    }
    function attr_to_str(attrMap, options) {
      let attrStr = "";
      if (attrMap && !options.ignoreAttributes) {
        for (let attr in attrMap) {
          if (!Object.prototype.hasOwnProperty.call(attrMap, attr)) continue;
          let attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
          attrVal = replaceEntitiesValue(attrVal, options);
          if (attrVal === true && options.suppressBooleanAttributes) {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
          } else {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
          }
        }
      }
      return attrStr;
    }
    function isStopNode(jPath, options) {
      jPath = jPath.substr(0, jPath.length - options.textNodeName.length - 1);
      let tagName = jPath.substr(jPath.lastIndexOf(".") + 1);
      for (let index in options.stopNodes) {
        if (options.stopNodes[index] === jPath || options.stopNodes[index] === "*." + tagName) return true;
      }
      return false;
    }
    function replaceEntitiesValue(textValue, options) {
      if (textValue && textValue.length > 0 && options.processEntities) {
        for (let i = 0; i < options.entities.length; i++) {
          const entity = options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    }
    module.exports = toXml;
  }
});

// node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js
var require_json2xml = __commonJS({
  "node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js"(exports, module) {
    "use strict";
    var buildFromOrderedJs = require_orderedJs2Xml();
    var getIgnoreAttributesFn = require_ignoreAttributes();
    var defaultOptions = {
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      cdataPropName: false,
      format: false,
      indentBy: "  ",
      suppressEmptyNode: false,
      suppressUnpairedNode: true,
      suppressBooleanAttributes: true,
      tagValueProcessor: function(key, a) {
        return a;
      },
      attributeValueProcessor: function(attrName, a) {
        return a;
      },
      preserveOrder: false,
      commentPropName: false,
      unpairedTags: [],
      entities: [
        { regex: new RegExp("&", "g"), val: "&amp;" },
        //it must be on top
        { regex: new RegExp(">", "g"), val: "&gt;" },
        { regex: new RegExp("<", "g"), val: "&lt;" },
        { regex: new RegExp("'", "g"), val: "&apos;" },
        { regex: new RegExp('"', "g"), val: "&quot;" }
      ],
      processEntities: true,
      stopNodes: [],
      // transformTagName: false,
      // transformAttributeName: false,
      oneListGroup: false
    };
    function Builder(options) {
      this.options = Object.assign({}, defaultOptions, options);
      if (this.options.ignoreAttributes === true || this.options.attributesGroupName) {
        this.isAttribute = function() {
          return false;
        };
      } else {
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
        this.attrPrefixLen = this.options.attributeNamePrefix.length;
        this.isAttribute = isAttribute;
      }
      this.processTextOrObjNode = processTextOrObjNode;
      if (this.options.format) {
        this.indentate = indentate;
        this.tagEndChar = ">\n";
        this.newLine = "\n";
      } else {
        this.indentate = function() {
          return "";
        };
        this.tagEndChar = ">";
        this.newLine = "";
      }
    }
    Builder.prototype.build = function(jObj) {
      if (this.options.preserveOrder) {
        return buildFromOrderedJs(jObj, this.options);
      } else {
        if (Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1) {
          jObj = {
            [this.options.arrayNodeName]: jObj
          };
        }
        return this.j2x(jObj, 0, []).val;
      }
    };
    Builder.prototype.j2x = function(jObj, level, ajPath) {
      let attrStr = "";
      let val = "";
      const jPath = ajPath.join(".");
      for (let key in jObj) {
        if (!Object.prototype.hasOwnProperty.call(jObj, key)) continue;
        if (typeof jObj[key] === "undefined") {
          if (this.isAttribute(key)) {
            val += "";
          }
        } else if (jObj[key] === null) {
          if (this.isAttribute(key)) {
            val += "";
          } else if (key === this.options.cdataPropName) {
            val += "";
          } else if (key[0] === "?") {
            val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
          } else {
            val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
          }
        } else if (jObj[key] instanceof Date) {
          val += this.buildTextValNode(jObj[key], key, "", level);
        } else if (typeof jObj[key] !== "object") {
          const attr = this.isAttribute(key);
          if (attr && !this.ignoreAttributesFn(attr, jPath)) {
            attrStr += this.buildAttrPairStr(attr, "" + jObj[key]);
          } else if (!attr) {
            if (key === this.options.textNodeName) {
              let newval = this.options.tagValueProcessor(key, "" + jObj[key]);
              val += this.replaceEntitiesValue(newval);
            } else {
              val += this.buildTextValNode(jObj[key], key, "", level);
            }
          }
        } else if (Array.isArray(jObj[key])) {
          const arrLen = jObj[key].length;
          let listTagVal = "";
          let listTagAttr = "";
          for (let j = 0; j < arrLen; j++) {
            const item = jObj[key][j];
            if (typeof item === "undefined") {
            } else if (item === null) {
              if (key[0] === "?") val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
              else val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
            } else if (typeof item === "object") {
              if (this.options.oneListGroup) {
                const result = this.j2x(item, level + 1, ajPath.concat(key));
                listTagVal += result.val;
                if (this.options.attributesGroupName && item.hasOwnProperty(this.options.attributesGroupName)) {
                  listTagAttr += result.attrStr;
                }
              } else {
                listTagVal += this.processTextOrObjNode(item, key, level, ajPath);
              }
            } else {
              if (this.options.oneListGroup) {
                let textValue = this.options.tagValueProcessor(key, item);
                textValue = this.replaceEntitiesValue(textValue);
                listTagVal += textValue;
              } else {
                listTagVal += this.buildTextValNode(item, key, "", level);
              }
            }
          }
          if (this.options.oneListGroup) {
            listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
          }
          val += listTagVal;
        } else {
          if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
            const Ks = Object.keys(jObj[key]);
            const L = Ks.length;
            for (let j = 0; j < L; j++) {
              attrStr += this.buildAttrPairStr(Ks[j], "" + jObj[key][Ks[j]]);
            }
          } else {
            val += this.processTextOrObjNode(jObj[key], key, level, ajPath);
          }
        }
      }
      return { attrStr, val };
    };
    Builder.prototype.buildAttrPairStr = function(attrName, val) {
      val = this.options.attributeValueProcessor(attrName, "" + val);
      val = this.replaceEntitiesValue(val);
      if (this.options.suppressBooleanAttributes && val === "true") {
        return " " + attrName;
      } else return " " + attrName + '="' + val + '"';
    };
    function processTextOrObjNode(object, key, level, ajPath) {
      const result = this.j2x(object, level + 1, ajPath.concat(key));
      if (object[this.options.textNodeName] !== void 0 && Object.keys(object).length === 1) {
        return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level);
      } else {
        return this.buildObjectNode(result.val, key, result.attrStr, level);
      }
    }
    Builder.prototype.buildObjectNode = function(val, key, attrStr, level) {
      if (val === "") {
        if (key[0] === "?") return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
        else {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        }
      } else {
        let tagEndExp = "</" + key + this.tagEndChar;
        let piClosingChar = "";
        if (key[0] === "?") {
          piClosingChar = "?";
          tagEndExp = "";
        }
        if ((attrStr || attrStr === "") && val.indexOf("<") === -1) {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + ">" + val + tagEndExp;
        } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
          const safeVal = String(val).replace(/--/g, "- -").replace(/-$/, "- ");
          return this.indentate(level) + `<!--${safeVal}-->` + this.newLine;
        } else {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + this.tagEndChar + val + this.indentate(level) + tagEndExp;
        }
      }
    };
    Builder.prototype.closeTag = function(key) {
      let closeTag = "";
      if (this.options.unpairedTags.indexOf(key) !== -1) {
        if (!this.options.suppressUnpairedNode) closeTag = "/";
      } else if (this.options.suppressEmptyNode) {
        closeTag = "/";
      } else {
        closeTag = `></${key}`;
      }
      return closeTag;
    };
    Builder.prototype.buildTextValNode = function(val, key, attrStr, level) {
      if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
        const safeVal = String(val).replace(/\]\]>/g, "]]]]><![CDATA[>");
        return this.indentate(level) + `<![CDATA[${safeVal}]]>` + this.newLine;
      } else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
        const safeVal = String(val).replace(/--/g, "- -").replace(/-$/, "- ");
        return this.indentate(level) + `<!--${safeVal}-->` + this.newLine;
      } else if (key[0] === "?") {
        return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
      } else {
        let textValue = this.options.tagValueProcessor(key, val);
        textValue = this.replaceEntitiesValue(textValue);
        if (textValue === "") {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        } else {
          return this.indentate(level) + "<" + key + attrStr + ">" + textValue + "</" + key + this.tagEndChar;
        }
      }
    };
    Builder.prototype.replaceEntitiesValue = function(textValue) {
      if (textValue && textValue.length > 0 && this.options.processEntities) {
        for (let i = 0; i < this.options.entities.length; i++) {
          const entity = this.options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    };
    function indentate(level) {
      return this.options.indentBy.repeat(level);
    }
    function isAttribute(name) {
      if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
        return name.substr(this.attrPrefixLen);
      } else {
        return false;
      }
    }
    module.exports = Builder;
  }
});

// node_modules/fast-xml-parser/src/fxp.js
var require_fxp = __commonJS({
  "node_modules/fast-xml-parser/src/fxp.js"(exports, module) {
    "use strict";
    var validator = require_validator();
    var XMLParser2 = require_XMLParser();
    var XMLBuilder = require_json2xml();
    module.exports = {
      XMLParser: XMLParser2,
      XMLValidator: validator,
      XMLBuilder
    };
  }
});

// scripts/bsdata-parser.mjs
var import_fast_xml_parser = __toESM(require_fxp(), 1);
import { readFile, readdir } from "node:fs/promises";
import { join, basename } from "node:path";

// src/lib/comp.js
function modEvalCondition(cond, counts) {
  if (cond.type === "instanceOf" || cond.type === "notInstanceOf") {
    if (cond.scope === "primary-catalogue") {
      const pc = counts._primaryCat;
      if (pc == null) return false;
      const isP = cond.childId === pc;
      return cond.type === "instanceOf" ? isP : !isP;
    }
    const cats = counts._cats;
    const has = cats && (cats.has ? cats.has(cond.childId) : cats[cond.childId]);
    return cond.type === "instanceOf" ? !!has : !has;
  }
  if (cond.field !== "selections" && cond.field !== "forces") return false;
  const actual = counts[cond.childId] !== void 0 ? counts[cond.childId] : 0;
  const v = cond.value;
  switch (cond.type) {
    case "lessThan":
      return actual < v;
    case "greaterThan":
      return actual > v;
    case "atMost":
      return actual <= v;
    case "atLeast":
      return actual >= v;
    case "equalTo":
      return actual === v;
    case "notEqualTo":
      return actual !== v;
  }
  return false;
}
function modEvalGroup(cg, counts) {
  if (!cg) return true;
  const direct = (cg.conds || []).map((c) => modEvalCondition(c, counts));
  const sub = (cg.groups || []).map((g) => modEvalGroup(g, counts));
  const all = direct.concat(sub);
  if (all.length === 0) return true;
  if (cg.op === "count") return all.filter((x) => x).length >= (cg.minCount || 1);
  return cg.op === "or" ? all.some((x) => x) : all.every((x) => x);
}
function gateActive(gate, counts) {
  return !gate || (counts[gate] || 0) >= 1;
}
function effBound(base, mods, counts) {
  if (!mods || !mods.length) return base;
  const active = mods.filter((m) => gateActive(m.gate, counts) && modEvalGroup(m.cg, counts));
  let v = base;
  for (const m of active) if (m.type === "set") v = Number(m.value) || 0;
  for (const m of active) {
    if (m.type === "set") continue;
    let times = 1;
    if (m.repeats && m.repeats.length) {
      times = 0;
      for (const r of m.repeats) {
        const cnt = counts[r.childId] || 0;
        const step = r.value || 1;
        times += (r.roundUp ? Math.ceil(cnt / step) : Math.floor(cnt / step)) * (r.repeats || 1);
      }
    }
    const delta = (Number(m.value) || 0) * times;
    if (m.type === "increment" || m.type === "add") v += delta;
    else if (m.type === "decrement" || m.type === "subtract") v -= delta;
    else if (m.type === "multiply") v = v * (Number(m.value) || 1);
  }
  return Math.max(0, v);
}
function modelEff(m, counts) {
  const d = m[9];
  const min = d ? effBound(m[4] || 0, d.minMods, counts) : m[4] || 0;
  const max = d && d.maxMods && d.maxMods.length ? effBound(m[1] || 0, d.maxMods, counts) : m[1] || 0;
  return { min, max };
}
function compAbsorbedIds(comp) {
  const s = /* @__PURE__ */ new Set();
  for (const g of comp || []) for (const m of g[3] || []) {
    const d = m[9];
    if (!d) continue;
    for (const mod of d.maxMods || []) if ((mod.type === "decrement" || mod.type === "subtract") && mod.repeats) {
      for (const r of mod.repeats) if (r.childId) s.add(r.childId);
    }
  }
  return s;
}
function groupBounds(comp, counts) {
  const absorbed = compAbsorbedIds(comp);
  const cb = { ...counts };
  for (const id of absorbed) cb[id] = 0;
  const gEff = [];
  let minM = 0, maxM = 0;
  comp.forEach((g, gi) => {
    const isFixed = g[0] === "_fixed";
    const models = g[3] || [];
    let bMin = 0, bMax = 0;
    models.forEach((m) => {
      const e = modelEff(m, cb);
      bMin += e.min;
      if (!(m[8] || []).some((id) => absorbed.has(id))) bMax += e.max;
    });
    const gd = g[8];
    const modelsDyn = models.some((m) => m[9]);
    let gMin, gMax;
    if (isFixed) {
      const hasDyn = gd || modelsDyn;
      gMin = hasDyn ? bMin : Math.max(bMin, g[1] || 0);
      gMax = hasDyn ? bMax : Math.max(bMax, g[2] || 0);
    } else if (gd) {
      gMin = effBound(g[1] || 0, gd.minMods, cb);
      gMax = effBound(g[2] || 0, gd.maxMods, cb);
    } else if (modelsDyn) {
      gMin = Math.max(bMin, g[1] || 0);
      gMax = Math.max(bMax, g[2] || 0);
    } else {
      gMin = g[1] || 0;
      gMax = g[2] || 0;
    }
    gEff[gi] = { min: gMin, max: gMax };
    minM += gMin;
    maxM += gMax;
  });
  return { gEff, minM, maxM };
}
function compGateIds(comp) {
  const s = /* @__PURE__ */ new Set();
  const add = (mods) => {
    for (const m of mods || []) if (m.gate) s.add(m.gate);
  };
  for (const g of comp || []) {
    if (g[8]) {
      add(g[8].minMods);
      add(g[8].maxMods);
    }
    for (const m of g[3] || []) {
      const d = m[9];
      if (d) {
        add(d.minMods);
        add(d.maxMods);
      }
    }
  }
  return s;
}
function compSizeRange(comp, opts) {
  const gates = compGateIds(comp || []);
  if (!gates.size) return null;
  const drivers = [];
  for (const o of opts || []) {
    if ((o[1] || []).some((c) => (c[7] || []).some((id) => gates.has(id)))) drivers.push(o[1] || []);
  }
  if (!drivers.length) return null;
  let combos = [[]];
  for (const choices of drivers) {
    const next = [];
    for (const combo of combos) for (const c of choices) next.push([...combo, c]);
    combos = next;
    if (combos.length > 24) return null;
  }
  let lo = Infinity, hi = 0;
  for (const combo of combos) {
    const counts = { model: 0 };
    for (const c of combo) for (const id of c[7] || []) counts[id] = (counts[id] || 0) + 1;
    const { minM, maxM } = groupBounds(comp || [], counts);
    lo = Math.min(lo, minM);
    hi = Math.max(hi, maxM);
  }
  return lo <= hi ? [lo, hi] : null;
}

// scripts/bsdata-parser.mjs
var X = new import_fast_xml_parser.XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  alwaysCreateTextNode: false,
  parseAttributeValue: false,
  parseTagValue: false,
  // fast-xml-parser ≥4.5 caps entity expansion (default maxTotalExpansions:1000)
  // as an XML-bomb guard. The catalogues are trusted build-time data and a large
  // one legitimately carries >1000 standard entities (&amp; / &gt; / …) across
  // its text, which trips the cap and fails the whole build. Raise the limits
  // generously — there's no untrusted input here.
  processEntities: {
    enabled: true,
    maxTotalExpansions: 1e8,
    maxExpandedLength: 1e9,
    maxEntitySize: 1e8,
    maxEntityCount: 1e7
  },
  isArray: (name) => [
    "catalogueLink",
    "entryLink",
    "selectionEntry",
    "selectionEntryGroup",
    "profile",
    "characteristic",
    "categoryLink",
    "cost",
    "constraint",
    "modifier",
    "rule",
    "infoLink",
    "publication"
  ].includes(name)
});
var arr = (v) => Array.isArray(v) ? v : v ? [v] : [];
function walk(node, key) {
  const out = [];
  function rec(n) {
    if (!n || typeof n !== "object") return;
    for (const [k, v] of Object.entries(n)) {
      if (k === key) {
        for (const item of arr(v)) out.push(item);
      } else if (typeof v === "object" && v !== null) {
        for (const item of arr(v)) rec(item);
      }
    }
  }
  rec(node);
  return out;
}
function child(node, path) {
  let cur = node;
  for (const seg of path.split(".")) {
    if (cur == null) return null;
    if (Array.isArray(cur)) {
      const parts = cur.map((c) => c == null ? null : c[seg]).filter((x) => x != null);
      cur = parts.length ? parts.flat() : null;
    } else cur = cur[seg];
  }
  return cur;
}
var CURRENT_PRIMARY_CAT = null;
function staticPrimaryCatVerdict(m) {
  const leaf = (c) => {
    if (c["@scope"] !== "primary-catalogue" || !CURRENT_PRIMARY_CAT) return null;
    if (c["@type"] === "instanceOf") return c["@childId"] === CURRENT_PRIMARY_CAT;
    if (c["@type"] === "notInstanceOf") return c["@childId"] !== CURRENT_PRIMARY_CAT;
    return null;
  };
  const group = (g, op) => {
    const parts = [
      ...arr(child(g, "conditions.condition")).map(leaf),
      ...arr(child(g, "conditionGroups.conditionGroup")).map((sg) => group(sg, sg["@type"] === "or" ? "or" : "and"))
    ];
    if (!parts.length) return true;
    if (parts.some((x) => x === null)) return null;
    return op === "or" ? parts.some(Boolean) : parts.every(Boolean);
  };
  return group(m, "and");
}
function characteristics(profile) {
  const out = {};
  const idToName = {};
  for (const c of arr(child(profile, "characteristics.characteristic"))) {
    const t = c["#text"];
    out[c["@name"]] = (t == null ? "" : String(t)).trim();
    if (c["@typeId"]) idToName[c["@typeId"]] = c["@name"];
  }
  for (const m of arr(child(profile, "modifiers.modifier"))) {
    if (m["@type"] !== "set" || !m["@field"] || m["@affects"] || m["@value"] == null) continue;
    const nm = idToName[m["@field"]] || (m["@field"] in out ? m["@field"] : null);
    if (!nm) continue;
    if (staticPrimaryCatVerdict(m) !== true) continue;
    out[nm] = String(m["@value"]);
  }
  return out;
}
function buildIdIndex(catalogue) {
  const idx = /* @__PURE__ */ new Map();
  function rec(n) {
    if (!n || typeof n !== "object") return;
    if (n["@id"]) idx.set(n["@id"], n);
    for (const v of Object.values(n)) {
      if (typeof v === "object" && v !== null) {
        for (const item of arr(v)) rec(item);
      }
    }
  }
  rec(catalogue);
  return idx;
}
function listUnits(catalogue, idIndex, primaryCatalogueId) {
  if (!idIndex) return [];
  const out = /* @__PURE__ */ new Map();
  const rec = (node, insideSE) => {
    if (!node || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node)) {
      if (k === "entryLink") {
        for (const el of arr(v)) {
          if (insideSE || !el["@targetId"]) continue;
          const tgt = idIndex.get(el["@targetId"]);
          if (!tgt || !tgt["@id"]) continue;
          const prev = out.get(tgt["@id"]);
          if (!prev) out.set(tgt["@id"], { entry: tgt, link: el });
          else if (primaryCatalogueId && isHiddenForCatalogue(prev.link, primaryCatalogueId) && !isHiddenForCatalogue(el, primaryCatalogueId)) out.set(tgt["@id"], { entry: tgt, link: el });
        }
      } else if (k === "selectionEntry" || k === "selectionEntryGroup") {
        for (const it of arr(v)) rec(it, true);
      } else if (typeof v === "object" && v !== null) {
        for (const it of arr(v)) rec(it, insideSE);
      }
    }
  };
  rec(catalogue, false);
  return [...out.values()];
}
function listSharedUnits(catalogue, idIndex) {
  const isUnit = (e) => e?.["@type"] === "unit" || e?.["@type"] === "model";
  const out = /* @__PURE__ */ new Map();
  for (const e of arr(child(catalogue, "sharedSelectionEntries.selectionEntry"))) {
    if (isUnit(e)) out.set(e["@id"], { entry: e, link: null });
  }
  const rootLinked = /* @__PURE__ */ new Set();
  if (idIndex) {
    for (const el of arr(child(catalogue, "entryLinks.entryLink"))) {
      if (el["@type"] !== "selectionEntry") continue;
      rootLinked.add(el["@targetId"]);
      const tgt = idIndex.get(el["@targetId"]);
      if (tgt && isUnit(tgt) && !out.has(tgt["@id"])) out.set(tgt["@id"], { entry: tgt, link: el });
    }
    const compLinked = /* @__PURE__ */ new Set();
    const scanGroups = (node) => {
      for (const grp of arr(child(node, "selectionEntryGroups.selectionEntryGroup"))) {
        for (const holder of [grp, ...arr(child(grp, "selectionEntryGroups.selectionEntryGroup"))]) {
          for (const el of arr(child(holder, "entryLinks.entryLink"))) {
            const t = idIndex.get(el["@targetId"]);
            if (t && t["@type"] === "model") compLinked.add(t["@id"]);
          }
        }
      }
      for (const se of arr(child(node, "selectionEntries.selectionEntry"))) scanGroups(se);
    };
    for (const { entry } of out.values()) scanGroups(entry);
    for (const id of [...out.keys()]) {
      const e = out.get(id).entry;
      if (e["@type"] === "model" && compLinked.has(id) && !rootLinked.has(id)) out.delete(id);
    }
  }
  return [...out.values()];
}
function isDatasheetUnit(u, entry) {
  if (u.stats && u.stats.length || u.comp && u.comp.length || u.weapons && u.weapons.length) return true;
  const t = entry && entry["@type"];
  if (t !== "unit" && t !== "model") return false;
  return !(t === "model" && (u.pts || 0) > 0);
}
function getPtsInfo(entry, link) {
  if (link) {
    for (const c of arr(child(link, "costs.cost"))) {
      if (c["@name"] === "pts") {
        const n = Number(c["@value"]);
        if (Number.isFinite(n) && Math.trunc(n) > 0) return { pts: Math.trunc(n), perModelPts: 0, modelMin: 1, modelMax: 1 };
      }
    }
  }
  for (const c of arr(child(entry, "costs.cost"))) {
    if (c["@name"] === "pts") {
      const n = Number(c["@value"]);
      if (Number.isFinite(n) && Math.trunc(n) > 0) {
        return { pts: Math.trunc(n), perModelPts: 0, modelMin: 1, modelMax: 1 };
      }
    }
  }
  const directModels = arr(child(entry, "selectionEntries.selectionEntry")).filter((sub) => sub["@type"] === "model");
  if (directModels.length === 1) {
    const m = directModels[0];
    for (const c of arr(child(m, "costs.cost"))) {
      if (c["@name"] === "pts") {
        const n = Number(c["@value"]);
        if (Number.isFinite(n)) {
          const mPts = Math.trunc(n);
          const mMin = intC(getConstraint(m, "min", "selections"), 1);
          const mMax = intC(getConstraint(m, "max", "selections"), 1);
          return { pts: mPts * Math.max(mMin, 1), perModelPts: mPts, modelMin: mMin, modelMax: mMax };
        }
      }
    }
  }
  return { pts: 0, perModelPts: 0, modelMin: 1, modelMax: 1 };
}
function statsFromUnitProfile(p) {
  const c = characteristics(p);
  const order = ["M", "T", "SV", "W", "LD", "OC"];
  const vals = order.map((k) => c[k] || "");
  while (vals.length && !vals[vals.length - 1]) vals.pop();
  return vals.join("/");
}
function getStats(entry, idIndex, seen) {
  for (const p of walk(entry, "profile")) {
    if (p["@typeName"] === "Unit") return statsFromUnitProfile(p);
  }
  if (!idIndex) return "";
  for (const il of walk(entry, "infoLink")) {
    if (il["@type"] && il["@type"] !== "profile") continue;
    const tgt = idIndex.get(il["@targetId"]);
    if (tgt && tgt["@typeName"] === "Unit") return statsFromUnitProfile(tgt);
  }
  seen = seen || /* @__PURE__ */ new Set();
  for (const el of walk(entry, "entryLink")) {
    if (el["@type"] !== "selectionEntry") continue;
    if (el["@hidden"] === "true") continue;
    const id = el["@targetId"];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const tgt = idIndex.get(id);
    if (!tgt) continue;
    const s = getStats(tgt, idIndex, seen);
    if (s) return s;
  }
  return "";
}
function collectUnitProfiles(entry, idIndex, seen, out) {
  out = out || [];
  seen = seen || /* @__PURE__ */ new Set();
  for (const p of walk(entry, "profile")) {
    if (p["@typeName"] === "Unit") out.push([p["@name"] || "", statsFromUnitProfile(p)]);
  }
  if (idIndex) {
    for (const il of walk(entry, "infoLink")) {
      if (il["@type"] && il["@type"] !== "profile") continue;
      const tgt = idIndex.get(il["@targetId"]);
      if (tgt && tgt["@typeName"] === "Unit") out.push([tgt["@name"] || "", statsFromUnitProfile(tgt)]);
    }
    for (const el of walk(entry, "entryLink")) {
      if (el["@type"] !== "selectionEntry") continue;
      if (el["@hidden"] === "true") continue;
      const id = el["@targetId"];
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const tgt = idIndex.get(id);
      if (tgt) collectUnitProfiles(tgt, idIndex, seen, out);
    }
  }
  return out;
}
function getStatLines(entry, idIndex) {
  const byVals = /* @__PURE__ */ new Map();
  const order = [];
  for (const [name, s] of collectUnitProfiles(entry, idIndex)) {
    if (!s) continue;
    if (!byVals.has(s)) {
      byVals.set(s, []);
      order.push(s);
    }
    const names = byVals.get(s);
    if (name && !names.includes(name)) names.push(name);
  }
  const distinct = order.map((s) => [byVals.get(s).join(", "), s.split("/")]);
  return distinct.length > 1 ? distinct : [];
}
var MODEL_TYPE_KW = /* @__PURE__ */ new Set(["infantry", "beast", "mounted", "vehicle", "monster", "swarm", "fortification", "aircraft"]);
function getKeywordData(entry, idIndex) {
  const dedup = (list) => {
    const m = /* @__PURE__ */ new Map();
    for (const k of list) {
      const lk = k.toLowerCase();
      if (!m.has(lk)) m.set(lk, k);
    }
    return [...m.values()];
  };
  const canonCat = (cl) => {
    const id = cl["@targetId"];
    const ce = id && (idIndex && idIndex.get(id) || GST_INDEX.get(id)) || null;
    if (ce && ce["@hidden"] === "true") return "";
    return (ce && ce["@name"] || cl["@name"] || "").trim();
  };
  const split = (node) => {
    const fac = [], kw = [];
    for (const cl of arr(child(node, "categoryLinks.categoryLink"))) {
      const n = canonCat(cl);
      if (!n) continue;
      if (/^Faction:/i.test(n)) fac.push(n.replace(/^Faction:\s*/i, "").trim());
      else kw.push(n);
    }
    return { fac, kw };
  };
  const models = [];
  const seen = /* @__PURE__ */ new Set();
  const addModel = (node, name) => {
    const id = node["@id"];
    if (id && seen.has(id)) return;
    if (id) seen.add(id);
    models.push({ name: (name || node["@name"] || "").trim(), node });
  };
  for (const m of walk(entry, "selectionEntry")) if (m["@type"] === "model") addModel(m);
  if (idIndex) for (const el of walk(entry, "entryLink")) {
    const t = el["@targetId"] && idIndex.get(el["@targetId"]);
    if (t && t["@type"] === "model") addModel(t, el["@name"]);
  }
  const unit = split(entry);
  const facSet = [];
  const seenFac = /* @__PURE__ */ new Set();
  const addFac = (f) => {
    const k = f.toLowerCase();
    if (k && !seenFac.has(k)) {
      seenFac.add(k);
      facSet.push(f);
    }
  };
  unit.fac.forEach(addFac);
  const byModel = [];
  const flat = [...unit.kw];
  for (const m of models) {
    const c = split(m.node);
    c.fac.forEach(addFac);
    flat.push(...c.kw);
    const ownComplete = c.kw.some((k) => MODEL_TYPE_KW.has(k.toLowerCase()));
    byModel.push({ name: m.name, kw: dedup(c.kw.length ? ownComplete ? c.kw : [...unit.kw, ...c.kw] : unit.kw) });
  }
  if (!byModel.length) byModel.push({ name: (entry["@name"] || "").trim(), kw: dedup(unit.kw) });
  return { byModel, faction: facSet, flat: dedup(flat) };
}
function isWeaponProfile(p) {
  return /Weapon/.test(p["@typeName"] || "");
}
function fmtWeapon(p) {
  const c = characteristics(p);
  {
    const mods = arr(child(p, "modifiers.modifier")).filter((m) => m["@type"] === "set" && m["@field"] && !m["@affects"] && !arr(child(m, "conditions.condition")).length && !arr(child(m, "conditionGroups.conditionGroup")).length);
    if (mods.length) {
      const idToName = {};
      for (const ch of arr(child(p, "characteristics.characteristic"))) if (ch["@typeId"] && ch["@name"]) idToName[ch["@typeId"]] = ch["@name"];
      for (const m of mods) {
        const nm = idToName[m["@field"]];
        if (nm && m["@value"] != null) c[nm] = String(m["@value"]);
      }
    }
  }
  const isMelee = /Melee/.test(p["@typeName"] || "");
  const baseName = p["@name"] || "";
  const isSub = /^\s*➤/.test(baseName);
  const displayName = isSub ? "\u27A4 " + baseName.replace(/^[➜➤\s]+/, "") : baseName;
  const w = {
    bsId: p["@id"] || "",
    n: displayName,
    t: isMelee ? "M" : "R",
    rng: c.Range || "-",
    a: c.A || "-",
    sk: c.WS || c.BS || "-",
    s: c.S || "-",
    ap: c.AP || "-",
    d: c.D || "-",
    kw: c.Keywords || "-"
  };
  if (isSub) w.sub = true;
  return w;
}
function collectWeapons(entry, idIndex, unitCatIds) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const seenSigs = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  function addProfile(p) {
    if (!isWeaponProfile(p)) return;
    const id = p["@id"] || "";
    if (id && seen.has(id)) return;
    if (id) seen.add(id);
    const w = fmtWeapon(p);
    const normName = (w.n || "").replace(/^[➜➤\s]+/, "").trim();
    const sig = `${normName}|${w.t}|${w.rng}|${w.a}|${w.sk}|${w.s}|${w.ap}|${w.d}`;
    if (seenSigs.has(sig)) return;
    seenSigs.add(sig);
    out.push(w);
  }
  function rec(e, inComposition) {
    if (!e) return;
    const directWeap = arr(child(e, "profiles.profile")).filter(isWeaponProfile);
    for (const p of arr(child(e, "profiles.profile"))) addProfile(p);
    if (directWeap.length === 0 && idIndex) {
      for (const il of arr(child(e, "infoLinks.infoLink"))) {
        if (il["@type"] !== "profile") continue;
        const t = idIndex.get(il["@targetId"]);
        if (t && isWeaponProfile(t)) addProfile(t);
      }
    }
    for (const sub of arr(child(e, "selectionEntries.selectionEntry"))) {
      if (entryHiddenFor(sub, unitCatIds)) continue;
      const subWeaps = arr(child(sub, "profiles.profile")).filter(isWeaponProfile);
      if (subWeaps.length > 1) {
        for (const p of subWeaps) addProfile(p);
      } else {
        rec(sub, inComposition);
      }
    }
    for (const g of arr(child(e, "selectionEntryGroups.selectionEntryGroup"))) {
      if (/enhancement/i.test(String(g["@name"] || ""))) continue;
      if (entryHiddenFor(g, unitCatIds)) continue;
      const hasModels = arr(child(g, "selectionEntries.selectionEntry")).some((s) => s["@type"] === "model");
      rec(g, inComposition || hasModels);
    }
    if (!inComposition) {
      for (const el of arr(child(e, "entryLinks.entryLink"))) {
        const tid = el["@targetId"];
        if (!tid || visited.has(tid)) continue;
        if (/enhancement/i.test(String(el["@name"] || ""))) continue;
        if (el["@hidden"] === "true" || entryHiddenFor(el, unitCatIds)) continue;
        visited.add(tid);
        const tgt = idIndex.get(tid);
        if (tgt && !entryHiddenFor(tgt, unitCatIds)) rec(tgt, false);
      }
    }
  }
  rec(entry, false);
  return out;
}
function collectOptionWeapons(entry, idIndex) {
  const out = [];
  const seenId = /* @__PURE__ */ new Set();
  const seenSig = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const add = (p) => {
    if (!isWeaponProfile(p)) return;
    const id = p["@id"] || "";
    if (id && seenId.has(id)) return;
    if (id) seenId.add(id);
    const w = fmtWeapon(p);
    const nn = (w.n || "").replace(/^[➜➤\s]+/, "").trim();
    const sig = `${nn}|${w.t}|${w.rng}|${w.a}|${w.sk}|${w.s}|${w.ap}|${w.d}`;
    if (seenSig.has(sig)) return;
    seenSig.add(sig);
    out.push(w);
  };
  const rec = (e) => {
    if (!e) return;
    for (const p of arr(child(e, "profiles.profile"))) add(p);
    for (const sub of arr(child(e, "selectionEntries.selectionEntry"))) {
      const ws = arr(child(sub, "profiles.profile")).filter(isWeaponProfile);
      if (ws.length > 1) {
        for (const p of ws) add(p);
      } else rec(sub);
    }
    for (const g of arr(child(e, "selectionEntryGroups.selectionEntryGroup"))) rec(g);
    for (const el of arr(child(e, "entryLinks.entryLink"))) {
      const tid = el["@targetId"];
      if (!tid || visited.has(tid)) continue;
      visited.add(tid);
      const tgt = idIndex.get(tid);
      if (tgt) rec(tgt);
    }
  };
  rec(entry);
  return out;
}
function getFlags(entry) {
  const cats = arr(child(entry, "categoryLinks.categoryLink")).map((c) => c["@name"]);
  return {
    isEpic: cats.includes("Epic Hero"),
    isChar: cats.includes("Character"),
    isAllied: false
  };
}
function classifyCat(flags, keywords) {
  const kj = keywords.join(" ");
  if (flags.isChar || keywords.includes("Character")) return "Character";
  if (keywords.includes("Battleline")) return "Battleline";
  if (/Vehicle|Walker/.test(kj)) return "Vehicle";
  if (keywords.includes("Monster")) return "Monster";
  if (keywords.includes("Mounted")) return "Mounted";
  if (keywords.includes("Beast")) return "Beast";
  if (kj.includes("Transport")) return "Transport";
  if (keywords.includes("Infantry")) return "Infantry";
  if (keywords.includes("Aircraft")) return "Aircraft";
  if (keywords.includes("Fortification")) return "Fortification";
  return "Other";
}
function getConstraint(entry, type, field) {
  for (const c of arr(child(entry, "constraints.constraint"))) {
    if (c["@type"] === type && c["@field"] === field) return c["@value"];
  }
  return null;
}
function getConstraintId(entry, type, field) {
  for (const c of arr(child(entry, "constraints.constraint"))) {
    if (c["@type"] === type && c["@field"] === field) return c["@id"] || "";
  }
  return "";
}
var isOwnScope = (sc) => !sc || sc === "parent" || sc === "self";
function groupUnitCap(grp) {
  for (const c of arr(child(grp, "constraints.constraint"))) {
    if (c["@type"] === "max" && c["@field"] === "selections" && !isOwnScope(c["@scope"])) return intC(c["@value"], 0);
  }
  return null;
}
function effGroupBound(grp, type, linkMods, dflt, link) {
  const lv = link ? linkOwnBound(link, type, linkMods) : null;
  const v0 = groupOwnBound(grp, type, linkMods, dflt);
  if (lv == null) return v0;
  if (v0 === dflt && !arr(child(grp, "constraints.constraint")).some((c) => c["@type"] === type && c["@field"] === "selections")) return lv;
  return type === "max" ? Math.min(v0, lv) : Math.max(v0, lv);
}
function linkOwnBound(link, type, linkMods) {
  const cons = arr(child(link, "constraints.constraint")).filter((c) => c["@type"] === type && c["@field"] === "selections");
  const own = cons.find((c) => isOwnScope(c["@scope"])) || null;
  if (!own) return null;
  let v = intC(own["@value"], 0);
  const cid = own["@id"] || "";
  if (cid) for (const m of linkMods || []) {
    if (m["@field"] !== cid) continue;
    if (arr(child(m, "conditions.condition")).length || arr(child(m, "conditionGroups.conditionGroup")).length) continue;
    const mv = intC(m["@value"], 0);
    if (m["@type"] === "set") v = mv;
    else if (m["@type"] === "increment") v += mv;
    else if (m["@type"] === "decrement") v = Math.max(0, v - mv);
  }
  return v;
}
function groupOwnBound(grp, type, linkMods, dflt) {
  let v = dflt, cid = "";
  const cons = arr(child(grp, "constraints.constraint")).filter((c) => c["@type"] === type && c["@field"] === "selections");
  const own = cons.find((c) => isOwnScope(c["@scope"])) || cons[0];
  if (own) {
    v = intC(own["@value"], dflt);
    cid = own["@id"] || "";
  }
  if (cid && linkMods && linkMods.length) for (const m of linkMods) {
    if (m["@field"] !== cid) continue;
    if (arr(child(m, "conditions.condition")).length || arr(child(m, "conditionGroups.conditionGroup")).length) continue;
    const mv = intC(m["@value"], 0);
    if (m["@type"] === "set") v = mv;
    else if (m["@type"] === "increment") v += mv;
    else if (m["@type"] === "decrement") v = Math.max(0, v - mv);
  }
  return v;
}
function effEntryConstraint(node, type, unitCategoryIds, extraHosts) {
  if (!node) return null;
  let v = null, cid = "";
  for (const c of arr(child(node, "constraints.constraint"))) {
    if (c["@type"] === type && c["@field"] === "selections") {
      v = c["@value"];
      cid = c["@id"] || "";
      break;
    }
  }
  if (v == null || !cid) return v;
  let n = intC(v, 0);
  const hosts = [node, ...extraHosts || []];
  for (const m of hosts.flatMap((h) => arr(child(h, "modifiers.modifier")))) {
    if (m["@field"] !== cid) continue;
    if (arr(child(m, "conditions.condition")).length || arr(child(m, "conditionGroups.conditionGroup")).length) {
      if (unitCategoryIds == null || categoryCondsHold(m, unitCategoryIds) !== true) continue;
    }
    const mv = intC(m["@value"], 0);
    if (m["@type"] === "set") n = mv;
    else if (m["@type"] === "increment") n += mv;
    else if (m["@type"] === "decrement") n = Math.max(0, n - mv);
  }
  return String(n);
}
var UNIT_CHAR_TYPEIDS = {
  "e703-ecb6-5ce7-aec1": "M",
  "d29d-cf75-fc2d-34a4": "T",
  "450-a17e-9d5e-29da": "SV",
  "750a-a2ec-90d3-21fe": "W",
  "58d2-b879-49c7-43bc": "LD",
  "bef7-942a-1a23-59f8": "OC"
};
function extractStatMods(node) {
  const out = [];
  if (!node) return out;
  const scan = (m) => {
    const ty = m["@type"];
    if (ty !== "increment" && ty !== "decrement" && ty !== "set") return;
    if (!/profiles\.Unit\b/.test(m["@affects"] || "")) return;
    const ch = UNIT_CHAR_TYPEIDS[m["@field"]];
    if (!ch) return;
    if (arr(child(m, "conditions.condition")).length || arr(child(m, "conditionGroups.conditionGroup")).length) return;
    out.push({ ch, op: ty, val: String(m["@value"] ?? "") });
  };
  for (const m of arr(child(node, "modifiers.modifier"))) scan(m);
  for (const g of arr(child(node, "modifierGroups.modifierGroup"))) {
    if (arr(child(g, "conditions.condition")).length || arr(child(g, "conditionGroups.conditionGroup")).length) continue;
    for (const m of arr(child(g, "modifiers.modifier"))) scan(m);
  }
  return out;
}
var RANGED_CHAR_TYPEIDS = { "9896-9419-16a1-92fc": "Range", "3bb-c35f-f54-fb08": "A", "94d-8a98-cf90-183e": "BS", "2229-f494-25db-c5d3": "S", "9ead-8a10-520-de15": "AP", "a354-c1c8-a745-f9e3": "D", "7f1b-8591-2fcf-d01c": "KW" };
var MELEE_CHAR_TYPEIDS = { "914c-b413-91e3-a132": "Range", "2337-daa1-6682-b110": "A", "95d1-95f-45b4-11d6": "WS", "ab33-d393-96ce-ccba": "S", "41a0-1301-112a-e2f2": "AP", "3254-9fe6-d824-513e": "D", "893f-9000-ccf7-648e": "KW" };
var WMOD_SCOPES = /* @__PURE__ */ new Set(["model", "root-entry", "model-or-unit", "unit", "parent", "", "self", "upgrade"]);
var WMOD_OWN_SCOPES = /* @__PURE__ */ new Set(["", "self", "upgrade"]);
var WMOD_BEARER_SCOPES = /* @__PURE__ */ new Set(["ancestor", "unit", "model", "model-or-unit", "root-entry", "self", "parent"]);
function weaponNamesOfId(id, idIndex) {
  const n = id && idIndex && idIndex.get(id);
  if (!n) return null;
  if (n["@typeName"] != null) return isWeaponProfile(n) ? [String(n["@name"] || "").trim()].filter(Boolean) : null;
  const out = /* @__PURE__ */ new Set();
  for (const p of walk(n, "profile")) if (isWeaponProfile(p) && p["@name"]) out.add(String(p["@name"]).trim());
  for (const il of walk(n, "infoLink")) {
    const t = il["@type"] === "profile" && idIndex.get(il["@targetId"]);
    if (t && isWeaponProfile(t) && t["@name"]) out.add(String(t["@name"]).trim());
  }
  for (const el of walk(n, "entryLink")) {
    const t = idIndex.get(el["@targetId"]);
    if (t) {
      for (const p of walk(t, "profile")) if (isWeaponProfile(p) && p["@name"]) out.add(String(p["@name"]).trim());
    }
  }
  return out.size ? [...out] : null;
}
function extractWeaponMods(node, idIndex) {
  const out = [];
  if (!node) return out;
  for (const m of extractModifiers(node)) {
    const aff = String(m.affects || "");
    const am = aff.match(/^(?:self\.)?entries(?:\.recursive)?(?:\.([\w-]+))?\.profiles\.(Melee|Ranged) Weapons$/);
    if (!am) continue;
    if (!WMOD_SCOPES.has(String(m.scope || ""))) continue;
    const ty = am[2] === "Melee" ? "M" : "R";
    const ch = (ty === "M" ? MELEE_CHAR_TYPEIDS : RANGED_CHAR_TYPEIDS)[m.field];
    if (!ch) continue;
    const op = m.type;
    if (!["increment", "decrement", "set", "floor", "append"].includes(op)) continue;
    if (op === "append" && ch !== "KW") continue;
    const val = String(m.value ?? "").trim();
    if (!val) continue;
    let cg = null;
    if (cgHasCond(m.cg)) {
      const bearerOnly = (g) => (g.conds || []).every((c) => (c.type === "instanceOf" || c.type === "notInstanceOf") && WMOD_BEARER_SCOPES.has(c.scope)) && (g.groups || []).every(bearerOnly) && g.op !== "count";
      if (!bearerOnly(m.cg)) continue;
      cg = m.cg;
    }
    let w = null;
    if (am[1]) {
      w = weaponNamesOfId(am[1], idIndex);
      if (!w) continue;
    } else if (WMOD_OWN_SCOPES.has(String(m.scope || ""))) {
      w = weaponNamesOfId(node["@id"], idIndex);
      if (!w) continue;
    }
    out.push({ ty, ch, op, val, ...w ? { w } : {}, ...cg ? { cg } : {} });
  }
  return out;
}
function modelMaxScaling(m) {
  const id = getConstraintId(m, "max", "selections");
  if (!id) return null;
  const mods = extractModifiers(m).filter((mod) => mod.field === id);
  return mods.length ? { id, mods } : null;
}
function extractConditions(node) {
  const out = [];
  for (const c of arr(child(node, "conditions.condition"))) {
    out.push({
      type: c["@type"],
      field: c["@field"],
      value: Number(c["@value"]),
      scope: c["@scope"] || "",
      childId: c["@childId"] || "",
      shared: c["@shared"] === "true"
    });
  }
  return out;
}
function extractConditionGroup(node) {
  const op = (node["@type"] || "and").toLowerCase();
  const groups = arr(child(node, "conditionGroups.conditionGroup")).map(extractConditionGroup);
  const minCount = op === "count" ? intC(node["@min"], 1) : 0;
  return { op, conds: extractConditions(node), groups, minCount };
}
function conferredCategoryIds(node, catalogueId) {
  const out = [];
  const evalCond = (c) => {
    if (c["@scope"] !== "primary-catalogue") return null;
    const t = c["@type"];
    if (t === "instanceOf") return catalogueId === c["@childId"];
    if (t === "notInstanceOf") return catalogueId !== c["@childId"];
    return null;
  };
  const evalGroup = (g) => {
    const parts = [
      ...arr(child(g, "conditions.condition")).map(evalCond),
      ...arr(child(g, "conditionGroups.conditionGroup")).map(evalGroup)
    ];
    if (parts.length === 0 || parts.some((p) => p === null)) return null;
    return g["@type"] === "or" ? parts.some(Boolean) : parts.every(Boolean);
  };
  for (const { modifier: m, sharedCg } of walkModifiers(node)) {
    if (sharedCg) continue;
    if (m["@type"] !== "add" || m["@field"] !== "category" || !m["@value"]) continue;
    const parts = [
      ...arr(child(m, "conditions.condition")).map(evalCond),
      ...arr(child(m, "conditionGroups.conditionGroup")).map(evalGroup)
    ];
    if (parts.length === 0) {
      out.push(m["@value"]);
      continue;
    }
    if (parts.some((p) => p === null)) continue;
    if (parts.every(Boolean)) out.push(m["@value"]);
  }
  return out;
}
function removedCategoryIds(node, catalogueId) {
  const out = [];
  const evalCond = (c) => {
    if (c["@scope"] !== "primary-catalogue") return null;
    if (c["@type"] === "instanceOf") return catalogueId === c["@childId"];
    if (c["@type"] === "notInstanceOf") return catalogueId !== c["@childId"];
    return null;
  };
  const evalGroup = (g) => {
    const parts = [
      ...arr(child(g, "conditions.condition")).map(evalCond),
      ...arr(child(g, "conditionGroups.conditionGroup")).map(evalGroup)
    ];
    if (parts.length === 0 || parts.some((p) => p === null)) return null;
    return g["@type"] === "or" ? parts.some(Boolean) : parts.every(Boolean);
  };
  for (const { modifier: m, sharedCg } of walkModifiers(node)) {
    if (sharedCg) continue;
    if (m["@type"] !== "remove" && m["@type"] !== "unset-primary" || m["@field"] !== "category" || !m["@value"]) continue;
    const parts = [
      ...arr(child(m, "conditions.condition")).map(evalCond),
      ...arr(child(m, "conditionGroups.conditionGroup")).map(evalGroup)
    ];
    if (parts.length === 0) {
      out.push(m["@value"]);
      continue;
    }
    if (parts.some((p) => p === null)) continue;
    if (parts.every(Boolean)) out.push(m["@value"]);
  }
  return out;
}
function* walkModifiers(node) {
  for (const m of arr(child(node, "modifiers.modifier"))) {
    yield { modifier: m, sharedCg: null };
  }
  for (const mg of arr(child(node, "modifierGroups.modifierGroup"))) {
    const groupConds = extractConditions(mg);
    const groupCGs = arr(child(mg, "conditionGroups.conditionGroup")).map(extractConditionGroup);
    const sharedCg = groupConds.length || groupCGs.length ? { op: (mg["@type"] || "and").toLowerCase(), conds: groupConds, groups: groupCGs } : null;
    for (const m of arr(child(mg, "modifiers.modifier"))) {
      yield { modifier: m, sharedCg };
    }
  }
}
function extractModifiers(node) {
  const out = [];
  for (const { modifier: m, sharedCg } of walkModifiers(node)) {
    const directConds = extractConditions(m);
    const ownGroups = arr(child(m, "conditionGroups.conditionGroup")).map(extractConditionGroup);
    const repeats = arr(child(m, "repeats.repeat")).map((r) => ({
      value: Number(r["@value"]) || 1,
      repeats: Number(r["@repeats"]) || 1,
      field: r["@field"] || "selections",
      scope: r["@scope"] || "",
      childId: r["@childId"] || "",
      shared: r["@shared"] === "true",
      roundUp: r["@roundUp"] === "true"
    }));
    const cg = sharedCg ? { op: "and", conds: [], groups: [sharedCg, { op: "and", conds: directConds, groups: ownGroups }] } : { op: "and", conds: directConds, groups: ownGroups };
    out.push({
      type: m["@type"],
      field: m["@field"],
      value: m["@value"],
      // Cross-node targeting (weapon-characteristic modifiers — extractWeaponMods).
      ...m["@affects"] ? { affects: m["@affects"] } : {},
      ...m["@scope"] ? { scope: m["@scope"] } : {},
      cg,
      repeats,
      // The machine-readable <comment> on the modifier — carries the
      // "repeat-cost: threshold=N delta=Δ" marker for repetition pricing.
      comment: typeof m.comment === "string" ? m.comment : Array.isArray(m.comment) ? m.comment.filter((c) => typeof c === "string").join(" ") : ""
    });
  }
  return out;
}
var _ERR_SCOPE_SKIP = /* @__PURE__ */ new Set(["force", "forces", "roster", "root-entry", "primary-catalogue", "primary-category"]);
function _errCgDecidable(cg) {
  if (!cg) return true;
  for (const c of cg.conds || []) {
    if (c.type === "instanceOf" || c.type === "notInstanceOf") return false;
    if (c.field !== "selections") return false;
    if (_ERR_SCOPE_SKIP.has(String(c.scope || ""))) return false;
  }
  return (cg.groups || []).every(_errCgDecidable);
}
function collectErrorMods(entry, idIndex) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const seenMod = /* @__PURE__ */ new Set();
  const visit = (node, depth) => {
    if (!node || depth > 6) return;
    const nid = node["@id"] || "";
    if (nid) {
      if (seen.has(nid)) return;
      seen.add(nid);
    }
    for (const m of extractModifiers(node)) {
      if (m.field !== "error") continue;
      if (!_errCgDecidable(m.cg)) continue;
      const msg = String(m.value || "").replace(/\{this\}/g, node["@name"] || "").trim();
      if (!msg) continue;
      const key = msg + "|" + JSON.stringify(m.cg);
      if (seenMod.has(key)) continue;
      seenMod.add(key);
      out.push({ msg, cg: m.cg });
    }
    for (const g of arr(child(node, "selectionEntryGroups.selectionEntryGroup"))) visit(g, depth + 1);
    for (const se of arr(child(node, "selectionEntries.selectionEntry"))) visit(se, depth + 1);
    for (const el of arr(child(node, "entryLinks.entryLink"))) {
      for (const m of extractModifiers(el)) {
        if (m.field !== "error" || !_errCgDecidable(m.cg)) continue;
        const msg = String(m.value || "").replace(/\{this\}/g, el["@name"] || "").trim();
        const key = msg + "|" + JSON.stringify(m.cg);
        if (msg && !seenMod.has(key)) {
          seenMod.add(key);
          out.push({ msg, cg: m.cg });
        }
      }
      const tgt = idIndex.get(el["@targetId"]);
      if (tgt) visit(tgt, depth + 1);
    }
  };
  visit(entry, 0);
  return out;
}
function repeatCondOf(cg) {
  if (!cg) return null;
  for (const c of cg.conds || []) if (c.type === "atLeast" && c.scope === "roster") return c;
  for (const g of cg.groups || []) {
    const r = repeatCondOf(g);
    if (r) return r;
  }
  return null;
}
function repeatCostShape(m) {
  if (m.field !== PTS_COST_TYPE_ID || m.type !== "increment") return null;
  const c = repeatCondOf(m.cg);
  if (!c) return null;
  const k = intC(c.value, 0);
  if (k < 2) return null;
  return { threshold: k - 1, delta: intC(m.value, 0) };
}
function getRepeatCost(entry) {
  for (const m of extractModifiers(entry)) {
    const r = repeatCostShape(m);
    if (r) return r;
  }
  return null;
}
function linkHiddenGate(il) {
  const hm = extractModifiers(il).filter((m) => m.type === "set" && m.field === "hidden");
  if (!hm.length) return null;
  return { b: String(il["@hidden"]) === "true", m: hm.map((m) => ({ v: String(m.value) === "true", cg: m.cg })) };
}
function mergeHiddenGates(a, b) {
  if (!a) return b;
  if (!b) return a;
  return { b: !!a.b || !!b.b, m: [...a.m || [], ...b.m || []] };
}
function runtimeHiddenGate(node) {
  const runtimeCond = (c) => c.field === "selections" && (c.scope === "force" || c.scope === "roster") || (c.type === "instanceOf" || c.type === "notInstanceOf") && c.scope === "primary-catalogue";
  const allRuntime = (cg) => !!cg && (cg.conds || []).every(runtimeCond) && (cg.groups || []).every(allRuntime);
  const hasCond = (cg) => !!cg && ((cg.conds || []).length > 0 || (cg.groups || []).some(hasCond));
  const hm = extractModifiers(node).filter((m) => m.type === "set" && m.field === "hidden" && hasCond(m.cg) && allRuntime(m.cg));
  if (!hm.length) return null;
  return { b: String(node["@hidden"]) === "true", m: hm.map((m) => ({ v: String(m.value) === "true", cg: m.cg })) };
}
function intC(v, dflt) {
  if (v == null) return dflt;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : dflt;
}
function weaponAsArray(w) {
  return [w.n, w.t, w.rng, w.a, w.sk, w.s, w.ap, w.d, w.kw, ...w.count > 1 ? [w.count] : []];
}
function removableMin(nodeA, nodeB) {
  const nodes = [nodeA, nodeB].filter(Boolean);
  const mins = [];
  for (const n of nodes) for (const c of arr(child(n, "constraints.constraint"))) {
    if (c["@type"] === "min" && c["@field"] === "selections" && intC(c["@value"], 0) >= 1 && c["@id"]) mins.push(c["@id"]);
  }
  if (!mins.length) return false;
  for (const n of nodes) for (const m of arr(child(n, "modifiers.modifier"))) {
    if (m["@type"] !== "set" || String(m["@value"]) !== "0" || !mins.includes(m["@field"])) continue;
    if (arr(child(m, "conditions.condition")).length || arr(child(m, "conditionGroups.conditionGroup")).length) continue;
    return true;
  }
  return false;
}
function collectDirectWeapons(entry, idIndex, idsOut) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (p, count, ids) => {
    if (!isWeaponProfile(p)) return;
    if (idsOut && ids) {
      for (const x of ids) if (x) idsOut.add(x);
    }
    const id = p["@id"] || "";
    if (id && seen.has(id)) return;
    if (id) seen.add(id);
    const w = fmtWeapon(p);
    if (count > 1) w.count = count;
    out.push(w);
  };
  const infoLinkProfiles = (node) => {
    if (!idIndex) return [];
    const r = [];
    for (const il of arr(child(node, "infoLinks.infoLink"))) {
      if (il["@type"] !== "profile") continue;
      const t = idIndex.get(il["@targetId"]);
      if (t && isWeaponProfile(t)) r.push(t);
    }
    return r;
  };
  const allProfilesOf = (node) => arr(child(node, "profiles.profile")).filter(isWeaponProfile).concat(infoLinkProfiles(node));
  const nestedForced = (node, depth) => {
    const out2 = [];
    if (!node || depth > 2) return out2;
    for (const el of arr(child(node, "entryLinks.entryLink"))) {
      const tgt = idIndex.get(el["@targetId"]);
      if (!tgt || tgt["@type"] !== "upgrade") continue;
      const minRaw = getConstraint(el, "min", "selections") ?? getConstraint(tgt, "min", "selections");
      const mn = intC(minRaw, 0);
      if (mn < 1 && !(getDefaultAmount(el) || getDefaultAmount(tgt))) continue;
      const k = mn > 0 ? mn : 1;
      for (const p of allProfilesOf(tgt)) out2.push([p, k]);
      for (const [p, kk] of nestedForced(tgt, depth + 1)) out2.push([p, k * kk]);
    }
    for (const se of arr(child(node, "selectionEntries.selectionEntry"))) {
      if (se["@type"] !== "upgrade") continue;
      const minRaw = getConstraint(se, "min", "selections");
      const mn = intC(minRaw, 0);
      if (mn < 1 && !getDefaultAmount(se)) continue;
      const k = mn > 0 ? mn : 1;
      for (const p of allProfilesOf(se)) out2.push([p, k]);
      for (const [p, kk] of nestedForced(se, depth + 1)) out2.push([p, k * kk]);
    }
    return out2;
  };
  if (entry["@type"] === "model") for (const p of allProfilesOf(entry)) add(p, 1, [entry["@id"]]);
  for (const el of arr(child(entry, "entryLinks.entryLink"))) {
    const tgt = idIndex.get(el["@targetId"]);
    if (!tgt) continue;
    const tgtProfiles = allProfilesOf(tgt);
    const elMinRaw = getConstraint(el, "min", "selections") ?? getConstraint(tgt, "min", "selections");
    const elMin = intC(elMinRaw, 0);
    if (elMin < 1 && !(getDefaultAmount(el) || getDefaultAmount(tgt)) && (getConstraint(el, "max", "selections") != null || getConstraint(tgt, "max", "selections") != null)) continue;
    if (removableMin(el, tgt)) continue;
    const cnt = elMin > 0 ? elMin : 1;
    for (const p of tgtProfiles) add(p, cnt, [el["@id"], tgt["@id"]]);
    for (const [p, k] of nestedForced(tgt, 1)) add(p, cnt * k, [el["@id"], tgt["@id"]]);
  }
  for (const se of arr(child(entry, "selectionEntries.selectionEntry"))) {
    if (se["@type"] !== "upgrade") continue;
    const subProfiles = allProfilesOf(se);
    const seMinRaw = getConstraint(se, "min", "selections");
    if (seMinRaw != null && intC(seMinRaw, 0) < 1 && !getDefaultAmount(se)) continue;
    if (seMinRaw == null && !getDefaultAmount(se) && getConstraint(se, "max", "selections") != null) continue;
    if (seMinRaw != null && intC(seMinRaw, 0) >= 1 && intC(getConstraint(se, "max", "selections"), 0) > intC(seMinRaw, 0) && (entry["@type"] === "model" || entry["@type"] === "unit")) continue;
    if (removableMin(se)) continue;
    const seMin = intC(seMinRaw, 0);
    const cnt = seMin > 0 ? seMin : 1;
    for (const p of subProfiles) add(p, cnt, [se["@id"]]);
    for (const [p, k] of nestedForced(se, 1)) add(p, cnt * k, [se["@id"]]);
  }
  function collectForced(grp) {
    for (const se of arr(child(grp, "selectionEntries.selectionEntry"))) {
      if (se["@type"] !== "upgrade") continue;
      const seMin = intC(getConstraint(se, "min", "selections"), 0);
      if (seMin < 1) continue;
      if (removableMin(se)) continue;
      const subProfiles = allProfilesOf(se);
      for (const p of subProfiles) add(p, seMin, [se["@id"]]);
    }
    if (isTransparentGroup(grp)) {
      for (const el of arr(child(grp, "entryLinks.entryLink"))) {
        if (isCrusadeOnlyEntry(idIndex && idIndex.get(el["@targetId"]) || null, el)) continue;
        if (el["@hidden"] === "true") continue;
        const tgt = idIndex.get(el["@targetId"]);
        const elMinRaw = getConstraint(el, "min", "selections");
        const tgtMin = tgt ? intC(getConstraint(tgt, "min", "selections"), 0) : 0;
        const elMin = elMinRaw != null ? intC(elMinRaw, 0) : tgtMin;
        const elDflt = getDefaultAmount(el) || (tgt ? getDefaultAmount(tgt) : 0);
        if (elMin < 1 && elDflt < 1) continue;
        if (!tgt) continue;
        if (removableMin(el, tgt)) continue;
        const tgtProfiles = allProfilesOf(tgt);
        const cnt = Math.max(elMin, elDflt, 1);
        for (const p of tgtProfiles) add(p, cnt, [el["@id"], tgt["@id"]]);
      }
    }
    if (!isTransparentGroup(grp)) {
      const gEls = arr(child(grp, "entryLinks.entryLink")).filter((el) => el["@hidden"] !== "true");
      const gSes = arr(child(grp, "selectionEntries.selectionEntry")).filter((se) => se["@type"] === "upgrade");
      const grpMin = intC(getConstraint(grp, "min", "selections"), 0);
      if (gEls.length === 1 && gSes.length === 0 && grpMin >= 1) {
        const el = gEls[0];
        const tgt = idIndex.get(el["@targetId"]);
        if (tgt) {
          const tgtProfiles = allProfilesOf(tgt);
          if (tgtProfiles.some(isWeaponProfile)) {
            const cnt = Math.max(grpMin, intC(getConstraint(el, "min", "selections"), 0), 1);
            for (const p of tgtProfiles) add(p, cnt, [el["@id"], tgt["@id"]]);
          }
        }
      }
    }
    for (const sg of arr(child(grp, "selectionEntryGroups.selectionEntryGroup"))) {
      collectForced(sg);
    }
  }
  for (const grp of arr(child(entry, "selectionEntryGroups.selectionEntryGroup"))) {
    collectForced(grp);
  }
  return out;
}
function collectModelWeapons(entry, idIndex) {
  return collectDirectWeapons(entry, idIndex).map(weaponAsArray);
}
function collectModelAbilities(entry, idIndex) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const addProfile = (p) => {
    if (!isAbilityProfile(p)) return;
    const id = p["@id"] || "";
    if (id && seen.has(id)) return;
    if (id) seen.add(id);
    const c = characteristics(p);
    const desc = c.Description || "";
    if (desc) out.push([p["@name"] || "", desc]);
  };
  const scanNode = (node) => {
    for (const p of arr(child(node, "profiles.profile"))) addProfile(p);
    if (idIndex) {
      for (const il of arr(child(node, "infoLinks.infoLink"))) {
        if (il["@type"] !== "profile") continue;
        const t = idIndex.get(il["@targetId"]);
        if (t) addProfile(t);
      }
    }
  };
  for (const el of arr(child(entry, "entryLinks.entryLink"))) {
    if (el["@hidden"] === "true") continue;
    const tgt = idIndex && idIndex.get(el["@targetId"]);
    if (!tgt) continue;
    const elMinRaw = getConstraint(el, "min", "selections");
    const tgtMin = intC(getConstraint(tgt, "min", "selections"), 0);
    const elMin = elMinRaw != null ? intC(elMinRaw, 0) : tgtMin;
    const isCollective = tgt["@collective"] === "true";
    if (elMin < 1 && !isCollective) continue;
    scanNode(tgt);
  }
  for (const se of arr(child(entry, "selectionEntries.selectionEntry"))) {
    if (se["@type"] !== "upgrade") continue;
    const seMin = intC(getConstraint(se, "min", "selections"), 0);
    if (seMin < 1 && se["@collective"] !== "true") continue;
    scanNode(se);
  }
  return out;
}
function getDefaultAmount(node) {
  let amount = 0;
  const raw = node && node["@defaultAmount"];
  if (raw) amount = intC(String(raw).split(",")[0].trim(), 0);
  if (node) {
    for (const m of arr(child(node, "modifiers.modifier"))) {
      if (m["@type"] !== "set" || m["@field"] !== "defaultAmount") continue;
      if (arr(child(m, "conditions.condition")).length || arr(child(m, "conditionGroups.conditionGroup")).length) continue;
      amount = intC(m["@value"], amount);
    }
  }
  return amount;
}
function hasExplicitDefaultAmount(node) {
  if (!node) return false;
  if (node["@defaultAmount"] != null && node["@defaultAmount"] !== "") return true;
  for (const m of arr(child(node, "modifiers.modifier"))) {
    if (m["@type"] !== "set" || m["@field"] !== "defaultAmount") continue;
    if (arr(child(m, "conditions.condition")).length || arr(child(m, "conditionGroups.conditionGroup")).length) continue;
    return true;
  }
  return false;
}
function resolveLinkedModels(node, idIndex) {
  if (!idIndex) return [];
  const out = [];
  for (const el of arr(child(node, "entryLinks.entryLink"))) {
    if (el["@type"] !== "selectionEntry" || el["@hidden"] === "true") continue;
    const tgt = idIndex.get(el["@targetId"]);
    if (!tgt || tgt["@type"] !== "model" || tgt["@hidden"] === "true") continue;
    out.push({
      ...tgt,
      "@name": el["@name"] || tgt["@name"],
      "@id": el["@id"] || tgt["@id"],
      // The link's targetId — kept so the cost engine can count this model by
      // the SHARED entry id that conditions reference (Headtakers conditions
      // gate on the target c135, not the per-datasheet link id).
      "@_targetId": el["@targetId"] || "",
      "@sortIndex": el["@sortIndex"] != null ? el["@sortIndex"] : tgt["@sortIndex"],
      "@defaultAmount": el["@defaultAmount"] != null ? el["@defaultAmount"] : tgt["@defaultAmount"],
      constraints: {
        constraint: [
          ...arr(child(el, "constraints.constraint")),
          ...arr(child(tgt, "constraints.constraint"))
        ]
      },
      modifiers: {
        modifier: [
          ...arr(child(el, "modifiers.modifier")),
          ...arr(child(tgt, "modifiers.modifier"))
        ]
      }
    });
  }
  return out;
}
function entryPts(node) {
  for (const c of arr(child(node, "costs.cost"))) {
    if (c["@name"] === "pts") return intC(c["@value"], 0);
  }
  return 0;
}
function entryCategoryIds(...nodes) {
  const out = [];
  for (const n of nodes) {
    if (!n) continue;
    for (const cl of arr(child(n, "categoryLinks.categoryLink"))) {
      const id = cl["@targetId"];
      if (id && !out.includes(id)) out.push(id);
    }
  }
  return out;
}
function entryHasWeaponProfile(tgt, idIndex) {
  if (arr(child(tgt, "profiles.profile")).some(isWeaponProfile)) return true;
  for (const il of arr(child(tgt, "infoLinks.infoLink"))) {
    if (il["@type"] && il["@type"] !== "profile") continue;
    const t2 = idIndex.get(il["@targetId"]);
    if (t2 && isWeaponProfile(t2)) return true;
  }
  return false;
}
function collectModelFixedWeaponIds(m, idIndex) {
  const ids = [];
  const push = (...xs) => {
    for (const x of xs) if (x && !ids.includes(x)) ids.push(x);
  };
  for (const el of arr(child(m, "entryLinks.entryLink"))) {
    if (el["@type"] !== "selectionEntry") continue;
    const tgt = idIndex.get(el["@targetId"]);
    if (!tgt || !entryHasWeaponProfile(tgt, idIndex)) continue;
    const linkMin = getConstraint(el, "min", "selections");
    const tgtMinP = arr(child(tgt, "constraints.constraint")).find((c) => c["@type"] === "min" && c["@field"] === "selections" && (c["@scope"] || "parent") === "parent");
    const fixed = linkMin != null ? intC(linkMin, 0) >= 1 : tgtMinP ? intC(tgtMinP["@value"], 0) >= 1 : false;
    if (fixed) push(el["@id"], el["@targetId"]);
  }
  for (const se of arr(child(m, "selectionEntries.selectionEntry"))) {
    if (se["@type"] !== "upgrade" || se["@hidden"] === "true") continue;
    if (!arr(child(se, "profiles.profile")).some(isWeaponProfile)) continue;
    if (intC(getConstraint(se, "min", "selections"), 0) >= 1) push(se["@id"]);
  }
  return ids;
}
function collectCompMods(entry) {
  const byId = /* @__PURE__ */ new Map();
  const skip = /* @__PURE__ */ new Set(["selections", "category", "hidden", "error", PTS_COST_TYPE_ID]);
  const visit = (node, gate) => {
    for (const m of extractModifiers(node)) {
      if (!["set", "increment", "add", "decrement", "subtract", "multiply"].includes(m.type)) continue;
      if (!m.field || skip.has(m.field)) continue;
      if (!byId.has(m.field)) byId.set(m.field, []);
      byId.get(m.field).push({ type: m.type, value: m.value, cg: m.cg, repeats: m.repeats, gate });
    }
    for (const se of arr(child(node, "selectionEntries.selectionEntry"))) {
      if (se["@hidden"] === "true") continue;
      visit(se, se["@id"] || gate);
    }
    for (const el of arr(child(node, "entryLinks.entryLink"))) {
      if (el["@hidden"] === "true") continue;
      visit(el, el["@id"] || gate);
    }
    for (const g of arr(child(node, "selectionEntryGroups.selectionEntryGroup"))) {
      if (g["@hidden"] === "true") continue;
      visit(g, gate);
    }
  };
  visit(entry, "");
  return byId;
}
function buildDynBounds(node, compMods) {
  if (!compMods || !compMods.size) return null;
  const minId = getConstraintId(node, "min", "selections");
  const maxId = getConstraintId(node, "max", "selections");
  const minMods = minId && compMods.get(minId) ? compMods.get(minId) : [];
  const maxMods = maxId && compMods.get(maxId) ? compMods.get(maxId) : [];
  if (!minMods.length && !maxMods.length) return null;
  return { minId, maxId, minMods, maxMods };
}
function getComp(entry, idIndex) {
  const compMods = collectCompMods(entry);
  const comp = [];
  const directModels = [
    ...resolveLinkedModels(entry, idIndex),
    ...arr(child(entry, "selectionEntries.selectionEntry")).filter((sub) => sub["@type"] === "model" && sub["@hidden"] !== "true")
  ].slice().sort((a, b) => intC(a["@sortIndex"], 1e6) - intC(b["@sortIndex"], 1e6));
  const selfMaxParent = (() => {
    const c = arr(child(entry, "constraints.constraint")).find((x) => x["@type"] === "max" && x["@field"] === "selections" && x["@scope"] === "parent");
    return c ? intC(c["@value"], 1) : 1;
  })();
  const selfModelRow = !directModels.length && entry["@type"] === "model" && selfMaxParent > 1;
  if (selfModelRow) directModels.push(entry);
  if (directModels.length > 0) {
    let gMin = 0, gMax = 0;
    const fixedModels = directModels.map((m) => {
      const mMinRaw = getConstraint(m, "min", "selections");
      const mMaxRaw = getConstraint(m, "max", "selections");
      const mMax = intC(mMaxRaw, 1);
      const mMin = mMinRaw != null ? intC(mMinRaw, 1) : mMaxRaw != null ? 0 : 1;
      gMin += mMin;
      gMax += mMax;
      return [
        m["@name"] || "",
        mMax,
        collectModelWeapons(m, idIndex),
        getDefaultAmount(m),
        mMin,
        collectModelAbilities(m, idIndex),
        modelMaxScaling(m),
        entryPts(m),
        [m["@id"], m["@_targetId"]].filter(Boolean),
        buildDynBounds(m, compMods)
      ];
    });
    if (selfModelRow) {
      fixedModels[0][5] = [];
      fixedModels[0][7] = 0;
    }
    comp.push(["_fixed", gMin || 1, gMax || 1, fixedModels, [], [], entry["@id"] || ""]);
  }
  for (const grp of arr(child(entry, "selectionEntryGroups.selectionEntryGroup"))) {
    if (grp["@hidden"] === "true") continue;
    const grpName = grp["@name"] || "";
    const grpMinRaw = getConstraint(grp, "min", "selections");
    const grpMaxRaw = getConstraint(grp, "max", "selections");
    let min = intC(grpMinRaw, 0);
    let max = intC(grpMaxRaw, 1);
    const models = [];
    const rowByName = /* @__PURE__ */ new Map();
    let childMinSum = 0;
    let childMaxSum = 0;
    const addModel = (m, parentMax, extraId) => {
      const nm = m["@name"] || "";
      if (!nm) return;
      if (m["@hidden"] === "true") return;
      const mMaxRaw = getConstraint(m, "max", "selections");
      const mMax = mMaxRaw != null ? intC(mMaxRaw, 1) : parentMax != null ? parentMax : 1;
      const mMin = intC(getConstraint(m, "min", "selections"), 0);
      childMinSum += mMin;
      childMaxSum += mMax;
      const existing = rowByName.get(nm);
      if (existing) {
        existing[1] += mMax;
        existing[3] += getDefaultAmount(m);
        existing[4] += mMin;
        if (!existing[7]) existing[7] = entryPts(m);
        const wSeen = new Set(existing[2].map((w) => w.join("|")));
        for (const w of collectModelWeapons(m, idIndex)) {
          const k = w.join("|");
          if (!wSeen.has(k)) {
            wSeen.add(k);
            existing[2].push(w);
          }
        }
        const aSeen = new Set(existing[5].map((a) => a[0]));
        for (const a of collectModelAbilities(m, idIndex)) {
          if (!aSeen.has(a[0])) {
            aSeen.add(a[0]);
            existing[5].push(a);
          }
        }
        if (!existing[6]) existing[6] = modelMaxScaling(m);
        return;
      }
      const row = [
        nm,
        mMax,
        collectModelWeapons(m, idIndex),
        getDefaultAmount(m),
        mMin,
        collectModelAbilities(m, idIndex),
        modelMaxScaling(m),
        entryPts(m),
        // Slot 8: every id this model answers to in count conditions — its own
        // id, the shared targetId when it came in via an entryLink, AND the
        // enclosing sub-group's id when it was flattened out of one (extraId).
        // Cross-node modifiers can reference the SUB-GROUP: the Khorne
        // Berzerker base decrements its max once per model in "Berzerkers with
        // alternate weapons" (childId = that sub-group). Without the id in the
        // counts map the decrement never fired and the absorbed-add-on size
        // bound couldn't recognise the members — a 31-model squad validated.
        [m["@id"], m["@_targetId"], extraId].filter(Boolean),
        buildDynBounds(m, compMods),
        // Slot 10: fixed weapon ids this model carries (counts fodder for the
        // error modifiers' weapon-count conditions — collectModelFixedWeaponIds).
        collectModelFixedWeaponIds(m, idIndex),
        // Slot 11: the model's category ids — count conditions referencing a
        // CATEGORY (Indomitor Kill Team's hidden gating categories). Kept in
        // their own slot, NOT slot 8: slot 8 feeds compAbsorbedIds' size-bound
        // absorption, where a shared category would wrongly zero whole rows.
        entryCategoryIds(m)
      ];
      models.push(row);
      rowByName.set(nm, row);
    };
    const nameById = /* @__PURE__ */ new Map();
    const directs = [
      ...resolveLinkedModels(grp, idIndex),
      ...arr(child(grp, "selectionEntries.selectionEntry")).filter((m) => m["@type"] === "model")
    ].sort((a, b) => intC(a["@sortIndex"], 1e6) - intC(b["@sortIndex"], 1e6));
    const grpMaxForChildren = intC(grpMaxRaw, 99);
    for (const m of directs) {
      addModel(m, grpMaxForChildren);
      if (m["@id"] && m["@name"]) nameById.set(m["@id"], m["@name"]);
    }
    const subCaps = [];
    const linkedSubGroups = arr(child(grp, "entryLinks.entryLink")).filter((el) => el["@type"] === "selectionEntryGroup" && el["@hidden"] !== "true").map((el) => {
      const t = idIndex && idIndex.get(el["@targetId"]);
      return t ? {
        ...t,
        "@name": el["@name"] || t["@name"],
        constraints: { constraint: [...arr(child(el, "constraints.constraint")), ...arr(child(t, "constraints.constraint"))] },
        modifiers: { modifier: [...arr(child(el, "modifiers.modifier")), ...arr(child(t, "modifiers.modifier"))] }
      } : null;
    }).filter(Boolean);
    for (const sg of [...arr(child(grp, "selectionEntryGroups.selectionEntryGroup")), ...linkedSubGroups]) {
      if (sg["@hidden"] === "true") continue;
      const sgName = sg["@name"] || "";
      const sgMaxCstr = arr(child(sg, "constraints.constraint")).find((c) => c["@type"] === "max" && c["@field"] === "selections");
      const sgMax = intC(sgMaxCstr && sgMaxCstr["@value"], 99);
      const sgMaxId = sgMaxCstr && sgMaxCstr["@id"] || "";
      const sgMinCstr = arr(child(sg, "constraints.constraint")).find((c) => c["@type"] === "min" && c["@field"] === "selections");
      const sgMin = intC(sgMinCstr && sgMinCstr["@value"], 0);
      const sgModelNames = [];
      const sgDirects = [
        ...resolveLinkedModels(sg, idIndex),
        ...arr(child(sg, "selectionEntries.selectionEntry")).filter((m) => m["@type"] === "model" && m["@hidden"] !== "true")
      ].sort((a, b) => intC(a["@sortIndex"], 1e6) - intC(b["@sortIndex"], 1e6));
      const outsideNames = new Set(rowByName.keys());
      for (const m of sgDirects) {
        const nm = m["@name"] || "";
        if (nm && !outsideNames.has(nm) && !sgModelNames.includes(nm)) sgModelNames.push(nm);
        if (m["@id"] && nm) nameById.set(m["@id"], nm);
        addModel(m, sgMax, sg["@id"]);
      }
      let sgDefault = "";
      let sgMinEff = sgMin;
      const sgDefId = sg["@defaultSelectionEntryId"] || "";
      if (sgDefId) {
        sgDefault = nameById.get(sgDefId) || "";
        if (!sgDefault) for (const el of arr(child(sg, "entryLinks.entryLink"))) {
          if (el["@id"] !== sgDefId) continue;
          const t = idIndex.get(el["@targetId"]);
          if (t && t["@name"]) sgDefault = t["@name"];
        }
        if (sgDefault && !sgModelNames.includes(sgDefault)) {
          sgDefault = "";
          sgMinEff = 0;
        }
      }
      if (sgModelNames.length > 0 && (sgMax < 99 || sgMin > 0)) {
        const sgMods = extractModifiers(sg);
        if (sgMax > 0 || sgMods.length > 0 || sgMin > 0) {
          subCaps.push([sgName, sgMax < 99 ? sgMax : grpMaxForChildren, sgModelNames, sg["@id"] || "", sgMods, sgMaxId, sgMinEff, sgDefault]);
        }
      }
    }
    if (grpMinRaw == null && childMinSum > min) min = childMinSum;
    if (grpMaxRaw == null && childMaxSum > max) max = childMaxSum;
    const resolveDefault = (id, depth) => {
      if (!id || depth > 4) return "";
      if (nameById.has(id)) return nameById.get(id);
      const sg = walk(grp, "selectionEntryGroup").find((g) => g["@id"] === id);
      if (!sg) return "";
      const viaDefault = resolveDefault(sg["@defaultSelectionEntryId"] || "", depth + 1);
      if (viaDefault) return viaDefault;
      const first = [...resolveLinkedModels(sg, idIndex), ...arr(child(sg, "selectionEntries.selectionEntry")).filter((m) => m["@type"] === "model")].sort((a, b) => intC(a["@sortIndex"], 1e6) - intC(b["@sortIndex"], 1e6))[0];
      return first ? nameById.get(first["@id"]) || first["@name"] || "" : "";
    };
    const defaultName = resolveDefault(grp["@defaultSelectionEntryId"] || "", 0);
    if (models.length > 0) comp.push([grpName, min, max, models, [], subCaps, grp["@id"] || "", defaultName, buildDynBounds(grp, compMods)]);
  }
  for (const nested of arr(child(entry, "selectionEntries.selectionEntry"))) {
    if (nested["@type"] !== "unit" || nested["@hidden"] === "true") continue;
    comp.push(...getComp(nested, idIndex));
  }
  return comp;
}
function choiceUnitMax(...nodes) {
  for (const n of nodes) {
    if (!n) continue;
    for (const c of arr(child(n, "constraints.constraint"))) {
      if (c["@type"] !== "max" || c["@field"] !== "selections") continue;
      const sc = c["@scope"] || "";
      if (sc === "parent" || sc === "self") continue;
      let base = intC(c["@value"], 0);
      const lt = [];
      let per = null;
      for (const m of arr(child(n, "modifiers.modifier"))) {
        if (m["@field"] !== c["@id"]) continue;
        const conds = [...arr(child(m, "conditions.condition")), ...arr(child(m, "conditionGroups.conditionGroup")).flatMap((g) => arr(child(g, "conditions.condition")))];
        if (m["@type"] === "set") {
          for (const cond of conds) if (cond["@type"] === "lessThan") lt.push([intC(cond["@value"], 0), intC(m["@value"], 0)]);
        } else if (m["@type"] === "increment") {
          const al = conds.find((cond) => cond["@type"] === "atLeast");
          if (al) {
            lt.push([intC(al["@value"], 0), base]);
            base += intC(m["@value"], 0);
          }
          for (const r of arr(child(m, "repeats.repeat"))) {
            if (r["@field"] !== "selections" || r["@scope"] !== "unit" || r["@childId"] !== "model") continue;
            const every = intC(r["@value"], 0);
            const add = intC(m["@value"], 0) * (intC(r["@repeats"], 1) || 1);
            if (every > 0 && add > 0) per = [every, add];
          }
        }
      }
      return lt.length || per ? { base, ...lt.length ? { lt } : {}, ...per ? { per } : {} } : base;
    }
  }
  return null;
}
function pickOptionWeaponProfile(targetEntry, idIndex) {
  if (!targetEntry) return null;
  const profs = arr(child(targetEntry, "profiles.profile")).filter(isWeaponProfile);
  for (const ig of arr(child(targetEntry, "infoGroups.infoGroup")))
    profs.push(...arr(child(ig, "profiles.profile")).filter(isWeaponProfile));
  if (!idIndex) return profs.length === 1 ? fmtWeapon(profs[0]) : profs.length > 1 ? profs.map((p) => fmtWeapon(p)) : null;
  const linked = [];
  for (const il of arr(child(targetEntry, "infoLinks.infoLink"))) {
    if (il["@type"] !== "profile") continue;
    const t = idIndex.get(il["@targetId"]);
    if (t && isWeaponProfile(t)) linked.push(t);
  }
  const seenSig = /* @__PURE__ */ new Set();
  const merged = [];
  const pushW = (w) => {
    const sig = `${w.n}|${w.t}|${w.s}|${w.ap}|${w.d}`;
    if (!seenSig.has(sig)) {
      seenSig.add(sig);
      merged.push(w);
    }
  };
  for (const p of profs) pushW(fmtWeapon(p));
  for (const t of linked) pushW(fmtWeapon(t));
  const addFrom = (e, count = 1) => {
    if (!e) return;
    const stamp = (w) => {
      if (count > 1) w.count = count;
      return w;
    };
    for (const p of arr(child(e, "profiles.profile"))) if (isWeaponProfile(p)) pushW(stamp(fmtWeapon(p)));
    for (const il of arr(child(e, "infoLinks.infoLink"))) {
      if (il["@type"] !== "profile") continue;
      const t = idIndex.get(il["@targetId"]);
      if (t && isWeaponProfile(t)) pushW(stamp(fmtWeapon(t)));
    }
  };
  for (const sub of arr(child(targetEntry, "selectionEntries.selectionEntry"))) addFrom(sub, Math.max(1, intC(getConstraint(sub, "min", "selections"), 1)));
  for (const el of arr(child(targetEntry, "entryLinks.entryLink"))) {
    if (el["@type"] === "selectionEntry") {
      const t = idIndex.get(el["@targetId"]);
      addFrom(t, Math.max(1, intC(getConstraint(el, "min", "selections") ?? (t ? getConstraint(t, "min", "selections") : null), 1)));
    }
  }
  if (merged.length === 1) return merged[0];
  if (merged.length > 1) return merged;
  return null;
}
function pickComboWeaponProfiles(targetEntry, idIndex) {
  if (!targetEntry) return null;
  if (arr(child(targetEntry, "profiles.profile")).some(isWeaponProfile)) return null;
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (p) => {
    if (!isWeaponProfile(p)) return;
    const w = fmtWeapon(p);
    const sig = `${w.n}|${w.t}|${w.s}|${w.ap}|${w.d}`;
    if (!seen.has(sig)) {
      seen.add(sig);
      out.push(w);
    }
  };
  const addFrom = (e) => {
    if (!e) return;
    for (const p of arr(child(e, "profiles.profile"))) push(p);
    for (const il of arr(child(e, "infoLinks.infoLink"))) {
      if (il["@type"] !== "profile") continue;
      const tgt = idIndex && idIndex.get(il["@targetId"]);
      if (tgt) push(tgt);
    }
  };
  for (const sub of arr(child(targetEntry, "selectionEntries.selectionEntry"))) addFrom(sub);
  for (const el of arr(child(targetEntry, "entryLinks.entryLink"))) {
    if (el["@type"] === "selectionEntry") addFrom(idIndex && idIndex.get(el["@targetId"]));
  }
  return out.length ? out : null;
}
function pickOptionAbilityDesc(targetEntry, unitCategoryIds, idIndex) {
  if (!targetEntry) return null;
  const cats = unitCategoryIds || /* @__PURE__ */ new Set();
  const fromProfile = (p) => {
    if (!isAbilityProfile(p) || isProfileHiddenFor(p, cats)) return null;
    const c = characteristics(p);
    return c.Description ? { name: p["@name"] || "", desc: c.Description } : null;
  };
  for (const p of arr(child(targetEntry, "profiles.profile"))) {
    const r = fromProfile(p);
    if (r) return r;
  }
  if (idIndex) {
    for (const il of arr(child(targetEntry, "infoLinks.infoLink"))) {
      if (il["@type"] !== "profile") continue;
      const r = fromProfile(idIndex.get(il["@targetId"]) || {});
      if (r) return r;
    }
  }
  const forcedKids = [
    ...arr(child(targetEntry, "selectionEntries.selectionEntry")).filter((k) => k["@type"] === "upgrade" && !(getConstraint(k, "min", "selections") == null && getConstraint(k, "max", "selections") != null) && intC(getConstraint(k, "min", "selections"), 1) >= 1),
    ...idIndex ? arr(child(targetEntry, "entryLinks.entryLink")).filter((el) => el["@type"] === "selectionEntry" && intC(getConstraint(el, "min", "selections"), 0) >= 1).map((el) => idIndex.get(el["@targetId"])).filter(Boolean) : []
  ];
  for (const k of forcedKids) {
    for (const p of arr(child(k, "profiles.profile"))) {
      const r = fromProfile(p);
      if (r) return r;
    }
    if (idIndex) for (const il of arr(child(k, "infoLinks.infoLink"))) {
      if (il["@type"] !== "profile") continue;
      const r = fromProfile(idIndex.get(il["@targetId"]) || {});
      if (r) return r;
    }
  }
  return null;
}
function collectChoiceComposition(choiceEntry, idIndex) {
  if (!choiceEntry) return [];
  const out = [];
  const seenLinkIds = /* @__PURE__ */ new Set();
  const isModelLike = (n) => n && (n["@type"] === "model" || arr(child(n, "profiles.profile")).some((p) => /^Unit$/i.test(p["@typeName"] || "")));
  function directWeapons(entry) {
    if (!entry) return [];
    const acc = [];
    const seen = /* @__PURE__ */ new Set();
    const visitedIds = /* @__PURE__ */ new Set();
    const consume = (p) => {
      if (!p || !isWeaponProfile(p)) return;
      const id = p["@id"] || "";
      if (id && seen.has(id)) return;
      if (id) seen.add(id);
      acc.push(weaponAsArray(fmtWeapon(p)));
    };
    function visit(n) {
      if (!n) return;
      const nid = n["@id"];
      if (nid) {
        if (visitedIds.has(nid)) return;
        visitedIds.add(nid);
      }
      for (const p of arr(child(n, "profiles.profile"))) consume(p);
      for (const el of arr(child(n, "entryLinks.entryLink"))) {
        const tgt = idIndex.get(el["@targetId"]);
        if (tgt) visit(tgt);
      }
      for (const se of arr(child(n, "selectionEntries.selectionEntry"))) {
        if (se["@hidden"] !== "true") visit(se);
      }
    }
    visit(entry);
    return acc;
  }
  function harvestModelSections(model) {
    const sections = [];
    const direct = directWeapons(model);
    if (direct.length > 0) sections.push(["", direct]);
    for (const sg of arr(child(model, "selectionEntryGroups.selectionEntryGroup"))) {
      if (sg["@hidden"] === "true") continue;
      const sgName = sg["@name"] || "";
      const prefix = sgName ? sgName + ": " : "";
      for (const se of arr(child(sg, "selectionEntries.selectionEntry"))) {
        if (se["@hidden"] === "true") continue;
        const choiceName = prefix + (se["@name"] || "");
        const w = directWeapons(se);
        if (w.length > 0) sections.push([choiceName, w]);
      }
      for (const el of arr(child(sg, "entryLinks.entryLink"))) {
        if (el["@hidden"] === "true") continue;
        const tgt = idIndex.get(el["@targetId"]);
        if (!tgt) continue;
        const choiceName = prefix + (el["@name"] || tgt["@name"] || "");
        const w = directWeapons(tgt);
        if (w.length > 0) sections.push([choiceName, w]);
      }
    }
    return sections;
  }
  function pushModel(name, model) {
    const sections = harvestModelSections(model);
    if (sections.length > 0) {
      const mn = intC(getConstraint(model, "min", "selections"), 0);
      const mx = intC(getConstraint(model, "max", "selections"), 0);
      out.push([name || model["@name"] || "", sections, mn, mx]);
    }
  }
  function walk2(node) {
    if (!node) return;
    for (const el of arr(child(node, "entryLinks.entryLink"))) {
      if (el["@hidden"] === "true") continue;
      const linkId = el["@id"] || "";
      if (linkId && seenLinkIds.has(linkId)) continue;
      if (linkId) seenLinkIds.add(linkId);
      const tgt = idIndex.get(el["@targetId"]);
      if (!tgt || tgt["@hidden"] === "true") continue;
      if (isModelLike(tgt)) pushModel(el["@name"] || tgt["@name"], tgt);
      else walk2(tgt);
    }
    for (const sg of arr(child(node, "selectionEntryGroups.selectionEntryGroup"))) {
      if (sg["@hidden"] !== "true") walk2(sg);
    }
    for (const se of arr(child(node, "selectionEntries.selectionEntry"))) {
      if (se["@hidden"] === "true") continue;
      if (isModelLike(se)) pushModel(se["@name"], se);
      else walk2(se);
    }
  }
  walk2(choiceEntry);
  return out;
}
function isProfileHiddenFor(profile, unitCategoryIds) {
  for (const m of arr(child(profile, "modifiers.modifier"))) {
    if (m["@type"] !== "set") continue;
    if (m["@field"] !== "hidden") continue;
    if (String(m["@value"]).toLowerCase() !== "true") continue;
    const conds = [
      ...arr(child(m, "conditions.condition")),
      ...arr(child(m, "conditionGroups.conditionGroup")).flatMap((g) => arr(child(g, "conditions.condition")))
    ];
    if (conds.length === 0) continue;
    let allMatch = true;
    for (const c of conds) {
      const childId = c["@childId"];
      if (!childId) {
        allMatch = false;
        break;
      }
      const has = unitCategoryIds.has(childId);
      const t = c["@type"];
      if (t === "instanceOf" && !has) {
        allMatch = false;
        break;
      }
      if (t === "notInstanceOf" && has) {
        allMatch = false;
        break;
      }
      if (t !== "instanceOf" && t !== "notInstanceOf") {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return true;
  }
  return false;
}
var modelOptWeaponOnModel = (e) => e && e["@type"] === "model";
function isLeafOptionGroup(grp) {
  return arr(child(grp, "selectionEntryGroups.selectionEntryGroup")).length === 0;
}
var UNIT_LOCAL_SCOPES = /* @__PURE__ */ new Set(["ancestor", "self", "parent", "unit", "model"]);
function categoryCondsHold(m, unitCategoryIds) {
  const evalCond = (c) => {
    const t = c["@type"];
    if (t !== "instanceOf" && t !== "notInstanceOf") return null;
    if (!UNIT_LOCAL_SCOPES.has(c["@scope"] || "")) return null;
    const has = unitCategoryIds.has(c["@childId"]);
    return t === "instanceOf" ? has : !has;
  };
  const evalGroup = (g) => {
    const parts2 = [
      ...arr(child(g, "conditions.condition")).map(evalCond),
      ...arr(child(g, "conditionGroups.conditionGroup")).map(evalGroup)
    ];
    if (parts2.length === 0 || parts2.some((p) => p === null)) return null;
    return g["@type"] === "or" ? parts2.some(Boolean) : parts2.every(Boolean);
  };
  const parts = [
    ...arr(child(m, "conditions.condition")).map(evalCond),
    ...arr(child(m, "conditionGroups.conditionGroup")).map(evalGroup)
  ];
  if (parts.length === 0 || parts.some((p) => p === null)) return null;
  return parts.every(Boolean);
}
function entryHiddenFor(node, unitCategoryIds) {
  if (!node || !unitCategoryIds) return false;
  for (const m of arr(child(node, "modifiers.modifier"))) {
    if (m["@type"] !== "set" || m["@field"] !== "hidden") continue;
    if (String(m["@value"]).toLowerCase() !== "true") continue;
    if (categoryCondsHold(m, unitCategoryIds) === true) return true;
  }
  return false;
}
function mapAssociations(node, idIndex) {
  return arr(child(node, "associations.association")).map((a) => {
    const childId = a["@childId"] || "";
    let childName = "";
    if (childId && childId !== "model" && idIndex) {
      const tgt = idIndex.get(childId);
      if (tgt) childName = tgt["@name"] || "";
    }
    return {
      name: a["@name"] || "",
      childId,
      childName,
      min: intC(a["@min"], 1),
      max: intC(a["@max"], 1),
      scope: a["@scope"] || "parent",
      // Descend into nested selections when set (otherwise only the scope's
      // direct model children qualify). Optional in the data → default false.
      includeChildSelections: a["@includeChildSelections"] === "true"
      // eligibleModels (the resolved bearer-model NAMES) is filled in by
      // extractUnit once the unit's model tree is known — mapAssociations runs on
      // the option node and has no view of the whole unit.
    };
  });
}
function unitBearerModels(entry, idIndex) {
  const out = [];
  const byName = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  const note = (m, addrIds, groupIds, extraCatIds) => {
    const name = m["@name"] || "";
    if (!name || m["@hidden"] === "true") return;
    let rec = byName.get(name);
    if (!rec) {
      rec = { name, ids: /* @__PURE__ */ new Set(), groupIds: /* @__PURE__ */ new Set(), catIds: /* @__PURE__ */ new Set() };
      byName.set(name, rec);
      out.push(rec);
    }
    for (const id of addrIds) if (id) rec.ids.add(id);
    for (const gid of groupIds) if (gid) rec.groupIds.add(gid);
    for (const cl of arr(child(m, "categoryLinks.categoryLink"))) if (cl["@targetId"]) rec.catIds.add(cl["@targetId"]);
    for (const cid of extraCatIds || []) if (cid) rec.catIds.add(cid);
  };
  const followLink = (el, groupIds) => {
    const tid = el["@targetId"];
    if (!tid) return;
    const tgt = idIndex.get(tid);
    if (!tgt) return;
    if (tgt["@type"] === "model") {
      const elCats = arr(child(el, "categoryLinks.categoryLink")).map((cl) => cl["@targetId"]).filter(Boolean);
      note(tgt, [tgt["@id"], el["@id"], tid], groupIds, elCats);
    } else if (!visited.has(tid)) {
      visited.add(tid);
      walk2(tgt, groupIds);
    }
  };
  function walk2(node, groupIds) {
    if (!node) return;
    for (const m of arr(child(node, "selectionEntries.selectionEntry"))) {
      if (m["@type"] === "model") note(m, [m["@id"]], groupIds);
      else walk2(m, groupIds);
    }
    for (const g of arr(child(node, "selectionEntryGroups.selectionEntryGroup"))) {
      const gids = [...groupIds, g["@id"]];
      walk2(g, gids);
      for (const el of arr(child(g, "entryLinks.entryLink"))) followLink(el, gids);
    }
    for (const el of arr(child(node, "entryLinks.entryLink"))) followLink(el, groupIds);
  }
  walk2(entry, []);
  return out;
}
function assocEligibleNames(assoc, models) {
  if (assoc.childId === "model") return models.map((m) => m.name);
  const hit = models.filter((m) => m.ids.has(assoc.childId) || m.groupIds.has(assoc.childId) || m.catIds.has(assoc.childId));
  return hit.length ? [...new Set(hit.map((m) => m.name))] : null;
}
function getOptChoices(grp, idIndex, unitCategoryIds, dfltMax = 1) {
  const rawEntries = [];
  const defaultId = grp["@defaultSelectionEntryId"] || "";
  let defaultName = "";
  for (const el of arr(child(grp, "entryLinks.entryLink"))) {
    if (isCrusadeOnlyEntry(idIndex && idIndex.get(el["@targetId"]) || null, el)) continue;
    if (el["@hidden"] === "true") continue;
    if (el["@type"] === "selectionEntryGroup") continue;
    if (entryHiddenFor(el, unitCategoryIds)) continue;
    const elMinRaw = effEntryConstraint(el, "min");
    const tgt = idIndex.get(el["@targetId"]);
    if (tgt && entryHiddenFor(tgt, unitCategoryIds)) continue;
    const tgtMin = tgt ? intC(effEntryConstraint(tgt, "min", void 0, [el]), 0) : 0;
    const min = elMinRaw != null ? intC(elMinRaw, 0) : tgtMin;
    const name = el["@name"] || tgt && tgt["@name"] || "";
    const elMaxRaw = effEntryConstraint(el, "max", unitCategoryIds);
    const tgtOwnMax = tgt && arr(child(tgt, "constraints.constraint")).some((c) => c["@type"] === "max" && c["@field"] === "selections" && isOwnScope(c["@scope"])) ? effEntryConstraint({ ...tgt, constraints: { constraint: arr(child(tgt, "constraints.constraint")).filter((c) => isOwnScope(c["@scope"])) } }, "max", unitCategoryIds, [el]) : null;
    const max = Math.min(intC(elMaxRaw, dfltMax), tgtOwnMax != null ? intC(tgtOwnMax, dfltMax) : Infinity);
    if (min >= 1 && max <= min) continue;
    const creationMin = intC(getConstraint(el, "min", "selections") ?? (tgt ? getConstraint(tgt, "min", "selections") : null), 0);
    let pts = 0, linkHasPts = false;
    for (const c of arr(child(el, "costs.cost"))) {
      if (c["@name"] === "pts") {
        pts = intC(c["@value"], 0);
        linkHasPts = true;
      }
    }
    if (!linkHasPts && tgt) {
      for (const c of arr(child(tgt, "costs.cost"))) {
        if (c["@name"] === "pts") pts = intC(c["@value"], 0);
      }
    }
    if (!name) continue;
    const associations = mapAssociations(el, idIndex);
    if (defaultId && (el["@id"] === defaultId || el["@targetId"] === defaultId)) defaultName = name;
    rawEntries.push({ name, pts, max, defaultAmount: hasExplicitDefaultAmount(el) ? getDefaultAmount(el) : hasExplicitDefaultAmount(tgt) ? getDefaultAmount(tgt) : creationMin, sortIndex: intC(el["@sortIndex"], 1e6), profile: pickOptionWeaponProfile(tgt, idIndex) || pickComboWeaponProfiles(tgt, idIndex), ability: pickOptionAbilityDesc(tgt, unitCategoryIds, idIndex), comp: collectChoiceComposition(tgt, idIndex), associations, ids: [el["@id"], el["@targetId"], ...entryCategoryIds(el, tgt)].filter(Boolean), statMods: [...extractStatMods(el), ...extractStatMods(tgt)], unitMax: choiceUnitMax(el, tgt), simMods: [...collectSimMods(el), ...collectSimMods(tgt)], weaponMods: [...extractWeaponMods(el, idIndex), ...extractWeaponMods(tgt, idIndex)], inv: optionInvulnDeep(tgt, idIndex) });
  }
  for (const se of arr(child(grp, "selectionEntries.selectionEntry"))) {
    if (se["@hidden"] === "true") continue;
    if (entryHiddenFor(se, unitCategoryIds)) continue;
    const min = intC(effEntryConstraint(se, "min"), 0);
    const name = se["@name"] || "";
    const max = intC(effEntryConstraint(se, "max", unitCategoryIds), dfltMax);
    if (min >= 1 && max <= min) continue;
    const creationMin = intC(getConstraint(se, "min", "selections"), 0);
    let pts = 0;
    for (const c of arr(child(se, "costs.cost"))) {
      if (c["@name"] === "pts") pts = intC(c["@value"], 0);
    }
    if (!name) continue;
    const seAssociations = mapAssociations(se, idIndex);
    if (defaultId && se["@id"] === defaultId) defaultName = name;
    rawEntries.push({ name, pts, max, defaultAmount: hasExplicitDefaultAmount(se) ? getDefaultAmount(se) : creationMin, sortIndex: intC(se["@sortIndex"], 1e6), profile: pickOptionWeaponProfile(se, idIndex) || pickComboWeaponProfiles(se, idIndex), ability: pickOptionAbilityDesc(se, unitCategoryIds, idIndex), comp: collectChoiceComposition(se, idIndex), associations: seAssociations, ids: [se["@id"], ...entryCategoryIds(se)].filter(Boolean), statMods: extractStatMods(se), unitMax: choiceUnitMax(se), simMods: collectSimMods(se), weaponMods: extractWeaponMods(se, idIndex), inv: optionInvulnDeep(se, idIndex) });
  }
  rawEntries.sort((a, b) => a.sortIndex - b.sortIndex);
  const choices = rawEntries.map((e) => [
    e.name,
    e.pts,
    e.max,
    e.profile || null,
    e.ability || null,
    e.comp || [],
    e.associations || [],
    e.ids || [],
    e.defaultAmount || 0,
    e.unitMax ?? null,
    e.statMods && e.statMods.length ? e.statMods : null,
    // slot 11: sim-mod markers carried by the OPTION's own selectionEntry (a
    // wargear-granted ability — Tankbustas' Pulsa Rokkit: +1 AP & Lethal Hits vs
    // Monster/Vehicle once per battle). The sim surfaces them only while the
    // option is selected (App: optSimOf), like an enhancement's markers.
    e.simMods && e.simMods.length ? e.simMods : null,
    // slot 12: weapon-characteristic modifiers the OPTION applies to the
    // bearer's weapons (extractWeaponMods) — applied by loadout.js while the
    // option is selected. null when none.
    e.weaponMods && e.weaponMods.length ? e.weaponMods : null,
    // slot 13: invulnerable save GRANTED by the option's own ability (« The
    // bearer has a 4+ invulnerable save », « This unit has 5+ InSv against
    // ranged attacks ») — {value, unit, conditional, note} — counted by
    // pickInvuln only while the option is selected. null when none.
    optionInvuln(e.ability) || e.inv || null
  ]);
  return { choices, defaultName };
}
function isTransparentGroup(grp) {
  if (grp["@flatten"] === "true") return true;
  const n = grp["@name"] || "";
  return n === "Wargear" || n === "Options";
}
function collectVoidMap(node, into) {
  const map = into || /* @__PURE__ */ new Map();
  const visit = (n) => {
    if (!n || typeof n !== "object") return;
    for (const m of arr(child(n, "modifiers.modifier"))) {
      if (m["@type"] !== "set" || String(m["@value"]) !== "0" || !m["@field"]) continue;
      const conds = [...arr(child(m, "conditions.condition")), ...arr(child(m, "conditionGroups.conditionGroup")).flatMap((g) => arr(child(g, "conditions.condition")))];
      for (const c of conds) {
        if (c["@type"] !== "atLeast" || c["@field"] !== "selections" || !c["@childId"] || intC(c["@value"], 0) < 1) continue;
        if (!map.has(m["@field"])) map.set(m["@field"], /* @__PURE__ */ new Set());
        map.get(m["@field"]).add(c["@childId"]);
      }
    }
    for (const k of ["selectionEntries.selectionEntry", "selectionEntryGroups.selectionEntryGroup", "entryLinks.entryLink"]) for (const kid of arr(child(n, k))) visit(kid);
  };
  visit(node);
  return map;
}
function groupVoidIds(grp, voidMap) {
  const ids = /* @__PURE__ */ new Set();
  for (const c of arr(child(grp, "constraints.constraint"))) {
    if (c["@field"] !== "selections" || c["@type"] !== "min" && c["@type"] !== "max") continue;
    for (const id of voidMap.get(c["@id"] || "") || []) ids.add(id);
  }
  return [...ids];
}
function getOpts(entry, idIndex, unitCategoryIds) {
  const voidMap = collectVoidMap(entry);
  const out = [];
  const isCompositionGroup = (g) => arr(child(g, "selectionEntries.selectionEntry")).some((s) => s["@type"] === "model") || arr(child(g, "entryLinks.entryLink")).some((el) => {
    const t = el["@targetId"] && idIndex.get(el["@targetId"]);
    return t && t["@type"] === "model";
  });
  function rec(e, prefix) {
    const isEnhancementsMenu = (n) => /^Enhancements\b/i.test(n || "") || /\bEnhancements?$/i.test(n || "");
    const directGrps = arr(child(e, "selectionEntryGroups.selectionEntryGroup")).filter((g) => g["@hidden"] !== "true").filter((g) => !isEnhancementsMenu(g["@name"])).map((g) => ({ g, sortIndex: intC(g["@sortIndex"], 1e6) }));
    const linkedGrps = [];
    const seenLinkedTids = /* @__PURE__ */ new Set();
    const linkModsByGrp = /* @__PURE__ */ new Map();
    const linkByGrp = /* @__PURE__ */ new Map();
    for (const el of arr(child(e, "entryLinks.entryLink"))) {
      if (el["@type"] !== "selectionEntryGroup") continue;
      if (el["@hidden"] === "true") continue;
      const tgt = idIndex.get(el["@targetId"]);
      if (!tgt || tgt["@hidden"] === "true") continue;
      if (isEnhancementsMenu(el["@name"]) || isEnhancementsMenu(tgt["@name"])) continue;
      const tid = el["@targetId"];
      if (tid && seenLinkedTids.has(tid)) continue;
      if (tid) seenLinkedTids.add(tid);
      linkedGrps.push({ g: tgt, sortIndex: intC(el["@sortIndex"], 1e6) });
      linkByGrp.set(tgt, el);
      const lm = arr(child(el, "modifiers.modifier"));
      if (lm.length) linkModsByGrp.set(tgt, lm);
    }
    const pushRevealToggle = (sub, revealG, namePrefix) => {
      const subName = sub["@name"] || "";
      if (!subName || sub["@type"] !== "upgrade") return;
      if (intC(getConstraint(sub, "min", "selections"), 0) >= 1) return;
      let pts = 0;
      for (const c of arr(child(sub, "costs.cost"))) if (c["@name"] === "pts") pts = intC(c["@value"], 0);
      const subMax = Math.max(1, revealG.max || 0);
      const fullName = namePrefix ? namePrefix + "::" + subName : subName;
      const gate = { b: true, m: revealG.m, ...revealG.min ? { min: revealG.min } : {} };
      out.push([fullName, [[subName, pts, subMax, pickOptionWeaponProfile(sub, idIndex), pickOptionAbilityDesc(sub, unitCategoryIds, idIndex), collectChoiceComposition(sub, idIndex), mapAssociations(sub, idIndex), [sub["@id"]].filter(Boolean)]], 1, "", gate, 0]);
    };
    const grps = [...directGrps, ...linkedGrps].sort((a, b) => a.sortIndex - b.sortIndex).map((x) => x.g);
    for (const grp of grps) {
      if (isCompositionGroup(grp)) {
        for (const m of arr(child(grp, "selectionEntries.selectionEntry"))) {
          if (m["@type"] === "model") rec(m, m["@name"] || "");
        }
        for (const el of arr(child(grp, "entryLinks.entryLink"))) {
          if (isCrusadeOnlyEntry(idIndex && idIndex.get(el["@targetId"]) || null, el)) continue;
          if (el["@hidden"] === "true") continue;
          const t = el["@targetId"] && idIndex.get(el["@targetId"]);
          if (t && t["@type"] === "model" && t["@hidden"] !== "true") rec(t, el["@name"] || t["@name"] || "");
        }
        for (const sg of arr(child(grp, "selectionEntryGroups.selectionEntryGroup"))) {
          for (const m of arr(child(sg, "selectionEntries.selectionEntry"))) {
            if (m["@type"] === "model") rec(m, m["@name"] || "");
          }
          for (const el of arr(child(sg, "entryLinks.entryLink"))) {
            if (el["@hidden"] === "true") continue;
            const t = el["@targetId"] && idIndex.get(el["@targetId"]);
            if (t && t["@type"] === "model" && t["@hidden"] !== "true") rec(t, el["@name"] || t["@name"] || "");
          }
        }
        continue;
      }
      const grpName = grp["@name"] || "";
      const isTransparent = isTransparentGroup(grp);
      const fullName = isTransparent ? prefix : prefix ? prefix + "::" + grpName : grpName;
      if (isLeafOptionGroup(grp)) {
        const linkMods = linkModsByGrp.get(grp);
        const gMax = effGroupBound(grp, "max", linkMods, 99, linkByGrp.get(grp));
        const gMin = effGroupBound(grp, "min", linkMods, 0, linkByGrp.get(grp));
        const nativeMax = intC(getConstraint(grp, "max", "selections"), 1);
        const countedSlot = gMin >= 1 && gMax >= 2 && gMax < 99;
        const dfltChoiceMax = linkMods && linkMods.length && gMax > nativeMax && gMax > 1 || countedSlot ? gMax : 1;
        const { choices, defaultName } = getOptChoices(grp, idIndex, unitCategoryIds, dfltChoiceMax);
        for (const se of arr(child(grp, "selectionEntries.selectionEntry"))) {
          const rg = se["@hidden"] === "true" ? optRevealGate(se) : null;
          if (rg) pushRevealToggle(se, rg, fullName);
        }
        let parentGroupName = null;
        if (choices.length > 0) {
          let uniqueName = fullName;
          if (out.some((o) => o[0] === uniqueName)) {
            let suffix = 2;
            while (out.some((o) => o[0] === uniqueName + " #" + suffix)) suffix++;
            uniqueName = uniqueName + " #" + suffix;
          }
          const tuple = [uniqueName, choices, gMax, defaultName, null, gMin];
          const uCap = groupUnitCap(grp);
          if (uCap != null) tuple[8] = uCap;
          const vIds = groupVoidIds(grp, voidMap);
          if (vIds.length) tuple[9] = vIds;
          out.push(tuple);
          parentGroupName = uniqueName;
        }
        for (const el of arr(child(grp, "entryLinks.entryLink"))) {
          if (isCrusadeOnlyEntry(idIndex && idIndex.get(el["@targetId"]) || null, el)) continue;
          if (el["@type"] !== "selectionEntryGroup") continue;
          if (el["@hidden"] === "true") continue;
          const tgt = idIndex.get(el["@targetId"]);
          if (!tgt || tgt["@hidden"] === "true") continue;
          const linkName = el["@name"] || tgt["@name"] || "";
          if (isEnhancementsMenu(linkName) || isEnhancementsMenu(tgt["@name"])) continue;
          const linkedFullName = prefix ? prefix + "::" + linkName : linkName;
          if (isLeafOptionGroup(tgt)) {
            const elMods = arr(child(el, "modifiers.modifier"));
            const linkedMax = effGroupBound(tgt, "max", elMods, 99, el);
            const linkedMin = effGroupBound(tgt, "min", elMods, 0, el);
            const nativeMax2 = intC(getConstraint(tgt, "max", "selections"), 1);
            const linkedCounted = linkedMin >= 1 && linkedMax >= 2 && linkedMax < 99;
            const dfltChoiceMax2 = linkedMax > nativeMax2 && linkedMax > 1 || linkedCounted ? linkedMax : 1;
            const { choices: linkedChoices, defaultName: linkedDefault } = getOptChoices(tgt, idIndex, unitCategoryIds, dfltChoiceMax2);
            if (linkedChoices.length > 0) {
              const tuple = [linkedFullName, linkedChoices, linkedMax, linkedDefault, null, linkedMin];
              const uCap = groupUnitCap(tgt);
              if (uCap != null) tuple[8] = uCap;
              const vIds = groupVoidIds(tgt, collectVoidMap(tgt, new Map(voidMap)));
              if (vIds.length) tuple[9] = vIds;
              out.push(tuple);
            }
          } else {
            rec(tgt, linkedFullName);
          }
        }
        const surfaceNestedOf = (holder, seName) => {
          for (const ng of arr(child(holder, "selectionEntryGroups.selectionEntryGroup"))) {
            if (ng["@hidden"] === "true" || isEnhancementsMenu(ng["@name"])) continue;
            if (!isLeafOptionGroup(ng)) continue;
            const { choices: ngChoices, defaultName: ngDefault } = getOptChoices(ng, idIndex, unitCategoryIds);
            if (ngChoices.length === 0) continue;
            const ngMax = intC(getConstraint(ng, "max", "selections"), 99);
            const ngMin = intC(getConstraint(ng, "min", "selections"), 0);
            const label = (seName ? seName + " \u2014 " : "") + (ng["@name"] || "");
            let uniq = prefix ? prefix + "::" + label : label;
            if (out.some((o) => o[0] === uniq)) {
              let s = 2;
              while (out.some((o) => o[0] === uniq + " #" + s)) s++;
              uniq = uniq + " #" + s;
            }
            const gate = parentGroupName != null ? { g: parentGroupName, c: seName } : null;
            out.push([uniq, ngChoices, ngMax, ngDefault, gate, ngMin]);
          }
        };
        for (const se of arr(child(grp, "selectionEntries.selectionEntry"))) {
          if (se["@hidden"] === "true") continue;
          if (intC(getConstraint(se, "min", "selections"), 0) >= 1) continue;
          surfaceNestedOf(se, se["@name"] || "");
        }
        for (const el of arr(child(grp, "entryLinks.entryLink"))) {
          if (el["@type"] !== "selectionEntry" || el["@hidden"] === "true") continue;
          const tgt = idIndex.get(el["@targetId"]);
          if (!tgt || tgt["@hidden"] === "true" || isCrusadeOnlyEntry(tgt, el)) continue;
          if (intC(getConstraint(el, "min", "selections") ?? getConstraint(tgt, "min", "selections"), 0) >= 1) continue;
          surfaceNestedOf(el, el["@name"] || tgt["@name"] || "");
        }
      } else {
        const from = out.length;
        rec(grp, fullName);
        const shMax = effGroupBound(grp, "max", linkModsByGrp.get(grp), 99, linkByGrp.get(grp));
        if (shMax >= 2 && shMax < 99 && !isTransparent) {
          for (let i = from; i < out.length; i++) {
            const o = out[i];
            if (typeof o[0] === "string" && o[0].startsWith(fullName + "::") && o[10] == null) {
              while (o.length < 10) o.push(o.length === 4 ? null : o.length === 5 ? 0 : null);
              o[10] = { k: fullName, max: shMax };
            }
          }
        }
      }
    }
    const parentIsTransparent = isTransparentGroup(e);
    for (const sub of arr(child(e, "selectionEntries.selectionEntry"))) {
      if (sub["@hidden"] === "true") {
        const rg = optRevealGate(sub);
        if (rg) pushRevealToggle(sub, rg, prefix);
        continue;
      }
      const subName = sub["@name"] || "";
      const subAssoc = sub["@type"] === "upgrade" ? mapAssociations(sub, idIndex) : [];
      let toggleKey = null;
      const unitOptGear = e === entry && e["@type"] === "unit";
      const looseGroup = e !== entry && !e["@type"] && getConstraint(e, "min", "selections") == null && getConstraint(e, "max", "selections") == null;
      const nestedWeapon = (n) => entryHasWeaponProfile(n, idIndex) || arr(child(n, "entryLinks.entryLink")).some((el) => {
        const t = idIndex && idIndex.get(el["@targetId"]);
        return t && entryHasWeaponProfile(t, idIndex);
      }) || arr(child(n, "selectionEntries.selectionEntry")).some((k) => k["@type"] === "upgrade" && entryHasWeaponProfile(k, idIndex));
      const modelOptWeapon = (e["@type"] === "model" || unitOptGear || looseGroup) && sub["@type"] === "upgrade" && (getConstraint(sub, "min", "selections") != null || getConstraint(sub, "max", "selections") != null) && !getDefaultAmount(sub) && (nestedWeapon(sub) || arr(child(sub, "profiles.profile")).some(isAbilityProfile));
      if ((parentIsTransparent || subAssoc.length || modelOptWeapon) && sub["@type"] === "upgrade" && subName && !isCrusadeOnlyEntry(sub, null)) {
        const subMin = intC(getConstraint(sub, "min", "selections"), 0);
        const subMaxRaw = intC(effEntryConstraint(sub, "max", unitCategoryIds), subMin);
        if (subMin >= 1 && subMaxRaw > subMin && (e["@type"] === "model" || unitOptGear) && entryHasWeaponProfile(sub, idIndex) && !removableMin(sub)) {
          let pts = 0;
          for (const c of arr(child(sub, "costs.cost"))) if (c["@name"] === "pts") pts = intC(c["@value"], 0);
          const fullName = prefix ? prefix + "::" + subName : subName;
          out.push([fullName, [[subName, pts, subMaxRaw, pickOptionWeaponProfile(sub, idIndex), pickOptionAbilityDesc(sub, unitCategoryIds, idIndex), collectChoiceComposition(sub, idIndex), mapAssociations(sub, idIndex), [sub["@id"]].filter(Boolean), subMin, choiceUnitMax(sub)]], subMaxRaw, subName, null, subMin]);
        }
        if (subMin >= 1 && removableMin(sub) && (entryHasWeaponProfile(sub, idIndex) || arr(child(sub, "profiles.profile")).some(isAbilityProfile))) {
          let pts = 0;
          for (const c of arr(child(sub, "costs.cost"))) if (c["@name"] === "pts") pts = intC(c["@value"], 0);
          let fullName = prefix ? prefix + "::" + subName : subName;
          if (out.some((o) => o[0] === fullName)) {
            let sfx = 2;
            while (out.some((o) => o[0] === fullName + " #" + sfx)) sfx++;
            fullName = fullName + " #" + sfx;
          }
          const subMaxR = Math.max(1, intC(effEntryConstraint(sub, "max", unitCategoryIds), 1));
          out.push([fullName, [[subName, pts, subMaxR, pickOptionWeaponProfile(sub, idIndex), pickOptionAbilityDesc(sub, unitCategoryIds, idIndex), collectChoiceComposition(sub, idIndex), subAssoc, [sub["@id"], ...entryCategoryIds(sub)].filter(Boolean), 1]], 1, subName, null, 0]);
          toggleKey = fullName;
        }
        if (subMin < 1) {
          const subMax = Math.max(1, intC(effEntryConstraint(sub, "max", unitCategoryIds), 1));
          const subUnitMax = choiceUnitMax(sub);
          const subIds = [sub["@id"], ...entryCategoryIds(sub)].filter(Boolean);
          let pts = 0;
          for (const c of arr(child(sub, "costs.cost"))) {
            if (c["@name"] === "pts") pts = intC(c["@value"], 0);
          }
          const fullName = prefix ? prefix + "::" + subName : subName;
          const subAb = pickOptionAbilityDesc(sub, unitCategoryIds, idIndex);
          const subInv = optionInvuln(subAb) || optionInvulnDeep(sub, idIndex);
          const subTuple = [subName, pts, subMax, pickOptionWeaponProfile(sub, idIndex), subAb, collectChoiceComposition(sub, idIndex), subAssoc, subIds, 0, subUnitMax];
          if (subInv) subTuple.push(null, null, null, subInv);
          out.push([fullName, [subTuple], unitOptGear && !modelOptWeaponOnModel(e) ? subMax : 1, "", null, 0]);
          toggleKey = fullName;
        }
      }
      const isModelVariant = sub["@type"] === "model";
      const subPrefix = prefix ? prefix + "::" + subName : e === entry && !isModelVariant ? "" : subName;
      const nestedFrom = out.length;
      rec(sub, subPrefix);
      if (toggleKey) for (let i = nestedFrom; i < out.length; i++) {
        const o = out[i];
        if (o && o[4] == null) o[4] = { g: toggleKey, c: subName };
      }
    }
    for (const el of arr(child(e, "entryLinks.entryLink"))) {
      if (el["@type"] !== "selectionEntry") continue;
      if (el["@hidden"] === "true") continue;
      if (isEnhancementsMenu(el["@name"])) continue;
      const tgt = idIndex.get(el["@targetId"]);
      if (!tgt || tgt["@hidden"] === "true") continue;
      if (isCrusadeOnlyEntry(tgt, el)) continue;
      if (tgt["@type"] === "model") {
        rec(tgt, el["@name"] || tgt["@name"] || "");
        continue;
      }
      if (tgt["@type"] !== "upgrade") continue;
      const elMinRaw = getConstraint(el, "min", "selections");
      const tgtMin = intC(getConstraint(tgt, "min", "selections"), 0);
      const effMin = elMinRaw != null ? intC(elMinRaw, 0) : tgtMin;
      const elMaxRaw = getConstraint(el, "max", "selections");
      const tgtMaxCstrs = arr(child(tgt, "constraints.constraint")).filter((c) => c["@type"] === "max" && c["@field"] === "selections");
      const tgtMaxCstr = tgtMaxCstrs.find((c) => (c["@scope"] || "parent") === "parent") || null;
      const tgtMaxRaw = tgtMaxCstr && tgtMaxCstr["@value"];
      const tgtMaxId = tgtMaxCstr && tgtMaxCstr["@id"];
      let effMax = intC(elMaxRaw != null ? elMaxRaw : tgtMaxRaw, 1);
      if (tgtMaxId) {
        for (const m of arr(child(el, "modifiers.modifier"))) {
          if (m["@type"] !== "set") continue;
          if (m["@field"] !== tgtMaxId) continue;
          const condCount = arr(child(m, "conditions.condition")).length + arr(child(m, "conditionGroups.conditionGroup")).length;
          if (condCount > 0) continue;
          effMax = intC(m["@value"], effMax);
        }
      }
      const profiles = arr(child(tgt, "profiles.profile"));
      const hasAbility = profiles.some(isAbilityProfile);
      const hasWeapon = profiles.some(isWeaponProfile);
      const subName = el["@name"] || tgt["@name"] || "";
      if (!subName) continue;
      if (isEnhancementsMenu(subName) || isEnhancementsMenu(tgt["@name"])) continue;
      const nestedFrom = out.length;
      if (arr(child(el, "selectionEntryGroups.selectionEntryGroup")).some((g) => g["@hidden"] !== "true")) rec(el, prefix ? prefix + "::" + subName : subName);
      const nestedTo = out.length;
      const gateNested = (key) => {
        for (let i = nestedFrom; i < nestedTo; i++) {
          const o = out[i];
          if (o && o[4] == null) o[4] = { g: key, c: subName };
        }
      };
      const settleNested = () => {
        if (nestedTo === nestedFrom) return;
        if (effMin < 1 && !(getDefaultAmount(el) || getDefaultAmount(tgt))) {
          out.splice(nestedFrom, nestedTo - nestedFrom);
          return;
        }
        const ids = groupVoidIds(el, voidMap);
        if (!ids.length) return;
        for (let i = nestedFrom; i < nestedTo; i++) {
          const o = out[i];
          if (!o || o[4] != null) continue;
          while (o.length < 10) o.push(o.length === 4 ? null : o.length === 5 ? 0 : null);
          o[9] = [.../* @__PURE__ */ new Set([...Array.isArray(o[9]) ? o[9] : [], ...ids])];
        }
      };
      let pts = 0;
      for (const c of arr(child(el, "costs.cost"))) {
        if (c["@name"] === "pts") pts = intC(c["@value"], 0);
      }
      const associations = mapAssociations(el, idIndex);
      if (effMin >= 1 && removableMin(el, tgt) && (hasWeapon || hasAbility)) {
        let fullName = prefix ? prefix + "::" + subName : subName;
        if (out.some((o) => o[0] === fullName)) {
          let sfx = 2;
          while (out.some((o) => o[0] === fullName + " #" + sfx)) sfx++;
          fullName = fullName + " #" + sfx;
        }
        const tuple = [fullName, [[subName, pts, Math.max(1, effMax), pickOptionWeaponProfile(tgt, idIndex), pickOptionAbilityDesc(tgt, unitCategoryIds, idIndex), collectChoiceComposition(tgt, idIndex), associations, [el["@id"], tgt["@id"]].filter(Boolean), 1]], 1, subName, null, 0];
        const vIds = groupVoidIds(el, voidMap);
        if (vIds.length) {
          while (tuple.length < 10) tuple.push(tuple.length === 4 ? null : tuple.length === 5 ? 0 : null);
          tuple[9] = vIds;
        }
        out.push(tuple);
        gateNested(fullName);
        if (vIds.length) for (let i = nestedFrom; i < nestedTo; i++) {
          const o = out[i];
          if (!o) continue;
          while (o.length < 10) o.push(o.length === 4 ? null : o.length === 5 ? 0 : null);
          o[9] = [.../* @__PURE__ */ new Set([...Array.isArray(o[9]) ? o[9] : [], ...vIds])];
        }
        continue;
      }
      const addsCategory = [el, tgt].some((n) => arr(child(n, "modifiers.modifier")).some((m) => m["@type"] === "add" && m["@field"] === "category"));
      const hasHiddenMod = [el, tgt].some((n) => arr(child(n, "modifiers.modifier")).some((m) => m["@field"] === "hidden"));
      if (effMin < 1 && !hasWeapon && (hasAbility || !addsCategory && !hasHiddenMod && subName !== "Warlord")) {
        const fullName = prefix ? prefix + "::" + subName : subName;
        out.push([fullName, [[subName, pts, effMax, pickOptionWeaponProfile(tgt, idIndex), pickOptionAbilityDesc(tgt, unitCategoryIds, idIndex), collectChoiceComposition(tgt, idIndex), associations]], 1, "", null, 0]);
        gateNested(fullName);
        continue;
      }
      if (effMin < 1 && hasWeapon && !hasHiddenMod) {
        if (getDefaultAmount(el) || getDefaultAmount(tgt)) {
          settleNested();
          continue;
        }
        const fullName = prefix ? prefix + "::" + subName : subName;
        out.push([fullName, [[subName, pts, effMax, pickOptionWeaponProfile(tgt, idIndex), pickOptionAbilityDesc(tgt, unitCategoryIds, idIndex), collectChoiceComposition(tgt, idIndex), associations]], 1, "", null, 0]);
        gateNested(fullName);
        continue;
      }
      settleNested();
      if (effMin >= 1 && effMax > effMin && (hasWeapon || hasAbility)) {
        const extra = effMax - effMin;
        const optName = "Additional " + subName;
        const fullName = prefix ? prefix + "::" + optName : optName;
        out.push([fullName, [[subName, pts, extra, pickOptionWeaponProfile(tgt, idIndex), pickOptionAbilityDesc(tgt, unitCategoryIds, idIndex), collectChoiceComposition(tgt, idIndex)]], extra, "", null, 0]);
      }
    }
  }
  rec(entry, "");
  for (const o of out) {
    if (!Array.isArray(o[9])) continue;
    const res = [];
    for (const id of o[9]) for (const o2 of out) {
      if (o2 === o) continue;
      for (const c of o2[1] || []) if ((c[7] || []).includes(id)) res.push({ g: o2[0], c: c[0] });
    }
    if (res.length) o[9] = res;
    else o.length = Math.min(o.length, 9);
  }
  return out;
}
function isAbilityProfile(p) {
  const tn = p && p["@typeName"] || "";
  if (!tn) return false;
  if (/^(Unit|Ranged Weapons?|Melee Weapons?|Transport)$/i.test(tn)) return false;
  for (const c of arr(child(p, "characteristics.characteristic"))) {
    if (c["@name"] === "Description") return true;
  }
  return false;
}
var SUPPORT_RULE_ID = "21f5-c07c-6d97-4405";
var WEAPON_RULE_NAME_RE = /^(sustained hits|lethal hits|devastating wounds|ignores cover|blast|assault|rapid fire|twin-linked|hazardous|heavy|pistol|torrent|indirect fire|melta|anti-|lance|precision|extra attacks|one shot|psychic|hunter)/i;
var CORE_ABILITY_NAMES = /* @__PURE__ */ new Set([
  "support",
  // "Leader" is a datasheet ability on its own on ~200 sheets, but 22 (Captain
  // on Bike, …) carry only the core-rule link — without the name here they
  // showed no Leader ability at all.
  "leader",
  "deep strike",
  "scouts",
  "infiltrators",
  "lone operative",
  "stealth",
  "fights first",
  "feel no pain",
  "deadly demise",
  "firing deck",
  "hover",
  // 11e (codex Orks) : véhicules à palier de dégâts et super-lourds — liés en
  // règle gst depuis la fiche ; sans ces noms, la capacité disparaissait de la
  // carte (audit « état complet Orks », 15 fiches touchées).
  "damaged",
  "super-heavy walker"
]);
function entryProfiles(entry) {
  const out = arr(child(entry, "profiles.profile")).slice();
  for (const g of arr(child(entry, "infoGroups.infoGroup")))
    for (const p of arr(child(g, "profiles.profile"))) out.push(p);
  return out;
}
function entryInfoLinks(entry) {
  const out = arr(child(entry, "infoLinks.infoLink")).slice();
  for (const g of arr(child(entry, "infoGroups.infoGroup")))
    for (const il of arr(child(g, "infoLinks.infoLink"))) out.push(il);
  return out;
}
var GST_INDEX = /* @__PURE__ */ new Map();
var CORE_RULES = [];
function getCoreRules() {
  return CORE_RULES;
}
var INVULN_NAME_RE = /^\s*invulnerable\s+save\b/i;
var INVULN_COND_RE = /\bagainst (ranged|melee|mortal)\b|\bmortal wounds?\b|\bsave\b[^.]*\bonly\b|\bcannot re-?roll\b|\bonce per battle\b|\bfirst time\b/i;
function collectInvulns(unitEntry, idIndex) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const consider = (p, modelName) => {
    if (!p || !isAbilityProfile(p)) return;
    if (!INVULN_NAME_RE.test(p["@name"] || "")) return;
    const id = p["@id"] || "";
    if (id && seen.has(id)) return;
    if (id) seen.add(id);
    const c = characteristics(p);
    const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
    const primary = norm(c.Description || c.Effect || c.Rules || "");
    const fullText = norm(Object.values(c).join(" "));
    const name = p["@name"] || "";
    const mv = primary.match(/(\d)\s*\+/) || fullText.match(/(\d)\s*\+/) || name.match(/(\d)\s*\+/);
    if (!mv) return;
    const value = mv[1] + "+";
    const allVals = new Set((fullText.match(/(\d)\s*\+/g) || []).map((s) => s.replace(/\s/g, "")));
    const conditional = INVULN_COND_RE.test(fullText) || allVals.size >= 2 || /\*/.test(name);
    out.push({ value, conditional, note: (primary || fullText || name).trim(), ...modelName ? { model: modelName } : {} });
  };
  const scan = (node, modelName) => {
    for (const p of arr(child(node, "profiles.profile"))) consider(p, modelName);
    for (const il of arr(child(node, "infoLinks.infoLink"))) {
      if (il["@type"] && il["@type"] !== "profile") continue;
      const tgt = idIndex.get(il["@targetId"]) || GST_INDEX.get(il["@targetId"]);
      if (tgt) consider(tgt, modelName);
    }
  };
  scan(unitEntry, null);
  for (const n of walk(unitEntry, "selectionEntry").filter((e) => e["@type"] === "model")) scan(n, n["@name"] || null);
  return out;
}
function modelEntriesOf(unit, idIndex) {
  const out = [], seen = /* @__PURE__ */ new Set();
  const visit = (node, depth) => {
    if (!node || depth > 8) return;
    for (const se of arr(child(node, "selectionEntries.selectionEntry"))) {
      if (se["@type"] === "model") {
        if (!seen.has(se)) {
          seen.add(se);
          out.push(se);
        }
      } else visit(se, depth + 1);
    }
    for (const g of arr(child(node, "selectionEntryGroups.selectionEntryGroup"))) visit(g, depth + 1);
    for (const el of arr(child(node, "entryLinks.entryLink"))) {
      if (el["@type"] !== "selectionEntry" || el["@hidden"] === "true") continue;
      const tgt = idIndex && idIndex.get(el["@targetId"]);
      if (tgt && tgt["@type"] === "model" && !seen.has(tgt)) {
        seen.add(tgt);
        out.push(tgt);
      }
    }
  };
  visit(unit, 0);
  return out;
}
function getWarlordCatIds(entry, idIndex) {
  const out = /* @__PURE__ */ new Set();
  const scan = (node) => {
    for (const el of arr(child(node, "entryLinks.entryLink"))) {
      if (el["@type"] !== "selectionEntry") continue;
      if (!/^Warlord$/i.test(el["@name"] || "")) continue;
      if (el["@id"]) out.add(el["@id"]);
      for (const cl of arr(child(el, "categoryLinks.categoryLink"))) {
        if (cl["@targetId"]) out.add(cl["@targetId"]);
      }
    }
  };
  scan(entry);
  for (const m of modelEntriesOf(entry, idIndex)) scan(m);
  return [...out];
}
var ABILITY_DESC_TYPE_ID = "9b8f-694b-e5e-b573";
function linkDescAppends(il) {
  const out = [];
  for (const mod of arr(child(il, "modifiers.modifier"))) {
    if (mod["@type"] !== "append") continue;
    const f = String(mod["@field"] || "");
    if (f !== ABILITY_DESC_TYPE_ID && f.toLowerCase() !== "description") continue;
    if (arr(child(mod, "conditions.condition")).length || arr(child(mod, "conditionGroups.conditionGroup")).length) continue;
    let join2 = mod["@join"] != null ? String(mod["@join"]) : "\n";
    if (!join2) join2 = "\n";
    const value = String(mod["@value"] || "").trim();
    if (value) out.push({ join: join2, value });
  }
  return out;
}
var _TOKEN_NUM_WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, "any number of": 1 };
var _TOKEN_RE = /\bplace\s+(a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+|the\s+relevant\s+number\s+of|any\s+number\s+of)\s+([^.*\n]+?)\s+tokens?\b(?:\s+next\s+to\s+(each\s+[^.,*\n]+?\s+model|the\s+bearer|this\s+model|the\s+model|the\s+unit|this\s+unit))?/gi;
function extractTokens(abilities) {
  const out = [];
  const scan = (abName, desc) => {
    if (!desc) return;
    _TOKEN_RE.lastIndex = 0;
    let m;
    while (m = _TOKEN_RE.exec(desc)) {
      const cw = m[1].toLowerCase().replace(/\s+/g, " ");
      const count = /^\d+$/.test(cw) ? parseInt(cw, 10) : _TOKEN_NUM_WORDS[cw] != null ? _TOKEN_NUM_WORDS[cw] : null;
      const name = m[2].replace(/[*_^]+/g, "").trim();
      if (!name) continue;
      const anchor = (m[3] || "").toLowerCase();
      const per = anchor.startsWith("each") ? "model" : "unit";
      const hint = per === "model" ? anchor.replace(/^each\s+/, "").replace(/\s+model$/, "").trim() : "";
      out.push({ name, count, per, ...hint ? { hint } : {}, ability: abName });
    }
  };
  for (const a of abilities || []) {
    scan(a[0], a[1]);
    for (const o of a[2] || []) scan(o[0], o[1]);
  }
  return out;
}
function forcedWargearProfiles(entry, idIndex, unitCatIds) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const minOf = (n) => {
    const v = effEntryConstraint(n, "min", unitCatIds);
    return v == null ? null : intC(v, 0);
  };
  const pushProfiles = (tgt) => {
    for (const p of entryProfiles(tgt)) out.push(p);
    for (const il of entryInfoLinks(tgt)) {
      if (il["@type"] && il["@type"] !== "profile") continue;
      const t = idIndex.get(il["@targetId"]) || GST_INDEX.get(il["@targetId"]);
      if (t) out.push(t);
    }
  };
  const visit = (n, link, depth) => {
    if (!n || depth > 12) return;
    if (n["@hidden"] === "true" || link && link["@hidden"] === "true") return;
    if (unitCatIds && (entryHiddenFor(n, unitCatIds) || link && entryHiddenFor(link, unitCatIds))) return;
    const key = (link ? link["@id"] : "") + ">" + (n["@id"] || "");
    if (seen.has(key)) return;
    seen.add(key);
    const nm = link && link["@name"] || n["@name"] || "";
    if (MFM_LINK_GROUPS.has(nm) || /Enhancement|Crusade|Battle Scar|Battle Honour|Warlord/i.test(nm)) return;
    if (n["@type"] === "upgrade") {
      const mn = Math.max(link ? minOf(link) ?? 0 : 0, minOf(n) ?? 0);
      if (mn >= 1) pushProfiles(n);
      return;
    }
    for (const se of arr(child(n, "selectionEntries.selectionEntry"))) visit(se, null, depth + 1);
    for (const g of arr(child(n, "selectionEntryGroups.selectionEntryGroup"))) visit(g, null, depth + 1);
    for (const el of arr(child(n, "entryLinks.entryLink"))) visit(idIndex.get(el["@targetId"]), el, depth + 1);
  };
  visit(entry, null, 0);
  return out;
}
function addForcedWargearAbilities(ab, entry, idIndex, unitCatIds, comp) {
  const have = new Set(ab.map((a) => String(a[0] || "").toLowerCase()));
  for (const g of comp || []) for (const m of g[3] || []) for (const x of Array.isArray(m[5]) ? m[5] : []) have.add(String(x[0] || "").toLowerCase());
  {
    const profs = forcedWargearProfiles(entry, idIndex, unitCatIds);
    for (const p of profs) {
      if (!/^Abilit(y|ies)$/i.test(p["@typeName"] || "")) continue;
      if (unitCatIds && entryHiddenFor(p, unitCatIds)) continue;
      const nm = p["@name"] || "";
      const k = nm.toLowerCase();
      if (!nm || have.has(k) || /^invulnerable save/i.test(nm)) continue;
      const c = characteristics(p);
      const desc = c.Description || c.Effect || "";
      if (!desc) continue;
      have.add(k);
      ab.push([nm, desc, null, null, 1]);
    }
  }
}
function getAbilities(entry, idIndex, unitCatIds, extraProfiles, extraInfoLinks) {
  const allProfiles = [...entryProfiles(entry), ...extraProfiles || []];
  const modelCoreLinks = [];
  const pushInfoLinkTarget = (il, sink) => {
    const tgt = idIndex.get(il["@targetId"]);
    if (!tgt) return;
    if (il["@type"] === "infoGroup") {
      for (const p of arr(child(tgt, "profiles.profile"))) sink.push(p);
      for (const il2 of arr(child(tgt, "infoLinks.infoLink"))) {
        if (il2["@type"] && il2["@type"] !== "profile") continue;
        const t2 = idIndex.get(il2["@targetId"]);
        if (t2) sink.push(t2);
      }
    } else {
      sink.push(tgt);
    }
  };
  for (const il of entryInfoLinks(entry)) pushInfoLinkTarget(il, allProfiles);
  const STD_NON_ABILITY = /^(Unit|Ranged Weapons?|Melee Weapons?|Transport|Force Disposition)$/i;
  const isAbilityTn = (tn) => /^Abilit(y|ies)$/i.test(tn || "");
  const isSectionTn = (tn) => !!tn && !STD_NON_ABILITY.test(tn) && !isAbilityTn(tn);
  const profDesc = (p) => {
    const c = characteristics(p);
    return c.Description || c.Effect || c.Rules || "";
  };
  const sections = /* @__PURE__ */ new Map();
  for (const p of allProfiles) {
    const tn = p["@typeName"] || "";
    if (!isSectionTn(tn)) continue;
    if (!sections.has(tn)) sections.set(tn, []);
    const list = sections.get(tn), nm = p["@name"] || "";
    if (!list.some(([n]) => n === nm)) list.push([nm, profDesc(p)]);
  }
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  function add(p, gate, appends, wargear) {
    if (unitCatIds && entryHiddenFor(p, unitCatIds)) return;
    if (String(p["@hidden"]) === "true" && !(gate && gate.m && gate.m.some((m) => m.v === false))) return;
    const id = p["@id"] || "";
    if (id && seen.has(id)) return;
    if (id) seen.add(id);
    const c = characteristics(p);
    let desc = c.Description || "";
    if (appends) for (const ap of appends) desc = desc ? desc + ap.join + ap.value : ap.value;
    const tup = [p["@name"] || "", desc];
    if (gate) {
      tup[2] = null;
      tup[3] = gate;
    }
    if (wargear) {
      if (tup.length < 4) {
        tup[2] = tup[2] ?? null;
        tup[3] = tup[3] ?? null;
      }
      tup[4] = 1;
    }
    out.push(tup);
  }
  function addRule(r, gate) {
    const id = r["@id"] || "";
    if (id && seen.has(id)) return;
    if (id) seen.add(id);
    const desc = (r.description == null ? "" : String(r.description)).trim();
    const tup = [r["@name"] || "", desc];
    if (gate) {
      tup[2] = null;
      tup[3] = gate;
    }
    out.push(tup);
  }
  for (const p of [...entryProfiles(entry), ...(extraProfiles || []).filter((x) => isAbilityTn(x["@typeName"]))]) {
    if (isAbilityTn(p["@typeName"])) add(p, runtimeHiddenGate(p));
  }
  for (const m of modelEntriesOf(entry, idIndex)) {
    for (const p of entryProfiles(m)) if (isAbilityProfile(p)) add(p, runtimeHiddenGate(p));
    for (const il of entryInfoLinks(m)) {
      const tgt = idIndex.get(il["@targetId"]);
      if (tgt && isAbilityProfile(tgt)) add(tgt, mergeHiddenGates(linkHiddenGate(il), runtimeHiddenGate(tgt)), linkDescAppends(il));
      else if (tgt && (il["@type"] === "rule" || tgt.description != null && !tgt.characteristics)) addRule(tgt, mergeHiddenGates(linkHiddenGate(il), runtimeHiddenGate(tgt)));
      else if (!tgt) modelCoreLinks.push(il);
    }
  }
  {
    const forcedUpgradeAbilities = (host) => {
      for (const se of arr(child(host, "selectionEntries.selectionEntry"))) {
        if (se["@type"] !== "upgrade" || se["@hidden"] === "true") continue;
        if (intC(getConstraint(se, "min", "selections"), 0) < 1) continue;
        for (const p of arr(child(se, "profiles.profile"))) if (isAbilityProfile(p)) add(p, runtimeHiddenGate(p), null, true);
      }
      for (const el of arr(child(host, "entryLinks.entryLink"))) {
        if (el["@type"] !== "selectionEntry" || el["@hidden"] === "true") continue;
        if (intC(getConstraint(el, "min", "selections"), 0) < 1) continue;
        const tgt = idIndex.get(el["@targetId"]);
        if (!tgt || tgt["@type"] !== "upgrade" || entryHasWeaponProfile(tgt, idIndex)) continue;
        for (const p of arr(child(tgt, "profiles.profile"))) if (isAbilityProfile(p)) add(p, mergeHiddenGates(linkHiddenGate(el), runtimeHiddenGate(p)), null, true);
      }
    };
    forcedUpgradeAbilities(entry);
    for (const m of modelEntriesOf(entry, idIndex)) forcedUpgradeAbilities(m);
  }
  for (const r of arr(child(entry, "rules.rule"))) {
    if (r["@hidden"] === "true") continue;
    addRule(r, runtimeHiddenGate(r));
  }
  for (const m of modelEntriesOf(entry, idIndex)) {
    for (const r of arr(child(m, "rules.rule"))) {
      if (r["@hidden"] === "true") continue;
      addRule(r, runtimeHiddenGate(r));
    }
  }
  const coreLinks = [];
  let invulFromName = "";
  for (const il of [...entryInfoLinks(entry), ...extraInfoLinks || [], ...modelCoreLinks]) {
    const tgt = idIndex.get(il["@targetId"]);
    if (!tgt) {
      if (il["@type"] === "profile") {
        const g = GST_INDEX.get(il["@targetId"]);
        if (g && isAbilityTn(g["@typeName"]) && !INVULN_NAME_RE.test(g["@name"] || "")) {
          add(g, mergeHiddenGates(linkHiddenGate(il), runtimeHiddenGate(g)), linkDescAppends(il));
          continue;
        }
      }
      const base = il["@name"] || "";
      const inv = base.match(/invulnerable\s*save\b[^0-9]*?(\d)\s*\+/i);
      if (inv) {
        if (!invulFromName) invulFromName = inv[1] + "+";
        continue;
      }
      const bySupportId = il["@type"] === "rule" && il["@targetId"] === SUPPORT_RULE_ID;
      if (il["@type"] === "rule" && !CORE_ABILITY_NAMES.has(base.toLowerCase()) && !bySupportId && !WEAPON_RULE_NAME_RE.test(base)) {
        const g = GST_INDEX.get(il["@targetId"]);
        if (g && g.description != null) {
          addRule(g, mergeHiddenGates(linkHiddenGate(il), runtimeHiddenGate(g)));
          continue;
        }
      }
      if (il["@type"] !== "rule" || !(CORE_ABILITY_NAMES.has(base.toLowerCase()) || bySupportId)) continue;
      const dispBase = bySupportId ? "Support" : base;
      let val = "";
      for (const mod of arr(child(il, "modifiers.modifier"))) {
        if (mod["@type"] === "append" && mod["@field"] === "name") val = String(mod["@value"] || "").trim();
      }
      const disp = /^damaged$/i.test(dispBase) && /^\d+$/.test(val) ? dispBase + ": 1-" + val + " Wounds Remaining" : val ? dispBase + " " + val : dispBase;
      coreLinks.push([disp, dispBase.toLowerCase()]);
      continue;
    }
    if (il["@type"] === "infoGroup") {
      const gate = mergeHiddenGates(linkHiddenGate(il), linkHiddenGate(tgt));
      for (const p of arr(child(tgt, "profiles.profile"))) if (isAbilityTn(p["@typeName"])) add(p, mergeHiddenGates(gate, runtimeHiddenGate(p)));
      for (const r of arr(child(tgt, "rules.rule"))) addRule(r, mergeHiddenGates(gate, runtimeHiddenGate(r)));
      for (const il2 of arr(child(tgt, "infoLinks.infoLink"))) {
        const t2 = idIndex.get(il2["@targetId"]);
        if (!t2) continue;
        const g2 = mergeHiddenGates(mergeHiddenGates(gate, linkHiddenGate(il2)), runtimeHiddenGate(t2));
        if (il2["@type"] === "profile") {
          if (isAbilityTn(t2["@typeName"])) add(t2, g2);
        } else if (il2["@type"] === "rule" || t2.description != null && !t2.characteristics) addRule(t2, g2);
      }
      continue;
    }
    if (isAbilityTn(tgt["@typeName"])) {
      add(tgt, mergeHiddenGates(linkHiddenGate(il), runtimeHiddenGate(tgt)), linkDescAppends(il));
      continue;
    }
    if (isSectionTn(tgt["@typeName"])) continue;
    const isRule = il["@type"] === "rule" || tgt.description != null && !tgt.characteristics;
    if (isRule) addRule(tgt, mergeHiddenGates(linkHiddenGate(il), runtimeHiddenGate(tgt)));
  }
  if (invulFromName && !out.some(([n]) => String(n || "").trim().toLowerCase() === "invulnerable save")) {
    out.push(["Invulnerable Save", invulFromName]);
  }
  if (coreLinks.length) {
    const present = new Set(out.map(([n]) => String(n || "").toLowerCase()));
    for (const [name, baseLower] of coreLinks) {
      if (present.has(baseLower)) continue;
      if (baseLower === "damaged" && [...present].some((n) => n.startsWith("damaged"))) continue;
      present.add(baseLower);
      out.push([name, ""]);
    }
  }
  if (sections.size) {
    const norm = (s) => String(s || "").toLowerCase().replace(/^(the|da)\s+/, "").replace(/[^a-z0-9 ]/g, "").trim();
    const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const [T, opts] of sections) {
      const nt = norm(T);
      const target = out.find((e) => e[0] === T) || out.find((e) => norm(e[0]) === nt) || out.find((e) => new RegExp("in the\\s+" + esc(T) + "\\s+section", "i").test(e[1] || "")) || // Same words in another order (« Powers of the C’tan » for the "C'tan
      // Powers" section) — checked BEFORE the prose match, which otherwise
      // grabbed "Damaged: 1-8 wounds remaining" whose text mentions the powers.
      out.find((e) => {
        const w = (x) => norm(String(x).replace(/[’']/g, " ")).split(/\s+/).filter((t) => t && !/^(of|the|da)$/.test(t));
        const tw = w(T), ew = new Set(w(e[0]));
        return tw.length > 0 && tw.every((t) => ew.has(t));
      }) || out.find((e) => /\b(select|choose)\b/i.test(e[1] || "") && new RegExp("\\b" + esc(T) + "\\b", "i").test(e[1] || ""));
      if (target) target[2] = (target[2] || []).concat(opts);
      else out.push([T, "", opts.slice()]);
    }
  }
  return out;
}
function parseSimMod(text) {
  const out = [];
  const re = /(sim-mod|def-mod):\s*([^\n\r]+)/gi;
  let mm;
  while ((mm = re.exec(text || "")) !== null) {
    const body = mm[2].trim();
    const parts = body.match(/[a-z]+="[^"]*"|\S+/gi) || [];
    const sm = { source: "", effects: [], weapon: null, when: null, vs: [], oncePer: null, whileLeading: false, onCharge: false, conditional: false, choice: null, scope: "unit", kw: [], vsTougher: false, faction: null, raw: body, .../^def/i.test(mm[1]) ? { def: true } : {} };
    for (const tk of parts) {
      let m2;
      if (m2 = /^source="([^"]*)"$/i.exec(tk)) sm.source = m2[1];
      else if (m2 = /^weapon="([^"]*)"$/i.exec(tk)) sm.weapon = m2[1];
      else if (m2 = /^faction="([^"]*)"$/i.exec(tk)) sm.faction = m2[1];
      else if (m2 = /^kw="([^"]*)"$/i.exec(tk)) sm.kw = sm.kw.concat(m2[1].split(",").map((s) => s.trim()).filter(Boolean));
      else if (m2 = /^scope=(model|unit)$/i.exec(tk)) sm.scope = m2[1].toLowerCase();
      else if (m2 = /^choice="([^"]*)"$/i.exec(tk)) sm.choice = m2[1];
      else if (/^choice$/i.test(tk)) sm.choice = true;
      else if (m2 = /^vs=(.+)$/i.exec(tk)) {
        sm.vs = m2[1].split(",").map((s) => s.trim()).filter(Boolean);
        sm.conditional = true;
      } else if (m2 = /^when=(melee|ranged)$/i.exec(tk)) sm.when = m2[1].toLowerCase();
      else if (m2 = /^oncePer=(\w+)$/i.exec(tk)) {
        sm.oncePer = m2[1].toLowerCase();
        sm.conditional = true;
      } else if (/^whileLeading$/i.test(tk)) sm.whileLeading = true;
      else if (/^onCharge$/i.test(tk)) {
        sm.onCharge = true;
        sm.conditional = true;
      } else if (/^conditional$/i.test(tk)) sm.conditional = true;
      else if (/^vsStronger$/i.test(tk)) sm.vsStronger = true;
      else if (/^vsTougher$/i.test(tk)) sm.vsTougher = true;
      else {
        const em = /^([a-z][a-z-]*)(?:=(.+))?$/i.exec(tk);
        if (em) sm.effects.push({ k: em[1].toLowerCase(), v: em[2] != null ? em[2] : true });
      }
    }
    if (sm.choice === true) sm.choice = sm.source || "choice";
    if (sm.effects.length) out.push(sm);
  }
  return out;
}
var _commentText = (n) => {
  const c = n && n.comment;
  return typeof c === "string" ? c : Array.isArray(c) ? c.filter((x) => typeof x === "string").join("\n") : "";
};
function optionInvuln(ability) {
  const d = String(ability && ability.desc || "").replace(/\*\*|\^\^/g, "");
  const m = d.match(/(\d)\s*\+\s*(?:invul\w*\s*sav\w*|InSv)([^.;\n]*)/i) || d.match(/(?:invul\w*\s*sav\w*|InSv)[^0-9.;\n]{0,16}?(\d)\s*\+([^.;\n]*)/i);
  if (!m) return null;
  const tail = String(m[2] || "").trim();
  const head = d.slice(0, m.index);
  const conditional = /\b(against|while|until|if|when|each time|once per)\b/i.test(tail) || /\b(while|if|when|until|once per)\b/i.test(head);
  const unit = /\b(this unit|models in (?:this|the bearer's|that) unit|the bearer's unit|in that unit)\b/i.test(d);
  const note = conditional ? d.replace(/\s+/g, " ").trim().slice(0, 160) : "";
  return { value: parseInt(m[1], 10), unit, conditional, ...note ? { note } : {} };
}
function optionInvulnDeep(node, idIndex, depth = 0) {
  if (!node || depth > 3) return null;
  for (const p of arr(child(node, "profiles.profile"))) {
    if (!isAbilityProfile(p)) continue;
    const c = characteristics(p);
    const iv = optionInvuln({ desc: c.Description || c.Effect || "" });
    if (iv) return iv;
  }
  if (idIndex) for (const il of arr(child(node, "infoLinks.infoLink"))) {
    if (il["@type"] !== "profile") continue;
    const p = idIndex.get(il["@targetId"]);
    if (p && isAbilityProfile(p)) {
      const c = characteristics(p);
      const iv = optionInvuln({ desc: c.Description || c.Effect || "" });
      if (iv) return iv;
    }
  }
  for (const k of arr(child(node, "selectionEntries.selectionEntry"))) {
    const iv = optionInvulnDeep(k, idIndex, depth + 1);
    if (iv) return iv;
  }
  if (idIndex) for (const l of arr(child(node, "entryLinks.entryLink"))) {
    const iv = optionInvulnDeep(idIndex.get(l["@targetId"]), idIndex, depth + 1);
    if (iv) return iv;
  }
  return null;
}
function collectSimMods(entry) {
  return parseSimMod(_commentText(entry));
}
function parseStatMarkers(text) {
  const out = {};
  for (const raw of String(text || "").split("\n")) {
    const line = raw.trim();
    let m;
    if (m = line.match(/^invuln:\s*(\d\+)(.*)$/i)) {
      const rest = m[2] || "";
      const attr = (k) => {
        const a = rest.match(new RegExp(k + '="([^"]*)"', "i"));
        return a ? a[1] : "";
      };
      const note = attr("note"), option = attr("option");
      (out.invulnM = out.invulnM || []).push({ value: m[1], model: attr("model"), conditional: /\bconditional\b/i.test(rest), ...note ? { note } : {}, ...option ? { option } : {} });
    } else if (m = line.match(/^fnp:\s*(\d)\+\s*$/i)) {
      out.fnpM = parseInt(m[1], 10);
    } else if (/^must-warlord$/i.test(line)) out.mustWL = true;
    else if (/^cannot-warlord$/i.test(line)) out.cannotWL = true;
    else if (m = line.match(/^leader-kw:\s*(.+)$/i)) {
      out.leadKwNames = m[1].split("|").map((g) => g.split("&").map((s) => s.trim()).filter(Boolean)).filter((g) => g.length);
    }
  }
  return out;
}
var PTS_COST_TYPE_ID = "51b2-306e-1021-d207";
function reducePrimaryCatCg(cg, catalogueId) {
  if (!cg) return true;
  const evalPc = (c) => {
    if (c.scope !== "primary-catalogue") return void 0;
    if (c.type === "instanceOf") return catalogueId === c.childId;
    if (c.type === "notInstanceOf") return catalogueId !== c.childId;
    return void 0;
  };
  const op = cg.op === "or" ? "or" : cg.op === "count" ? "count" : "and";
  if (op === "count") return cg;
  const keptConds = [];
  const resolved = [];
  for (const c of cg.conds || []) {
    const v = evalPc(c);
    if (v === void 0) keptConds.push(c);
    else resolved.push(v);
  }
  const keptGroups = [];
  for (const g of cg.groups || []) {
    const r = reducePrimaryCatCg(g, catalogueId);
    if (r === true || r === false) resolved.push(r);
    else keptGroups.push(r);
  }
  if (op === "and") {
    if (resolved.some((v) => v === false)) return false;
    if (!keptConds.length && !keptGroups.length) return true;
    return { op: "and", conds: keptConds, groups: keptGroups };
  }
  if (resolved.some((v) => v === true)) return true;
  if (!keptConds.length && !keptGroups.length) return false;
  return { op: "or", conds: keptConds, groups: keptGroups };
}
function getCatSwaps(entry, idIndex, catIdToName, catalogueId) {
  const out = [];
  for (const { modifier: mod, sharedCg } of walkModifiers(entry)) {
    if (mod["@type"] !== "set-primary" || mod["@field"] !== "category") continue;
    const targetId = mod["@value"] || "";
    if (!targetId) continue;
    let toCat = catIdToName ? catIdToName.get(targetId) || "" : "";
    if (!toCat) {
      const target = idIndex.get(targetId);
      toCat = target ? target["@name"] || "" : "";
    }
    if (!toCat) continue;
    const directConds = extractConditions(mod);
    const ownGroups = arr(child(mod, "conditionGroups.conditionGroup")).map(extractConditionGroup);
    const cg = sharedCg ? { op: "and", conds: [], groups: [sharedCg, { op: "and", conds: directConds, groups: ownGroups }] } : { op: "and", conds: directConds, groups: ownGroups };
    const reduced = reducePrimaryCatCg(cg, catalogueId);
    if (reduced === false) continue;
    out.push({ toCat, cg: reduced === true ? { op: "and", conds: [], groups: [] } : reduced });
  }
  return out;
}
function buildCatIdToName(node) {
  const m = /* @__PURE__ */ new Map();
  for (const cl of walk(node, "categoryLink")) {
    const id = cl["@targetId"];
    const name = cl["@name"];
    if (id && name && !m.has(id)) m.set(id, name);
  }
  for (const ce of walk(node, "categoryEntry")) {
    const id = ce["@id"];
    const name = ce["@name"];
    if (id && name && !m.has(id)) m.set(id, name);
  }
  return m;
}
function entryHasCompositionPricing(entry) {
  for (const { modifier: mod, sharedCg } of walkModifiers(entry)) {
    if (mod["@type"] !== "set" || mod["@field"] !== PTS_COST_TYPE_ID) continue;
    const conds = [
      ...arr(child(mod, "conditions.condition")),
      ...arr(child(mod, "conditionGroups.conditionGroup")).flatMap((cg) => arr(child(cg, "conditions.condition"))),
      ...sharedCg ? [...sharedCg.conds, ...sharedCg.groups.flatMap((g) => g.conds)].map((c) => ({ "@field": c.field, "@childId": c.childId })) : []
    ];
    const cids = new Set(conds.filter((c) => c["@field"] === "selections" && c["@childId"] && c["@childId"] !== "model").map((c) => c["@childId"]));
    if (cids.size >= 2) return true;
  }
  return false;
}
function getTiers(entry) {
  const out = [];
  if (entryHasCompositionPricing(entry)) return out;
  for (const { modifier: mod, sharedCg } of walkModifiers(entry)) {
    if (mod["@type"] !== "set" || mod["@field"] !== PTS_COST_TYPE_ID) continue;
    const value = intC(mod["@value"], 0);
    let threshold = 0;
    const conds = [
      ...arr(child(mod, "conditions.condition")),
      ...arr(child(mod, "conditionGroups.conditionGroup")).flatMap(
        (cg) => arr(child(cg, "conditions.condition"))
      ),
      ...sharedCg ? [...sharedCg.conds, ...sharedCg.groups.flatMap((g) => g.conds)].map((c) => ({
        "@type": c.type,
        "@field": c.field,
        "@value": String(c.value),
        "@childId": c.childId,
        "@scope": c.scope
      })) : []
    ];
    if (conds.some((c) => c["@scope"] === "primary-catalogue")) continue;
    {
      const cids = new Set(conds.filter((c) => c["@field"] === "selections" && c["@childId"]).map((c) => c["@childId"]));
      if (cids.size >= 2) continue;
    }
    for (const c of conds) {
      if (c["@field"] !== "selections") continue;
      const v = intC(c["@value"], 0);
      if (c["@type"] === "atLeast" || c["@type"] === "equalTo") {
        threshold = v;
        break;
      }
      if (c["@type"] === "greaterThan") {
        threshold = v + 1;
        break;
      }
    }
    if (threshold >= 2 && value > 0) out.push([threshold, value]);
  }
  out.sort((a, b) => a[0] - b[0]);
  return out;
}
function getCostMods(entry, catalogueId) {
  const out = [];
  const hasPrimaryCat = (cg) => !cg ? false : (cg.conds || []).some((c) => c.scope === "primary-catalogue") || (cg.groups || []).some((g) => hasPrimaryCat(g));
  const compPriced = entryHasCompositionPricing(entry);
  const isTierShape = (m) => {
    if (m.type !== "set") return false;
    const flat = [...m.cg.conds || [], ...(m.cg.groups || []).flatMap((g) => g.conds || [])];
    const cids = new Set(flat.filter((c) => c.field === "selections" && c.childId).map((c) => c.childId));
    if (cids.size >= 2) return false;
    return flat.some((c) => c.field === "selections" && ((c.type === "atLeast" || c.type === "equalTo") && Number(c.value) >= 2 || c.type === "greaterThan" && Number(c.value) >= 1));
  };
  for (const m of extractModifiers(entry)) {
    if (m.field !== PTS_COST_TYPE_ID) continue;
    if (!["set", "increment", "add", "decrement", "subtract", "multiply"].includes(m.type)) continue;
    if (repeatCostShape(m)) continue;
    if (isTierShape(m) && !hasPrimaryCat(m.cg) && !compPriced) continue;
    out.push({ type: m.type, value: m.value, cg: m.cg, repeats: m.repeats });
  }
  return out;
}
function getRepeatTier(entry) {
  const cmt = typeof entry.comment === "string" ? entry.comment : "";
  const m = cmt.match(/repeat-tier:\s*role=(base|extra)\s+threshold=(\d+)\s+partner=([\w-]+)/);
  if (m) return { tierRole: m[1], tierThreshold: intC(m[2], 0), tierPartner: m[3] };
  if (entry["@hidden"] === "true") {
    for (const { modifier: mod } of walkModifiers(entry)) {
      if (mod["@type"] !== "set" || mod["@field"] !== "hidden") continue;
      if (String(mod["@value"]) !== "false") continue;
      const conds = [
        ...arr(child(mod, "conditions.condition")),
        ...arr(child(mod, "conditionGroups.conditionGroup")).flatMap((cg) => arr(child(cg, "conditions.condition")))
      ];
      const c = conds.find((c2) => c2["@type"] === "atLeast" && c2["@scope"] === "roster" && c2["@childId"]);
      if (c) return { tierRole: "extra", tierThreshold: intC(c["@value"], 0), tierPartner: c["@childId"] };
    }
  }
  return null;
}
var GST_CHARACTER_CATEGORY_ID = "9cfd-1c32-585f-7d5c";
function getDesignations(entry, idIndex, detIdToName) {
  const out = [];
  const consider = (node, extraIds, label) => {
    if (!node || node["@type"] !== "upgrade" || node["@hidden"] === "true") return;
    const addsCats = [];
    for (const { modifier: m } of walkModifiers(node)) {
      if (m["@type"] === "add" && m["@field"] === "category" && m["@value"]) addsCats.push(m["@value"]);
    }
    if (!addsCats.includes(GST_CHARACTER_CATEGORY_ID)) return;
    let detReq = "";
    if (detIdToName) {
      for (const { modifier: m } of walkModifiers(node)) {
        if (m["@type"] !== "set" || m["@field"] !== "hidden" || String(m["@value"]) !== "true") continue;
        for (const cid of modifierChildIds(m)) if (detIdToName.has(cid)) {
          detReq = detIdToName.get(cid);
          break;
        }
        if (detReq) break;
      }
    }
    let forceMin = 0, forceMax = 0;
    for (const cs of arr(child(node, "constraints"))) for (const c of arr(cs && cs.constraint)) {
      if (c["@field"] !== "selections") continue;
      if (c["@scope"] !== "force" && c["@scope"] !== "roster") continue;
      if (c["@type"] === "min") forceMin = intC(c["@value"], 0);
      if (c["@type"] === "max") forceMax = intC(c["@value"], 0);
    }
    out.push({
      name: label || node["@name"] || "",
      ids: [...new Set([...extraIds, node["@id"]].filter(Boolean))],
      addsCats: [...new Set(addsCats)],
      detReq,
      forceMin,
      forceMax
    });
  };
  for (const el of arr(child(entry, "entryLinks.entryLink"))) {
    if (el["@hidden"] === "true") continue;
    const tgt = idIndex && idIndex.get(el["@targetId"]);
    if (el["@type"] === "selectionEntry") {
      if (tgt && tgt["@type"] === "upgrade") {
        const linkAdds = [];
        for (const { modifier: m } of walkModifiers(el)) {
          if (m["@type"] === "add" && m["@field"] === "category" && m["@value"]) linkAdds.push(m["@value"]);
        }
        if (linkAdds.length) {
          consider({ ...tgt, modifiers: { modifier: [
            ...arr(child(tgt, "modifiers.modifier")),
            ...arr(child(el, "modifiers.modifier"))
          ] } }, [el["@id"], el["@targetId"]], el["@name"]);
          continue;
        }
        consider(tgt, [el["@id"]], el["@name"]);
      }
    } else if (el["@type"] === "selectionEntryGroup" && tgt) {
      for (const se of arr(child(tgt, "selectionEntries.selectionEntry"))) consider(se, [el["@id"]]);
      for (const il of arr(child(tgt, "entryLinks.entryLink"))) {
        const t2 = idIndex && idIndex.get(il["@targetId"]);
        if (t2) consider(t2, [el["@id"], il["@id"]], il["@name"]);
      }
    }
  }
  for (const grp of arr(child(entry, "selectionEntryGroups.selectionEntryGroup"))) {
    if (grp["@hidden"] === "true") continue;
    for (const se of arr(child(grp, "selectionEntries.selectionEntry"))) {
      if (se["@type"] === "upgrade") consider(se, []);
    }
  }
  return out;
}
var ROSTER_SCOPES = /* @__PURE__ */ new Set(["roster", "force", "primary-catalogue"]);
var cgHasCond = (cg) => !!cg && ((cg.conds || []).length > 0 || (cg.groups || []).some(cgHasCond));
var cgRosterOnly = (cg) => !!cg && (cg.conds || []).every((c) => ROSTER_SCOPES.has(c.scope)) && (cg.groups || []).every(cgRosterOnly);
function getRosterMsgs(entry, link, idIndex) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const scan = (node) => {
    if (!node) return;
    for (const m of extractModifiers(node)) {
      if (m.type !== "add" || m.field !== "error" && m.field !== "warning" && m.field !== "info") continue;
      const msg = String(m.value || "").trim();
      if (!msg || !cgHasCond(m.cg) || !cgRosterOnly(m.cg)) continue;
      const k = m.field + "|" + msg;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ lvl: m.field, msg, cg: m.cg });
    }
  };
  scan(entry);
  scan(link);
  for (const se of walk(entry, "selectionEntry")) if (se !== entry) scan(se);
  if (idIndex) for (const el of walk(entry, "entryLink")) {
    const t = el["@targetId"] && idIndex.get(el["@targetId"]);
    if (t && t["@type"] !== "unit") scan(t);
  }
  return out;
}
function getRosterMaxMods(entry, link) {
  const ids = /* @__PURE__ */ new Map();
  for (const node of [entry, link]) {
    for (const c of arr(child(node, "constraints.constraint"))) {
      if (c["@type"] !== "max" || c["@field"] !== "selections" || !c["@id"]) continue;
      if (c["@scope"] !== "roster" && c["@scope"] !== "force") continue;
      ids.set(c["@id"], { scope: c["@scope"], base: intC(c["@value"], 0) });
    }
  }
  if (!ids.size) return [];
  const out = [];
  for (const node of [entry, link]) {
    for (const m of extractModifiers(node)) {
      if (!ids.has(m.field) || m.type !== "set" && m.type !== "increment" && m.type !== "decrement") continue;
      if (!cgHasCond(m.cg)) continue;
      const { scope, base } = ids.get(m.field);
      out.push({ op: m.type, value: intC(m.value, 0), scope, cid: m.field, base, cg: m.cg });
    }
  }
  return out;
}
function absentGateChildIds(node) {
  const out = [];
  for (const { modifier, sharedCg } of walkModifiers(node || {})) {
    if (sharedCg || modifier["@type"] !== "set" || modifier["@field"] !== "hidden" || modifier["@value"] !== "true") continue;
    const conds = arr(child(modifier, "conditions.condition"));
    if (!conds.length || arr(child(modifier, "conditionGroups.conditionGroup")).length) continue;
    const absent = (c) => {
      const t = c["@type"], v = intC(c["@value"], 0);
      return (c["@field"] === "selections" || c["@field"] === "forces") && (c["@scope"] === "roster" || c["@scope"] === "force") && (t === "lessThan" && v === 1 || t === "equalTo" && v === 0 || t === "atMost" && v === 0);
    };
    if (conds.every(absent)) out.push(conds.map((c) => c["@childId"]).filter(Boolean));
  }
  return out;
}
function isCrusadeOnlyEntry(entry, link) {
  return [entry, link].some((n) => n && absentGateChildIds(n).some((ids) => ids.length === 1 && ids[0] === CRUSADE_FORCE_ID));
}
function getReqUnitIds(entry, link, idIndex) {
  const out = { units: [], cats: [] };
  for (const n of [entry, link]) if (n) for (const ids of absentGateChildIds(n)) {
    if (ids.length !== 1) continue;
    const t = idIndex && idIndex.get(ids[0]);
    if (!t) continue;
    if (t["@type"] === "unit" || t["@type"] === "model") {
      if (!out.units.includes(ids[0])) out.units.push(ids[0]);
    } else if (!t["@type"] && !t["@targetId"] && t["@name"] && !t.profiles && !t.constraints) {
      if (!out.cats.includes(ids[0])) out.cats.push(ids[0]);
    }
  }
  return out;
}
function getRosterMax(entry, link) {
  let roster = 0, force = 0;
  for (const c of [...arr(child(entry, "constraints.constraint")), ...link ? arr(child(link, "constraints.constraint")) : []]) {
    if (c["@type"] !== "max" || c["@field"] !== "selections") continue;
    if (c["@scope"] !== "roster" && c["@scope"] !== "force") continue;
    const v = intC(c["@value"], 0);
    if (v <= 0) continue;
    if (c["@scope"] === "roster") roster = roster === 0 ? v : Math.min(roster, v);
    else force = force === 0 ? v : Math.min(force, v);
  }
  if (roster > 0 && force > 0) return Math.min(roster, force);
  return roster > 0 ? roster : force;
}
function getDetReq(entry, detIdToName) {
  if (!detIdToName || detIdToName.size === 0) return "";
  const dets = /* @__PURE__ */ new Set();
  for (const { modifier: mod } of walkModifiers(entry)) {
    if (mod["@type"] !== "set" || mod["@field"] !== "hidden") continue;
    if (mod["@value"] !== "true") continue;
    const conds = [
      ...arr(child(mod, "conditions.condition")),
      ...arr(child(mod, "conditionGroups.conditionGroup")).flatMap(
        (cg) => arr(child(cg, "conditions.condition"))
      )
    ];
    if (conds.some((c) => c["@type"] === "instanceOf")) continue;
    for (const c of conds) {
      const t = c["@type"], v = intC(c["@value"], 0);
      if (!(t === "lessThan" && v === 1 || t === "equalTo" && v === 0 || t === "atMost" && v === 0)) continue;
      const cid = c["@childId"];
      if (cid && detIdToName.has(cid)) dets.add(detIdToName.get(cid));
    }
  }
  return [...dets].join("|");
}
var CRUSADE_FORCE_ID = "cac3-71d1-ea4b-795d";
function getDetExcl(node, detIdToName) {
  if (!node || !detIdToName || detIdToName.size === 0) return "";
  const out = /* @__PURE__ */ new Set();
  const evalCond = (c, assumedDet) => {
    const t = c["@type"], cid = c["@childId"], v = intC(c["@value"], 0);
    const presence = t === "atLeast" && v >= 1 || t === "instanceOf" || t === "equalTo" && v >= 1 || t === "greaterThan" && v === 0;
    const absence = t === "lessThan" && v === 1 || t === "notInstanceOf" || t === "equalTo" && v === 0 || t === "atMost" && v === 0;
    if (cid === BOARDING_FORCE_ID || cid === CRUSADE_FORCE_ID) {
      if (presence) return false;
      if (absence) return true;
      return null;
    }
    if (detIdToName.has(cid)) {
      if (presence) return cid === assumedDet;
      if (absence) return cid !== assumedDet;
      return null;
    }
    return null;
  };
  const evalGroup = (g, assumedDet) => {
    const parts = [
      ...arr(child(g, "conditions.condition")).map((c) => evalCond(c, assumedDet)),
      ...arr(child(g, "conditionGroups.conditionGroup")).map((x) => evalGroup(x, assumedDet))
    ];
    if (!parts.length || parts.some((p) => p === null)) return null;
    return g["@type"] === "or" ? parts.some(Boolean) : parts.every(Boolean);
  };
  for (const { modifier: m, sharedCg } of walkModifiers(node)) {
    if (sharedCg) continue;
    if (m["@type"] !== "set" || m["@field"] !== "hidden" || String(m["@value"]) !== "true") continue;
    const detCands = /* @__PURE__ */ new Set();
    (function scan(x) {
      if (!x || typeof x !== "object") return;
      if (Array.isArray(x)) {
        for (const y of x) scan(y);
        return;
      }
      for (const c of arr(child(x, "conditions.condition"))) if (detIdToName.has(c["@childId"])) detCands.add(c["@childId"]);
      for (const g of arr(child(x, "conditionGroups.conditionGroup"))) scan(g);
    })(m);
    for (const cand of detCands) {
      const parts = [
        ...arr(child(m, "conditions.condition")).map((c) => evalCond(c, cand)),
        ...arr(child(m, "conditionGroups.conditionGroup")).map((g) => evalGroup(g, cand))
      ];
      if (!parts.length || parts.some((p) => p === null)) continue;
      if (parts.every(Boolean)) out.add(detIdToName.get(cand));
    }
  }
  return [...out].join("|");
}
function getTransportCapacity(entry, idIndex) {
  const seen = /* @__PURE__ */ new Set();
  function dig(n) {
    if (!n || typeof n !== "object") return "";
    for (const p of arr(child(n, "profiles.profile"))) {
      if ((p["@typeName"] || "") !== "Transport") continue;
      for (const c of arr(child(p, "characteristics.characteristic"))) {
        if (c["@name"] !== "Capacity") continue;
        const t = (c["#text"] != null ? String(c["#text"]) : "").trim();
        if (t) return t;
      }
    }
    for (const il of arr(child(n, "infoLinks.infoLink"))) {
      const tid = il["@targetId"];
      if (!tid || seen.has(tid)) continue;
      seen.add(tid);
      const tgt = idIndex && idIndex.get(tid);
      if (tgt) {
        const r = dig(tgt);
        if (r) return r;
      }
    }
    return "";
  }
  return dig(entry);
}
var MFM_LINK_GROUPS = /* @__PURE__ */ new Set(["Can Lead (MFM)", "Can Support (MFM)", "Led By (MFM)", "Supported By (MFM)"]);
function stripLeaderLinkGroups(entry) {
  const groups = arr(child(entry, "selectionEntryGroups.selectionEntryGroup"));
  if (!groups.some((g) => MFM_LINK_GROUPS.has(g["@name"]))) return entry;
  return { ...entry, selectionEntryGroups: { ...entry.selectionEntryGroups, selectionEntryGroup: groups.filter((g) => !MFM_LINK_GROUPS.has(g["@name"])) } };
}
function markPerFigurineGroups(opts, comp) {
  if (!Array.isArray(opts) || !opts.length) return;
  const bearerMax = {};
  for (const g of comp || []) for (const m of g[3] || []) {
    const n = Math.max(Number(m[1]) || 0, Number(m[4]) || 0);
    if (n) bearerMax[m[0]] = Math.max(bearerMax[m[0]] || 0, n);
  }
  for (const o of opts) {
    const key = o[0] || "";
    const sep = key.indexOf("::");
    if (sep < 0) continue;
    const bearer = key.slice(0, sep);
    const N = bearerMax[bearer] || 0;
    const S = Number(o[2]) || 1;
    const gMin = Number(o[5]) || 0;
    const multiSlotMandatory = S > 1 && gMin >= 1;
    if (o[8] != null && gMin < 1) continue;
    if (N <= 1 && !multiSlotMandatory) continue;
    const paid = (o[1] || []).some((c) => (Number(c[1]) || 0) > 0);
    if (!multiSlotMandatory && !paid && (o[1] || []).length < 2) continue;
    o[6] = bearer;
  }
}
function synthesizeModelSwapGroups(unit, opts, idIndex) {
  const unitId = unit["@id"] || "";
  const entryPts2 = (...nodes) => {
    for (const n of nodes) if (n) {
      for (const c of arr(child(n, "costs.cost"))) if (c["@name"] === "pts") return intC(c["@value"], 0);
    }
    return 0;
  };
  for (const model of modelEntriesOf(unit, idIndex)) {
    const modelName = model["@name"] || "";
    const entries = [];
    const pushEntry = (node, link) => {
      const tgt = link ? idIndex && idIndex.get(node["@targetId"]) : node;
      if (!tgt) return;
      const prof = pickOptionWeaponProfile(tgt, idIndex);
      if (!prof || Array.isArray(prof)) return;
      entries.push({
        name: tgt["@name"] || node["@name"] || "",
        matchId: link ? node["@targetId"] || "" : node["@id"] || "",
        cons: [...arr(child(node, "constraints.constraint")), ...link ? arr(child(tgt, "constraints.constraint")) : []],
        mods: [...arr(child(node, "modifiers.modifier")), ...link ? arr(child(tgt, "modifiers.modifier")) : []],
        prof,
        pts: entryPts2(node, link ? tgt : null)
      });
    };
    for (const se of arr(child(model, "selectionEntries.selectionEntry"))) if (se["@type"] === "upgrade") pushEntry(se, false);
    for (const el of arr(child(model, "entryLinks.entryLink"))) if (el["@type"] === "selectionEntry" && el["@hidden"] !== "true") pushEntry(el, true);
    if (entries.length < 2) continue;
    const decrIds = (e) => {
      const s = /* @__PURE__ */ new Set();
      for (const m of e.mods) if (m["@type"] === "decrement") {
        for (const r of arr(child(m, "repeats.repeat"))) if (r["@childId"]) s.add(r["@childId"]);
      }
      return s;
    };
    const isBase = (e) => e.cons.some((c) => c["@automatic"] === "true") && decrIds(e).size > 0;
    const maxScoped = (e, parent) => {
      for (const c of e.cons) if (c["@type"] === "max" && (parent ? c["@scope"] === "parent" : c["@scope"] === unitId || c["@scope"] === "unit")) return intC(c["@value"], 0);
      return null;
    };
    const unitMaxDesc = (e) => {
      const base = maxScoped(e, false);
      if (base == null) return null;
      const lt = [];
      for (const m of e.mods) if (m["@type"] === "set") {
        for (const cond of [...arr(child(m, "conditions.condition")), ...arr(child(m, "conditionGroups.conditionGroup")).flatMap((g) => arr(child(g, "conditions.condition")))])
          if (cond["@type"] === "lessThan" && (cond["@childId"] === "model" || cond["@field"] === "selections")) lt.push([intC(cond["@value"], 0), intC(m["@value"], 0)]);
      }
      return lt.length ? { base, lt } : base;
    };
    const bases = entries.filter(isBase);
    for (const base of bases) {
      const dch = decrIds(base);
      const swaps = entries.filter((e) => e !== base && dch.has(e.matchId));
      if (!swaps.length) continue;
      const key = modelName + "::" + base.name;
      if (opts.some((o2) => o2[0] === key)) continue;
      const choices = [[base.name, base.pts || 0, 1, base.prof, null, [], [], [], 1, null]];
      for (const s of swaps) {
        const perFig = maxScoped(s, true);
        choices.push([s.name, s.pts || 0, perFig == null ? 1 : perFig, s.prof, null, [], [], [], 0, unitMaxDesc(s)]);
      }
      const o = [key, choices, 1, base.name, null, 1];
      o[6] = modelName;
      o[7] = "swap";
      opts.push(o);
    }
  }
}
function extractUnit(entry, idIndex, factionKey, index, detIdToName, catIdToName, link, catalogueId) {
  const rawName = entry["@name"] || "";
  const cleanName = rawName.replace(" [Legends]", "").replace(" [Crucible]", "");
  const flags = getFlags(entry);
  const cEntry = stripLeaderLinkGroups(entry);
  const kwData = getKeywordData(cEntry, idIndex);
  const keywords = kwData.flat;
  if (link) {
    const have = new Set(keywords.map((k) => k.toLowerCase()));
    const haveFac = new Set(kwData.faction.map((k) => k.toLowerCase()));
    for (const cl of arr(child(link, "categoryLinks.categoryLink"))) {
      const n = (cl["@name"] || "").trim();
      if (!n || n === "Crucible" || n === "Legends") continue;
      if (/^Faction:/i.test(n)) {
        const f = n.replace(/^Faction:\s*/i, "").trim();
        if (f && !haveFac.has(f.toLowerCase())) {
          haveFac.add(f.toLowerCase());
          kwData.faction.push(f);
        }
      } else if (!have.has(n.toLowerCase())) {
        have.add(n.toLowerCase());
        keywords.push(n);
      }
    }
  }
  let stats = getStats(cEntry, idIndex);
  const statLines = getStatLines(cEntry, idIndex);
  const conferredIds = [
    ...conferredCategoryIds(entry, catalogueId),
    ...link ? conferredCategoryIds(link, catalogueId) : []
  ];
  const unitCatIds = new Set(arr(child(entry, "categoryLinks.categoryLink")).map((c) => c["@targetId"]).filter(Boolean));
  for (const id of conferredIds) unitCatIds.add(id);
  const weapons = collectWeapons(cEntry, idIndex, unitCatIds);
  const optWeapons = collectOptionWeapons(cEntry, idIndex);
  const comp = getComp(entry, idIndex);
  if (statLines.length > 1 && comp.length) {
    const toks = (x) => new Set(String(x || "").toLowerCase().split(/[^a-z0-9']+/).filter(Boolean).map((t) => t.replace(/'s$/, "").replace(/s$/, "")));
    const rows = comp.flatMap((g) => g[3] || []).map((r) => ({ t: toks(r[0]), max: Math.max(1, intC(r[1], 1)) }));
    const weightOf = (namesJoined) => {
      const names = String(namesJoined || "").split(/,|&|\band\b/).map((x) => toks(x)).filter((t) => t.size);
      let w = 0;
      for (const r of rows) if (names.some((n) => [...n].every((t) => r.t.has(t)))) w += r.max;
      return w;
    };
    const isChar = keywords.some((k) => /^character$/i.test(String(k)));
    const weighted = statLines.map((l, i) => ({ l, i, w: /\(ref\.? only\)/i.test(l[0]) ? -1 : weightOf(l[0]) }));
    if (isChar) weighted.sort((a, b) => (a.w < 0) - (b.w < 0) || a.i - b.i);
    else weighted.sort((a, b) => b.w - a.w || a.i - b.i);
    statLines.splice(0, statLines.length, ...weighted.map((x) => x.l));
    if (statLines[0][1] && statLines[0][1].length) stats = statLines[0][1].join("/");
  }
  const transportCapacity = getTransportCapacity(entry, idIndex);
  if (catIdToName) {
    for (const id of conferredIds) {
      const nm = catIdToName.get(id);
      if (nm && !nm.startsWith("Faction:") && !keywords.includes(nm)) keywords.push(nm);
    }
  }
  const removedIds = [
    ...removedCategoryIds(entry, catalogueId),
    ...link ? removedCategoryIds(link, catalogueId) : []
  ];
  if (removedIds.length) {
    const removedNames = /* @__PURE__ */ new Set();
    for (const id of removedIds) {
      unitCatIds.delete(id);
      const nm = catIdToName && catIdToName.get(id);
      if (nm) removedNames.add(nm);
    }
    for (let i = keywords.length - 1; i >= 0; i--) if (removedNames.has(keywords[i])) keywords.splice(i, 1);
  }
  let _minM = 1, _maxM = 1;
  if (comp.length) {
    _minM = 0;
    _maxM = 0;
    for (const g of comp) {
      _minM += g[1];
      _maxM += g[2];
    }
  }
  const ptsInfo = getPtsInfo(entry, link);
  const tiers = getTiers(entry);
  if (ptsInfo.perModelPts && ptsInfo.modelMax > ptsInfo.modelMin) {
    for (let k = ptsInfo.modelMin + 1; k <= ptsInfo.modelMax; k++) {
      tiers.push([k, ptsInfo.perModelPts * k]);
    }
    tiers.sort((a, b) => a[0] - b[0]);
  }
  if (ptsInfo.perModelPts) {
    for (const g of comp) for (const mrow of g[3]) mrow[7] = 0;
  }
  const costMods = getCostMods(entry, catalogueId);
  const repeatTier = getRepeatTier(entry) || (link ? getRepeatTier(link) : null);
  const repeatCost = getRepeatCost(entry) || (link ? getRepeatCost(link) : null);
  const opts = getOpts(entry, idIndex, unitCatIds);
  markPerFigurineGroups(opts, comp);
  synthesizeModelSwapGroups(entry, opts, idIndex);
  {
    const range = compSizeRange(comp, opts);
    if (range) {
      _minM = range[0];
      _maxM = range[1];
    }
  }
  {
    const bearerModels = unitBearerModels(entry, idIndex);
    const compNames = [...new Set(comp.flatMap((g) => [
      ...(g[3] || []).map((m) => m[0]),
      ...(g[5] || []).flatMap((sc) => sc[2] || [])
    ]))];
    const compSet = new Set(compNames);
    for (const o of opts) for (const c of o[1] || []) for (const a of c[6] || []) {
      const raw = assocEligibleNames(a, bearerModels);
      const inComp = raw ? raw.filter((n) => compSet.has(n)) : null;
      if (inComp && inComp.length) {
        a.eligibleModels = inComp;
      } else if (raw && raw.length) {
        const matched = bearerModels.filter((m) => raw.includes(m.name));
        const gids = new Set(matched.flatMap((m) => [...m.groupIds]));
        const mates = gids.size ? bearerModels.filter((m) => [...m.groupIds].some((g) => gids.has(g))) : matched;
        a.eligibleModels = [...new Set((mates.length ? mates : matched).map((m) => m.name))];
        a.grouped = true;
      } else {
        a.eligibleModels = compNames;
        a.broadened = true;
        a.unresolved = true;
        console.warn(`[assoc] ${cleanName || "?"}: association "${a.name}" childId=${a.childId} matched no model \u2014 offering all models`);
      }
    }
  }
  return {
    id: `${factionKey}_${index}`,
    bsId: entry["@id"] || "",
    // The catalogue this datasheet was extracted from. For native units it's
    // the faction's own catalogue; for parent-codex imports it's the host's
    // (the id passed in). Drives the runtime primary-catalogue cost gate: a
    // unit pulled into ANOTHER roster as an ally (catalogueId ≠ the roster's
    // primary catalogue) triggers its allied price bump.
    ...catalogueId ? { catalogueId } : {},
    name: cleanName,
    pts: ptsInfo.pts,
    ...flags,
    stats: stats ? stats.split("/") : null,
    // Per-model statlines, only when the unit has 2+ distinct ones (Gretchin +
    // Runtherd, Boyz + Boss Nob). Omitted otherwise; the card then shows the
    // single `stats` line. `stats` stays the primary model for sim/exports.
    ...statLines.length ? { statLines } : {},
    keywords,
    // Per-model keyword lines + the shared faction-keyword line (handoff:
    // models of one datasheet can differ — Headtakers vs Hunting Wolves). The
    // detail view shows one KEYWORDS line per distinct model set + FACTION
    // KEYWORDS; `keywords` (flat) still feeds the catalogue chips & filters.
    keywordsByModel: kwData.byModel,
    ...kwData.faction.length ? { factionKeywords: kwData.faction } : {},
    weapons,
    // Transient (stripped before serialization): every weapon reachable via the
    // unit's options, merged into wpnDict so option weapons resolve at runtime.
    optWeapons,
    // Unit's always-on weapons (forced upgrades with min>=1 and direct profiles).
    // Used by the WTC export to list weapons that aren't tied to any option
    // group — without this, the export would have to guess by fuzzy-matching
    // option-choice names against weapon-profile names, which misfires on
    // compound options like Defiler's "Two excruciator cannons" (option) vs.
    // "Excruciator cannon" (weapon profile).
    // defaultWeaponCounts: per-name copy count for the subset that's forced
    // in quantities > 1 (Land Raider Redeemer's 2× Flamestorm cannon,
    // Land Raider's 2× Godhammer lascannon, …). Only entries with count > 1
    // appear; the App falls back to 1 for everything else.
    defaultWeapons: (() => {
      const dw = collectDirectWeapons(entry, idIndex);
      return dw.map((w) => w.n);
    })(),
    defaultWeaponCounts: (() => {
      const m = {};
      for (const w of collectDirectWeapons(entry, idIndex)) {
        if (w.count > 1 && w.n) m[w.n.toLowerCase()] = w.count;
      }
      return m;
    })(),
    // Selection ids (link + target / entry) of the fixed default weapons: with the
    // wargear picks and the designations, the row's live selection set that an
    // enhancement's `needSel` is checked against (Iron Ambassador: "model equipped
    // with an Autoch-pattern combi-bolter" — standard on the Einhyr Champion).
    ...(() => {
      const ids = /* @__PURE__ */ new Set();
      collectDirectWeapons(entry, idIndex, ids);
      return ids.size ? { defaultWeaponIds: [...ids] } : {};
    })(),
    comp,
    tiers,
    // name → selectionEntry id of each composition model (tuple slot 8), so
    // the runtime cost engine counts a specific sub-entry by its childId. Wolf
    // Guard Headtakers price the Headtakers models and the Hunting Wolves
    // separately (distinct childIds under the unit's scope), NOT the global
    // model total.
    ...(() => {
      const ids = {};
      for (const g of comp) for (const m of g[3] || []) {
        const list = Array.isArray(m[8]) ? m[8] : m[8] ? [m[8]] : [];
        if (m[0] && list.length) ids[m[0]] = [.../* @__PURE__ */ new Set([...ids[m[0]] || [], ...list])];
      }
      return Object.keys(ids).length ? { compModelIds: ids } : {};
    })(),
    // Build the unit's category-id set once so pickOptionAbilityDesc can
    // drop profiles that BSData scopes to a different category (e.g. the
    // Mark-of-Chaos +2 Strength blurb gated on the Daemon Prince category
    // shouldn't surface on a Chaos Lord).
    opts,
    // abilities + the structured tokens their text declares (u.tokens — Bomb
    // Squigs, Grot Crew…): [{name, count|null, per:"unit"|"model", hint?, ability}].
    ...(() => {
      const STD = /^(Unit|Ranged Weapons?|Melee Weapons?|Transport|Force Disposition|Abilit(y|ies))$/i;
      const secExtra = forcedWargearProfiles(cEntry, idIndex, unitCatIds).filter((p) => p["@typeName"] && !STD.test(p["@typeName"]));
      if (link) secExtra.push(...entryProfiles(link).filter((p) => isAbilityProfile(p)));
      const ab = getAbilities(cEntry, idIndex, unitCatIds, secExtra, link ? entryInfoLinks(link) : []);
      addForcedWargearAbilities(ab, cEntry, idIndex, unitCatIds, comp);
      const tk = extractTokens(ab);
      return { abilities: ab, ...tk.length ? { tokens: tk } : {} };
    })(),
    // BSData error modifiers decidable in-unit ("Max 1 Khornate eviscerator per
    // 5 models"…) — evaluated by the app's compIssues against live counts.
    ...(() => {
      const em = collectErrorMods(cEntry, idIndex);
      return em.length ? { errorMods: em } : {};
    })(),
    ...(() => {
      const sm = collectSimMods(cEntry);
      return sm.length ? { simMods: sm } : {};
    })(),
    // Marqueurs de stats (invuln:/fnp:/must-warlord/cannot-warlord/leader-kw:)
    // → champs invulnM/fnpM/mustWL/cannotWL/leadKwNames, prioritaires partout.
    ...parseStatMarkers(_commentText(cEntry)),
    // Structured invulnerable saves (handoff rule): [{value:"4+",conditional,note}].
    // Multi-invuln units list every save (Ghazghkull 4+ and Makari 2+*).
    ...(() => {
      const iv = collectInvulns(entry, idIndex);
      return iv.length ? { invulns: iv } : {};
    })(),
    cat: classifyCat(flags, keywords),
    minM: _minM,
    maxM: _maxM,
    // Detachment gates can sit on the unit entry itself OR on the entryLink
    // that imported the unit into this catalogue. Cross-catalogue links —
    // most visibly Chaos Daemons pulling in Legionaries/Cultists/Chosen from
    // the CSM catalogue with "hide unless Shadow Legion detachment selected"
    // modifiers — put the gate on the link, not the shared entry. Merge both
    // gate sources so the App detachment filter hides those units until the
    // right detachment is picked.
    detReq: [getDetReq(entry, detIdToName), link ? getDetReq(link, detIdToName) : ""].filter(Boolean).join("|"),
    // Inverse gate: detachments under which the data HIDES this datasheet
    // (see getDetExcl). "" for the vast majority.
    detExcl: [getDetExcl(entry, detIdToName), link ? getDetExcl(link, detIdToName) : ""].filter(Boolean).join("|"),
    // Roster-wide cap on copies of this datasheet (3 for most non-character
    // units, 6 for Battleline, 1 for Epic Heroes). 0 = no cap declared.
    // Surfaced as a validation error in App.jsx when the army has more. An Epic
    // Hero is one-per-army regardless of any declared constraint; a plain
    // Character is NOT 0-1 (Harlequin Troupe Master / Shadowseer / Death Jester
    // are 0-3, from their roster-scoped max).
    rosterMax: flags.isEpic ? 1 : getRosterMax(entry, link),
    // Datasheets a roster can only field alongside another one (Ripper Swarms
    // spawned by the Parasite of Mortrex, Spore Mines by the Biovore, Mucolid
    // Spores by the Sporocyst): `set hidden` unless that unit is in the roster.
    // The catalogue hides them until the parent datasheet is in the list.
    ...(() => {
      const r = getReqUnitIds(entry, link, idIndex);
      return { ...r.units.length ? { reqUnitIds: r.units } : {}, ...r.cats.length ? { reqCatIds: r.cats } : {} };
    })(),
    // Conditional caps on that constraint (getRosterMaxMods) and roster-decidable
    // validation messages (getRosterMsgs). Omitted when empty (most datasheets).
    ...(() => {
      const mm = flags.isEpic ? [] : getRosterMaxMods(entry, link);
      if (!mm.length) return {};
      const caps = [];
      for (const node of [entry, link]) for (const c of arr(child(node || {}, "constraints.constraint"))) {
        if (c["@type"] !== "max" || c["@field"] !== "selections" || !c["@id"]) continue;
        if (c["@scope"] !== "roster" && c["@scope"] !== "force") continue;
        caps.push({ cid: c["@id"], base: intC(c["@value"], 0), scope: c["@scope"] });
      }
      return { rosterMaxMods: mm, rosterCaps: caps };
    })(),
    ...(() => {
      const rm = getRosterMsgs(entry, link, idIndex);
      return rm.length ? { rosterMsgs: rm } : {};
    })(),
    // Unit-bearer designation toggles (Houndpack Lance Character, …) — see
    // getDesignations. Empty for almost every datasheet.
    ...(() => {
      const dg = getDesignations(entry, idIndex, detIdToName);
      return dg.length ? { designations: dg } : {};
    })(),
    // MFM: pts modifiers the size-tier extraction doesn't cover. Evaluated at
    // runtime by the cost engine (src/lib/pts.js) against the unit's model
    // count, selected wargear ids and category set. Empty for ~every unit
    // until the MFM data lands.
    ...costMods.length ? { costMods } : {},
    // MFM split-entry repetition pricing: role/threshold/partner of the
    // base↔"(additional)" twin pair. The app gates the extra twin's catalog
    // visibility on the roster count of its partner and skips battle-size
    // scaling on these exact price-threshold caps.
    ...repeatTier ? repeatTier : {},
    // Repetition pricing {threshold, delta}: the Nth+1 copy in the roster costs
    // delta more. Applied roster-wide by the points engine, not per-unit.
    ...repeatCost ? { repeatCost } : {},
    // Conditional primary-category overrides (set-primary modifiers). Empty
    // for most units; non-empty for things like Poxwalkers → Battleline when
    // Typhus is leading the army. App.jsx evaluates the conditions against
    // the current army state and overlays the resulting category for sorting
    // and the "Battleline" filter.
    catSwaps: getCatSwaps(entry, idIndex, catIdToName, catalogueId),
    // Hidden flag categories this datasheet adds to the roster when designated
    // Warlord (Wazdakka → "Wazdakka Warlord Flag"). Another unit's catSwap tests
    // for the flag by id to gain Battleline + the 0-6 cap. Omitted when empty
    // (almost every datasheet). App.jsx counts these only while isWarlord.
    ...(() => {
      const wf = getWarlordCatIds(entry, idIndex);
      return wf.length ? { warlordCatIds: wf } : {};
    })(),
    // Transport capacity blurb (empty for non-transports).
    transportCapacity,
    // Category targetIds. BSData's instanceOf/notInstanceOf conditions test
    // membership against these — they appear inside catSwaps, ability hide
    // gates, and detachment-locked enhancements. The runtime engine builds a
    // _cats set from the union of these across the army (force scope) or for
    // the current unit (self scope) before evaluating modifiers.
    categoryIds: [...unitCatIds],
    // "Can Lead (MFM)" declarative leader→led-unit links (target datasheet ids).
    // Transient: the LEADGRAPH resolves them to leadTargets at build, then drops
    // this. Empty for non-leaders and leaders the data hasn't tagged yet.
    canLeadIds: getCanLeadIds(entry).concat(link ? getCanLeadIds(link) : []),
    // "Can Support (MFM)" support→attachable-unit links. Transient like canLeadIds:
    // the LEADGRAPH resolves them to leadTargets (role="support") at build, then drops it.
    canSupportIds: getCanSupportIds(entry).concat(link ? getCanSupportIds(link) : []),
    // Résidu « groupe Can * (MFM) sans règle Leader/Support » — la règle est
    // VITALE pour mener (codex 11e) : le groupe seul n'annote plus rien, et
    // data-audit signale la donnée à purger.
    // Liens INVERSES « Led By (MFM) » / « Supported By (MFM) » (dépôt wh40k-11e,
    // editor/translations/gdc-attach.cjs) : posés sur l'unité MENÉE, ils visent la
    // fiche du meneur quand celle-ci ne peut pas viser l'unité (cible hors de sa
    // clôture d'import : Captain du tronc SM → Sword Brethren des Black Templars).
    // Transitoires : le LEADGRAPH les fusionne dans la liste du meneur, puis les retire.
    ledByIds: getMfmGroupIds(entry, "Led By (MFM)").concat(link ? getMfmGroupIds(link, "Led By (MFM)") : []),
    supportedByIds: getMfmGroupIds(entry, "Supported By (MFM)").concat(link ? getMfmGroupIds(link, "Supported By (MFM)") : []),
    ...canLeadOrphan(entry) || link && canLeadOrphan(link) ? { canLeadOrphan: true } : {}
  };
}
function getMfmGroupIds(entry, groupName) {
  const out = [];
  for (const g of arr(child(entry, "selectionEntryGroups.selectionEntryGroup"))) {
    if (g["@name"] !== groupName) continue;
    for (const el of arr(child(g, "entryLinks.entryLink"))) if (el["@targetId"]) out.push(el["@targetId"]);
  }
  return out;
}
var LEADER_RULE_ID = "b4dd-3e1f-41cb-218f";
function hasAttachRule(entry, ruleId, name) {
  for (const il of entryInfoLinks(entry)) {
    if (il["@type"] === "rule" && (il["@targetId"] === ruleId || (il["@name"] || "").trim() === name)) return true;
  }
  for (const p of entryProfiles(entry)) {
    if ((p["@name"] || "").trim().toLowerCase() === name.toLowerCase() && isAbilityProfile(p)) return true;
  }
  return false;
}
var getCanLeadIds = (entry) => hasAttachRule(entry, LEADER_RULE_ID, "Leader") ? getMfmGroupIds(entry, "Can Lead (MFM)") : [];
var getCanSupportIds = (entry) => hasAttachRule(entry, SUPPORT_RULE_ID, "Support") ? getMfmGroupIds(entry, "Can Support (MFM)") : [];
function canLeadOrphan(entry) {
  return getMfmGroupIds(entry, "Can Lead (MFM)").length > 0 && !hasAttachRule(entry, LEADER_RULE_ID, "Leader") || getMfmGroupIds(entry, "Can Support (MFM)").length > 0 && !hasAttachRule(entry, SUPPORT_RULE_ID, "Support");
}
async function parseCatalogue(catPath, { alliance = "Unknown" } = {}) {
  const xml = await readFile(catPath, "utf-8");
  const parsed = X.parse(xml);
  const catalogue = parsed.catalogue;
  const idIndex = buildIdIndex(catalogue);
  const extractListed = (listed) => listed.map(({ entry, link }, i) => ({
    entry,
    u: extractUnit(entry, idIndex, basename(catPath, ".cat"), i, void 0, void 0, link, catalogue && catalogue["@id"])
  })).filter(({ entry, u }) => isDatasheetUnit(u, entry)).map(({ u }) => u);
  let units = extractListed(listUnits(catalogue, idIndex));
  if (!units.length) units = extractListed(listSharedUnits(catalogue, idIndex));
  const wpnDict = {};
  const statSig = (e) => e.slice(1).join("|");
  const addToDict = (w) => {
    const key = (w.n || "").toLowerCase();
    if (!key) return;
    if (!wpnDict[key]) wpnDict[key] = [];
    const entry = [w.n, w.t, w.rng, w.a, w.sk, w.s, w.ap, w.d, w.kw];
    const sig = statSig(entry);
    if (!wpnDict[key].some((e) => statSig(e) === sig)) wpnDict[key].push(entry);
  };
  for (const u of units) {
    for (const w of u.weapons) addToDict(w);
    for (const w of u.optWeapons || []) addToDict(w);
  }
  const weaponsById = {};
  for (const u of units) {
    for (const w of u.weapons) {
      if (w.bsId && !weaponsById[w.bsId]) {
        weaponsById[w.bsId] = { n: w.n, t: w.t, rng: w.rng, a: w.a, sk: w.sk, s: w.s, ap: w.ap, d: w.d, kw: w.kw };
      }
    }
  }
  for (const u of units) delete u.optWeapons;
  return {
    alliance,
    units,
    dets: [],
    // TODO
    enhs: [],
    // TODO
    wpnDict,
    weaponsById,
    allyFactions: []
    // TODO from catalogueLinks
  };
}
function classifyCatFile(filename) {
  const base = filename.replace(/\.cat$/, "");
  const m = base.match(/^([^-]+) - (.+)$/);
  if (m) {
    const prefix = m[1].trim();
    const name = m[2].trim();
    const alliance = prefix === "Chaos" ? "Chaos" : prefix === "Imperium" ? "Imperium" : prefix === "Aeldari" ? "Xenos" : prefix === "Library" ? null : (
      // skip library files
      "Xenos"
    );
    if (alliance === null) return null;
    return { name, alliance };
  }
  const UNPREFIXED_XENOS = /* @__PURE__ */ new Set([
    "T'au Empire",
    "Tyranids",
    "Orks",
    "Necrons",
    "Genestealer Cults",
    "Leagues of Votann"
  ]);
  if (UNPREFIXED_XENOS.has(base)) {
    return { name: base, alliance: "Xenos" };
  }
  return null;
}
function revealedByModifier(node) {
  for (const { modifier: m } of walkModifiers(node)) {
    if (m["@type"] === "set" && m["@field"] === "hidden" && String(m["@value"]).toLowerCase() === "false") return true;
  }
  return false;
}
var NEG_COND = { instanceOf: "notInstanceOf", notInstanceOf: "instanceOf", atLeast: "lessThan", lessThan: "atLeast", greaterThan: "atMost", atMost: "greaterThan", equalTo: "notEqualTo", notEqualTo: "equalTo" };
function negateCg(cg) {
  if (!cg || cg.op === "count") return null;
  const conds = [], groups = [];
  for (const c of cg.conds || []) {
    if (!NEG_COND[c.type]) return null;
    conds.push({ ...c, type: NEG_COND[c.type] });
  }
  for (const g of cg.groups || []) {
    const n = negateCg(g);
    if (!n) return null;
    groups.push(n);
  }
  if (!conds.length && !groups.length) return null;
  return { op: cg.op === "or" ? "and" : "or", conds, groups };
}
function cgMentionsId(cg, id) {
  if (!cg) return false;
  if ((cg.conds || []).some((c) => c.childId === id)) return true;
  return (cg.groups || []).some((g) => cgMentionsId(g, id));
}
function optRevealGate(node) {
  if (node["@hidden"] !== "true") return null;
  const g = runtimeHiddenGate(node);
  if (!g || !g.b || !g.m.some((m) => !m.v)) return null;
  if (g.m.filter((m) => !m.v).every((m) => cgMentionsId(m.cg, CRUSADE_FORCE_ID))) return null;
  const cstr = (t) => (arr(child(node, "constraints.constraint")).find((c) => c["@type"] === t && c["@field"] === "selections") || {})["@id"];
  const minId = cstr("min"), maxId = cstr("max");
  let min = 0, max = 0;
  for (const m of extractModifiers(node)) {
    if (m.type !== "set") continue;
    if (minId && m.field === minId) min = Math.max(min, intC(m.value, 0));
    if (maxId && m.field === maxId) max = Math.max(max, intC(m.value, 0));
  }
  const out = { b: true, m: g.m };
  if (min >= 1) out.min = min;
  if (max >= 1) out.max = max;
  return out;
}
function modifierChildIds(node) {
  const ids = /* @__PURE__ */ new Set();
  function rec(n) {
    if (!n || typeof n !== "object") return;
    if (n["@childId"]) ids.add(n["@childId"]);
    for (const v of Object.values(n)) {
      if (typeof v === "object" && v !== null) {
        for (const item of arr(v)) rec(item);
      }
    }
  }
  rec(node);
  return [...ids];
}
var PARENT_CATALOGUE = {
  // Space Marines chapter codices — thin wrappers on top of the Space Marines
  // catalogue (Tactical Squads, Intercessors, Codex Astartes detachments, …).
  "Imperium - Blood Angels": "Imperium - Space Marines",
  "Imperium - Dark Angels": "Imperium - Space Marines",
  "Imperium - Black Templars": "Imperium - Space Marines",
  "Imperium - Deathwatch": "Imperium - Space Marines",
  "Imperium - Imperial Fists": "Imperium - Space Marines",
  "Imperium - Iron Hands": "Imperium - Space Marines",
  "Imperium - Raven Guard": "Imperium - Space Marines",
  "Imperium - Salamanders": "Imperium - Space Marines",
  "Imperium - Space Wolves": "Imperium - Space Marines",
  "Imperium - Ultramarines": "Imperium - Space Marines",
  "Imperium - White Scars": "Imperium - Space Marines",
  // "Knight" wrappers — the actual datasheets and detachments live in the
  // matching library, the wrapper only declares the catalogueLink. Without
  // this entry the faction shows 0 native units and the user only sees the
  // ally pool (Daemons of Chaos / Titans / etc.) once they toggle Allied on.
  "Imperium - Imperial Knights": "Imperium - Imperial Knights - Library",
  "Chaos - Chaos Knights": "Chaos - Chaos Knights Library",
  // Chaos Daemons — same pattern, wrapper + Daemons Library.
  "Chaos - Chaos Daemons": "Chaos - Daemons Library"
};
var kwCanon = (s) => String(s).replace(/[‐-―−]/g, "-").replace(/[‘’ʼ]/g, "'").replace(/\s+/g, " ").toLowerCase();
function enhReqKeywords(desc, factionKeywords, noopKeywords) {
  if (!desc || !factionKeywords || !factionKeywords.size) return [];
  const d = String(desc).replace(/[*^]/g, "").trim();
  const m = d.match(/^([A-Za-z‘’'‐-―−\- ,]+?)\s+(?:models?|units?)\s+only\b/i);
  if (!m) return [];
  const sorted = [...factionKeywords].sort((a, b) => b.length - a.length);
  const groups = [];
  for (const seg of m[1].split(/\s*,\s*|\s+or\s+/i)) {
    let lp = " " + kwCanon(seg).trim() + " ";
    const keep = [];
    for (const k of sorted) {
      const needle = " " + kwCanon(k) + " ";
      if (lp.includes(needle) && !keep.includes(k)) {
        keep.push(k);
        lp = lp.replace(needle, " ");
      }
    }
    for (const k of [...noopKeywords || []].sort((a, b) => b.length - a.length)) {
      const needle = " " + kwCanon(k) + " ";
      if (lp.includes(needle)) lp = lp.replace(needle, " ");
    }
    const rest = lp.replace(/\b(?:and|or|a|an|the|any|each|that|with|in|of)\b/gi, " ").replace(/\s+/g, " ").trim();
    for (const w of rest ? rest.split(" ") : []) keep.push(w.toLowerCase().replace(new RegExp("(^|[\\s'\u2018\u2019-])(\\p{L})", "gu"), (m0, a, b) => a + b.toUpperCase()));
    if (keep.length) groups.push(keep);
  }
  return groups;
}
function getEnhs(catalogue, idIndex, catalogueId, fallbackDetIdToName) {
  const linkToUpgrade = (el) => {
    const t = idIndex && idIndex.get(el["@targetId"]);
    return t && t["@type"] === "upgrade" ? t : null;
  };
  const groupHasEnhEntry = (n) => arr(child(n, "selectionEntries.selectionEntry")).some((s) => s["@type"] === "upgrade") || arr(child(n, "entryLinks.entryLink")).some((el) => !!linkToUpgrade(el));
  const enhsGroup = function find(n) {
    if (!n || typeof n !== "object") return null;
    if (n["@name"] === "Enhancements" && n["@id"]) {
      const subGroups = arr(child(n, "selectionEntryGroups.selectionEntryGroup"));
      const hasFlat = groupHasEnhEntry(n);
      const hasNested = subGroups.some((g) => groupHasEnhEntry(g));
      if (hasFlat || hasNested) return n;
    }
    for (const v of Object.values(n)) {
      if (typeof v === "object" && v !== null) {
        for (const item of arr(v)) {
          const r = find(item);
          if (r) return r;
        }
      }
    }
    return null;
  }(catalogue);
  const seenStandaloneIds = /* @__PURE__ */ new Set();
  function markInside(n) {
    if (!n || typeof n !== "object") return;
    if (n["@id"]) seenStandaloneIds.add(n["@id"]);
    for (const v of Object.values(n)) {
      if (typeof v === "object" && v !== null) {
        for (const item of arr(v)) markInside(item);
      }
    }
  }
  if (enhsGroup) markInside(enhsGroup);
  const menuIds = new Set(seenStandaloneIds);
  if (enhsGroup && enhsGroup["@id"]) menuIds.add(enhsGroup["@id"]);
  const allConstraints = (node) => arr(child(node, "constraints")).flatMap((c) => arr(c && c.constraint));
  const standaloneGroups = [];
  (function findStandalone(n) {
    if (!n || typeof n !== "object") return;
    if (n["@name"] && /\sEnhancements?$/i.test(n["@name"]) && n["@id"] && !seenStandaloneIds.has(n["@id"])) {
      if (groupHasEnhEntry(n)) {
        standaloneGroups.push(n);
        seenStandaloneIds.add(n["@id"]);
      }
    }
    for (const v of Object.values(n)) {
      if (typeof v === "object" && v !== null) {
        for (const item of arr(v)) findStandalone(item);
      }
    }
  })(catalogue);
  if (!enhsGroup && standaloneGroups.length === 0) return { list: [], cap: 0, menuIds };
  let cap = 0;
  if (enhsGroup) {
    for (const c of allConstraints(enhsGroup)) {
      if (c["@type"] === "max" && c["@field"] === "selections" && (c["@scope"] === "roster" || c["@scope"] === "force")) {
        const v = intC(c["@value"], 0);
        if (v > 0 && (cap === 0 || v < cap)) cap = v;
      }
    }
  }
  const detRoot = findDetachmentRoot(catalogue, idIndex);
  const detNames = /* @__PURE__ */ new Set();
  const detIdToName = /* @__PURE__ */ new Map();
  if (detRoot) {
    for (const det of arr(child(detRoot, "selectionEntries.selectionEntry"))) {
      if (det["@type"] !== "upgrade") continue;
      const nm = det["@name"];
      const did = det["@id"];
      if (nm) detNames.add(nm);
      if (nm && did) detIdToName.set(did, nm);
    }
  }
  if (fallbackDetIdToName) {
    for (const [id, nm] of fallbackDetIdToName) {
      if (!detIdToName.has(id)) detIdToName.set(id, nm);
      if (nm) detNames.add(nm);
    }
  }
  function extractOne(se, fallbackDet) {
    if (se["@hidden"] === "true" && !revealedByModifier(se)) return null;
    const name = se["@name"];
    if (!name) return null;
    let pts = 0;
    for (const c of arr(child(se, "costs.cost"))) {
      if (c["@name"] === "pts") pts = intC(c["@value"], 0);
    }
    let desc = "";
    for (const p of arr(child(se, "profiles.profile"))) {
      const ch = characteristics(p);
      if (ch.Description) {
        desc = ch.Description;
        break;
      }
    }
    let det = "";
    for (const cid of modifierChildIds(se)) {
      if (detIdToName.has(cid)) {
        det = detIdToName.get(cid);
        break;
      }
    }
    if (!det) det = fallbackDet || "";
    const unique = allConstraints(se).some((c) => c["@type"] === "max" && c["@field"] === "selections" && intC(c["@value"], 0) === 1 && (c["@scope"] === "roster" || c["@scope"] === "force")) || (se["@id"] ? modifierChildIds(se).includes(se["@id"]) : false);
    const hideMods = extractModifiers(se).filter((m) => m.type === "set" && m.field === "hidden" && String(m.value) === "true");
    if (se["@hidden"] === "true") {
      for (const m of extractModifiers(se)) {
        if (m.type !== "set" || m.field !== "hidden" || String(m.value) !== "false") continue;
        const n = negateCg(m.cg);
        if (n) hideMods.push({ type: "set", field: "hidden", value: "true", cg: n });
      }
    }
    const sm = collectSimMods(se);
    const statMods = extractStatMods(se);
    const weapons = arr(child(se, "profiles.profile")).filter(isWeaponProfile).map(fmtWeapon).map(({ bsId: _b, ...w }) => w);
    const weaponMods = extractWeaponMods(se, idIndex);
    const leadIds = getMfmGroupIds(se, "Can Lead (MFM)");
    return { name, pts, det, desc, bsId: se["@id"] || "", charOnly: true, reqKeywords: [], unique, hideMods, ...leadIds.length ? { leadIds } : {}, ...weapons.length ? { weapons } : {}, ...sm.length ? { simMods: sm } : {}, ...statMods.length ? { statMods } : {}, ...weaponMods.length ? { weaponMods } : {} };
  }
  function processSubGroup(sg, unitEnh) {
    if (sg["@hidden"] === "true") return;
    if (isHiddenForCatalogue(sg, catalogueId)) return;
    let groupDet = "";
    const nm = (sg["@name"] || "").replace(/\s+Enhancements?$/i, "").trim();
    if (nm && detNames.has(nm)) groupDet = nm;
    if (!groupDet) {
      for (const cid of modifierChildIds(sg)) {
        if (detIdToName.has(cid)) {
          groupDet = detIdToName.get(cid);
          break;
        }
      }
    }
    addEnhEntries(sg, groupDet, unitEnh);
  }
  const out = [];
  function addEnhEntries(node, groupDet, unitEnh) {
    for (const se of arr(child(node, "selectionEntries.selectionEntry"))) {
      if (isHiddenForCatalogue(se, catalogueId)) continue;
      const e = extractOne(se, groupDet);
      if (e) {
        e.unitEnh = !!unitEnh;
        out.push(e);
      }
    }
    for (const el of arr(child(node, "entryLinks.entryLink"))) {
      if (el["@hidden"] === "true") continue;
      const tgt = linkToUpgrade(el);
      if (!tgt || isHiddenForCatalogue(tgt, catalogueId)) continue;
      const e = extractOne(tgt, groupDet);
      if (e) {
        if (el["@name"]) e.name = el["@name"];
        e.unitEnh = !!unitEnh;
        e.hideMods = [
          ...e.hideMods || [],
          ...extractModifiers(el).filter((m) => m.type === "set" && m.field === "hidden" && String(m.value) === "true")
        ];
        out.push(e);
      }
    }
  }
  if (enhsGroup) {
    addEnhEntries(enhsGroup, "", false);
    for (const sg of arr(child(enhsGroup, "selectionEntryGroups.selectionEntryGroup"))) {
      processSubGroup(sg, false);
    }
  }
  for (const sg of standaloneGroups) {
    processSubGroup(sg, true);
  }
  const byKey = /* @__PURE__ */ new Map();
  for (const e of out) {
    const k = (e.name || "") + "|" + (e.det || "");
    const prev = byKey.get(k);
    if (!prev || e.unitEnh && !prev.unitEnh) byKey.set(k, e);
  }
  return { list: [...byKey.values()], cap, menuIds };
}
function drillToDetChooser(node, idIndex, depth) {
  if (!node || depth > 5) return null;
  const directDets = arr(child(node, "selectionEntries.selectionEntry")).filter((s) => s["@type"] === "upgrade");
  if (directDets.length > 0) return node;
  for (const grp of arr(child(node, "selectionEntryGroups.selectionEntryGroup"))) {
    const r = drillToDetChooser(grp, idIndex, depth + 1);
    if (r) return r;
  }
  for (const el of arr(child(node, "entryLinks.entryLink"))) {
    const tgt = idIndex.get(el["@targetId"]);
    const r = drillToDetChooser(tgt, idIndex, depth + 1);
    if (r) return r;
  }
  return null;
}
function findDetachmentRoot(catalogue, idIndex) {
  for (const el of arr(child(catalogue, "entryLinks.entryLink"))) {
    const nm = el["@name"];
    if (nm !== "Detachment" && nm !== "Detachments") continue;
    const tgt = idIndex.get(el["@targetId"]);
    const r = drillToDetChooser(tgt, idIndex, 0);
    if (r) return r;
  }
  return null;
}
function isHiddenForCatalogue(entry, catalogueId) {
  if (!catalogueId) return false;
  const evalCond = (c) => {
    if (c["@scope"] !== "primary-catalogue") return null;
    if (c["@type"] === "instanceOf") return catalogueId === c["@childId"];
    if (c["@type"] === "notInstanceOf") return catalogueId !== c["@childId"];
    return null;
  };
  const evalGroup = (g) => {
    const vals = [
      ...arr(child(g, "conditions.condition")).map(evalCond),
      ...arr(child(g, "conditionGroups.conditionGroup")).map(evalGroup)
    ];
    if (!vals.length || vals.some((v) => v === null)) return null;
    return (g["@type"] || "and").toLowerCase() === "or" ? vals.some(Boolean) : vals.every(Boolean);
  };
  for (const { modifier, sharedCg } of walkModifiers(entry)) {
    if (modifier["@type"] !== "set") continue;
    if (modifier["@field"] !== "hidden") continue;
    if (modifier["@value"] !== "true") continue;
    if (sharedCg) continue;
    const vals = [
      ...arr(child(modifier, "conditions.condition")).map(evalCond),
      ...arr(child(modifier, "conditionGroups.conditionGroup")).map(evalGroup)
    ];
    if (!vals.length || vals.some((v) => v === null)) continue;
    if (vals.every(Boolean)) return true;
  }
  return false;
}
var BOARDING_FORCE_ID = "1d6e-2579-8e7f-1ed4";
function isBoardingActionsEntry(entry) {
  const cmt = entry && entry.comment;
  if (typeof cmt === "string" && /Boarding\s*Actions?/i.test(cmt)) return true;
  for (const { modifier } of walkModifiers(entry)) {
    if (modifier["@type"] !== "set") continue;
    if (modifier["@field"] !== "hidden") continue;
    if (modifier["@value"] !== "true") continue;
    const conds = [
      ...arr(child(modifier, "conditions.condition")),
      ...arr(child(modifier, "conditionGroups.conditionGroup")).flatMap(
        (cg) => arr(child(cg, "conditions.condition"))
      )
    ];
    for (const c of conds) {
      if (c["@type"] !== "notInstanceOf") continue;
      if (c["@scope"] !== "force" && c["@scope"] !== "forces") continue;
      if (c["@childId"] === BOARDING_FORCE_ID) return true;
    }
  }
  return false;
}
function detUniqueKeyword(se) {
  for (const cl of arr(child(se, "categoryLinks.categoryLink"))) {
    const m = /^UNIQUE\s+(.+)$/i.exec(cl["@name"] || "");
    if (m) return m[1].trim().toUpperCase();
  }
  return "";
}
function collectDetRules(se, idIndex) {
  const out = [];
  const seenName = /* @__PURE__ */ new Set();
  const seenId = /* @__PURE__ */ new Set();
  const push = (name, desc, id, node) => {
    name = (name || "").trim();
    desc = (desc || "").trim();
    if (!name || !desc || /\(Stratagem\b/i.test(name)) return;
    const key = name.toLowerCase();
    if (seenName.has(key) || id && seenId.has(id)) return;
    seenName.add(key);
    if (id) seenId.add(id);
    const sm = node ? collectSimMods(node) : [];
    out.push({ name, desc, bsId: id || "", ...sm.length ? { simMods: sm } : {} });
  };
  for (const p of arr(child(se, "profiles.profile"))) {
    if (p["@hidden"] === "true") continue;
    const c = characteristics(p);
    if (c.Description) push(p["@name"], c.Description, p["@id"], p);
  }
  for (const r of arr(child(se, "rules.rule"))) {
    if (r["@hidden"] === "true") continue;
    push(r["@name"], ruleDescription(r), r["@id"], r);
  }
  for (const il of arr(child(se, "infoLinks.infoLink"))) {
    if (il["@type"] !== "rule" || il["@hidden"] === "true") continue;
    const tgt = idIndex.get(il["@targetId"]);
    if (!tgt) continue;
    const sm = [...collectSimMods(il), ...collectSimMods(tgt)];
    const name = (tgt["@name"] || il["@name"] || "").trim();
    const desc = ruleDescription(tgt).trim();
    if (name && desc && !/\(Stratagem\b/i.test(name)) {
      const key = name.toLowerCase();
      if (!seenName.has(key) && !seenId.has(il["@targetId"])) {
        seenName.add(key);
        seenId.add(il["@targetId"]);
        out.push({ name, desc, bsId: il["@targetId"] || "", ...sm.length ? { simMods: sm } : {} });
      }
    }
  }
  return out;
}
function detAllies(se) {
  const m = /det-allies:([^\n]*)/.exec(_commentText(se) || "");
  if (!m) return null;
  const kv = (k) => {
    const r = new RegExp(k + '="([^"]*)"').exec(m[1]) || new RegExp(k + "=(\\S+)").exec(m[1]);
    return r ? r[1] : "";
  };
  const keyword = kv("keyword");
  if (!keyword) return null;
  const maxPts = parseInt(kv("maxPts"), 10);
  return {
    keyword,
    faction: kv("faction") || keyword,
    maxPts: Number.isFinite(maxPts) ? maxPts : 0,
    cannotWarlord: /\bcannot-warlord\b/.test(m[1]),
    killTeamEnhOnly: /\bkill-team-enh-only\b/.test(m[1])
  };
}
function getDets(catalogue, idIndex, catalogueId) {
  const root = findDetachmentRoot(catalogue, idIndex);
  if (!root) return [];
  const dets = [];
  const detEntries = arr(child(root, "selectionEntries.selectionEntry")).filter((se) => se["@type"] === "upgrade" && se["@hidden"] !== "true").filter((se) => !isHiddenForCatalogue(se, catalogueId)).filter((se) => !isBoardingActionsEntry(se)).slice().sort((a, b) => intC(a["@sortIndex"], 1e6) - intC(b["@sortIndex"], 1e6));
  for (const se of detEntries) {
    const name = se["@name"];
    if (!name) continue;
    const rules = collectDetRules(se, idIndex);
    const rule = rules.length ? rules[0].desc : "";
    const ruleName = rules.length ? rules[0].name : "";
    const tables = detTables(se);
    const fds = detForceDispositions(se);
    const allies = detAllies(se);
    dets.push({ name, rule, ruleName, rules, bsId: se["@id"] || "", dp: detDpCost(se, catalogueId), fd: fds[0] || "", ...fds.length > 1 ? { fdList: fds } : {}, strats: detStrats(se), uniqueKw: detUniqueKeyword(se), ...tables.length ? { tables } : {}, ...allies ? { allies } : {} });
  }
  return dets;
}
function detTables(se) {
  const groups = /* @__PURE__ */ new Map();
  for (const p of arr(child(se, "profiles.profile"))) {
    const tn = p["@typeName"] || "";
    if (!tn || /^(Unit|Ranged Weapons?|Melee Weapons?|Abilities|Transport|Force Disposition)$/i.test(tn)) continue;
    const c = characteristics(p);
    if (!groups.has(tn)) groups.set(tn, { title: tn, cols: Object.keys(c), rows: [] });
    const g = groups.get(tn);
    for (const k of Object.keys(c)) if (!g.cols.includes(k)) g.cols.push(k);
    g.rows.push([p["@name"] || "", ...g.cols.map((k) => c[k] || "")]);
  }
  return [...groups.values()];
}
function detForceDispositions(se) {
  const out = [];
  for (const p of arr(child(se, "profiles.profile"))) {
    const tn = `${p["@typeName"] || ""} ${p["@name"] || ""}`;
    if (!/force\s*disposition/i.test(tn)) continue;
    const c = characteristics(p);
    const v = c["Force Disposition"] || Object.values(c).find(Boolean) || "";
    if (v) out.push(String(v).trim());
  }
  return out;
}
var DP_COST_TYPE_ID = "0d99-4ee2-7b3c-1f5a";
function primaryCatCostSet(node, costTypeId, catalogueId) {
  const evalCond = (c) => {
    if (c["@scope"] !== "primary-catalogue") return null;
    const t = c["@type"];
    if (t === "instanceOf") return catalogueId === c["@childId"];
    if (t === "notInstanceOf") return catalogueId !== c["@childId"];
    return null;
  };
  const evalGroup = (g) => {
    const parts = [
      ...arr(child(g, "conditions.condition")).map(evalCond),
      ...arr(child(g, "conditionGroups.conditionGroup")).map(evalGroup)
    ];
    if (parts.length === 0 || parts.some((p) => p === null)) return null;
    return g["@type"] === "or" ? parts.some(Boolean) : parts.every(Boolean);
  };
  let out = null;
  for (const { modifier: m, sharedCg } of walkModifiers(node)) {
    if (sharedCg) continue;
    if (m["@type"] !== "set" || m["@field"] !== costTypeId) continue;
    const parts = [
      ...arr(child(m, "conditions.condition")).map(evalCond),
      ...arr(child(m, "conditionGroups.conditionGroup")).map(evalGroup)
    ];
    let holds;
    if (parts.length === 0) holds = true;
    else if (parts.some((p) => p === null)) holds = null;
    else holds = parts.every(Boolean);
    if (holds === true) {
      const v = Number(m["@value"]);
      if (Number.isFinite(v)) out = v;
    }
  }
  return out;
}
function detDpCost(se, catalogueId) {
  let dp = null;
  for (const c of arr(child(se, "costs.cost"))) {
    if (c["@name"] === "DP" || c["@typeId"] === DP_COST_TYPE_ID) {
      const v = Number(c["@value"]);
      if (Number.isFinite(v)) {
        dp = v;
        break;
      }
    }
  }
  const override = primaryCatCostSet(se, DP_COST_TYPE_ID, catalogueId);
  return override != null ? override : dp;
}
function ruleDescription(r) {
  return typeof r.description === "string" ? r.description : typeof r["@description"] === "string" ? r["@description"] : typeof r["#text"] === "string" ? r["#text"] : "";
}
function extractArmyRules(root) {
  const collect = (rules) => {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const r of arr(rules)) {
      if (!r || r["@hidden"] === "true") continue;
      const name = r["@name"] || "";
      if (!name || /\(Stratagem\b/i.test(name) || name === "Keywords" || seen.has(name)) continue;
      const desc = ruleDescription(r).trim();
      if (!desc) continue;
      seen.add(name);
      const sm = collectSimMods(r);
      out.push({ name, desc, bsId: r["@id"] || "", ...sm.length ? { simMods: sm } : {} });
    }
    return out;
  };
  const top = collect(child(root, "rules.rule"));
  if (top.length) return top.length <= 2 ? top : top.slice(0, 1);
  return collect(child(root, "sharedRules.rule")).slice(0, 1);
}
function deriveArmyRuleFromUnits(units) {
  const byName = /* @__PURE__ */ new Map();
  for (const u of units) {
    if (u.isAllied) continue;
    const seen = /* @__PURE__ */ new Set();
    for (const ab of u.abilities || []) {
      const name = (ab[0] || "").trim();
      const desc = (ab[1] || "").trim();
      if (!name || !desc || seen.has(name) || !/If your Army Faction is/i.test(desc)) continue;
      seen.add(name);
      const rec = byName.get(name) || { count: 0, desc };
      rec.count++;
      byName.set(name, rec);
    }
  }
  let best = null;
  for (const [name, rec] of byName) if (!best || rec.count > best.count) best = { name, count: rec.count, desc: rec.desc };
  return best && best.count >= 2 ? [{ name: best.name, desc: best.desc }] : [];
}
function detStrats(se) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const r of walk(se, "rule")) {
    const rn = r["@name"] || "";
    if (!/\(Stratagem\b/i.test(rn)) continue;
    const key = r["@id"] || rn;
    if (seen.has(key)) continue;
    seen.add(key);
    const desc = ruleDescription(r).trim();
    if (!desc) continue;
    const name = rn.replace(/\s*\(Stratagem[^)]*\)\s*$/i, "").trim();
    const firstLine = desc.split("\n")[0] || "";
    const cpm = (rn + " " + firstLine).match(/(\d+)\s*CP/i);
    const body = desc.replace(/^[^\n]*STRATAGEM[^\n]*\n+/i, "").trim() || desc;
    let turn = "", phase = "";
    const tm = /strat-timing:([^\n]*)/.exec(_commentText(r) || "");
    if (tm) {
      const t = /turn=(\S+)/.exec(tm[1]);
      if (t) turn = t[1];
      const p = /phase=(\S+)/.exec(tm[1]);
      if (p) phase = p[1];
    } else {
      const when = /WHEN:\s*([^\n]*)/i.exec(desc);
      if (when) {
        const w = when[1].toLowerCase();
        const opp = /opponent'?s/.test(w), yours = /\byour\b(?!\s+opponent)/.test(w);
        turn = /either player/.test(w) ? "either" : opp && yours ? "either" : opp ? "opponent" : yours ? "your" : "either";
        const ph = [];
        const wp = w.replace(/charge (?:move|roll)s?/g, "").replace(/charged/g, "");
        for (const k of ["command", "movement", "shooting", "charge", "fight"]) if (wp.includes(k)) ph.push(k);
        phase = /any phase/.test(w) ? "any" : ph.join("|");
      }
    }
    const sm = collectSimMods(r);
    out.push({ name, cpCost: cpm ? Number(cpm[1]) : null, description: body, nameKey: rn, descKey: desc, ...turn ? { turn } : {}, ...phase ? { phase } : {}, ...sm.length ? { simMods: sm } : {} });
  }
  return out;
}
function linkedFactionName(linkName) {
  if (!linkName) return null;
  let n = linkName.replace(/ Library$/i, "").trim();
  n = n.replace(/^(Chaos|Imperium|Aeldari) - /, "").trim();
  n = n.replace(/\s*-\s*$/, "").trim();
  if (n.startsWith("Library")) return null;
  if (n === "Unaligned Forces") return null;
  return n || null;
}
async function parseAllCatalogues(dir) {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".cat"));
  GST_INDEX = /* @__PURE__ */ new Map();
  CORE_RULES = [];
  for (const gf of (await readdir(dir)).filter((f) => f.endsWith(".gst"))) {
    try {
      const root = X.parse(await readFile(join(dir, gf), "utf-8")).gameSystem;
      if (root) {
        for (const [id, node] of buildIdIndex(root)) if (!GST_INDEX.has(id)) GST_INDEX.set(id, node);
        for (const r of arr(child(root, "sharedRules.rule"))) {
          const desc = ruleDescription(r).trim();
          const name = r["@name"];
          if (!name || !desc) continue;
          const tm = /strat-timing:([^\n]*)/.exec(_commentText(r) || "");
          const tt = tm && /turn=(\S+)/.exec(tm[1]);
          const tp = tm && /phase=(\S+)/.exec(tm[1]);
          CORE_RULES.push({ name, desc, aliases: arr(r.alias).map((a) => String(a)), ...tt ? { turn: tt[1] } : {}, ...tp ? { phase: tp[1] } : {} });
        }
      }
    } catch (e) {
    }
  }
  const cats = /* @__PURE__ */ new Map();
  for (const f of files) {
    const xml = await readFile(join(dir, f), "utf-8");
    const parsed = X.parse(xml);
    const root = parsed.catalogue;
    cats.set(f, {
      root,
      catalogueId: root && root["@id"],
      idIndex: buildIdIndex(root)
    });
  }
  const byCatId = /* @__PURE__ */ new Map();
  for (const [f, info] of cats) {
    if (info.catalogueId) byCatId.set(info.catalogueId, { f, ...info });
  }
  const out = {};
  for (const [f, info] of cats) {
    const classify = classifyCatFile(f);
    if (!classify) continue;
    CURRENT_PRIMARY_CAT = info.catalogueId || null;
    if (info.root && info.root["@library"] === "true") continue;
    const mergedIdIndex = new Map(info.idIndex);
    const linkedCats = [];
    for (const cl of arr(child(info.root, "catalogueLinks.catalogueLink"))) {
      const linked = byCatId.get(cl["@targetId"]);
      if (!linked) continue;
      linkedCats.push({ link: cl, linked });
    }
    {
      const seenCats = /* @__PURE__ */ new Set([info.catalogueId]);
      const queue = linkedCats.map((lc) => lc.linked);
      while (queue.length) {
        const c = queue.shift();
        if (!c || seenCats.has(c.catalogueId)) continue;
        seenCats.add(c.catalogueId);
        for (const [id, e] of c.idIndex) if (!mergedIdIndex.has(id)) mergedIdIndex.set(id, e);
        for (const cl of arr(child(c.root, "catalogueLinks.catalogueLink"))) {
          const nxt = byCatId.get(cl["@targetId"]);
          if (nxt && !seenCats.has(nxt.catalogueId)) queue.push(nxt);
        }
      }
    }
    const factionKey = basename(f, ".cat");
    const detIdToName = /* @__PURE__ */ new Map();
    {
      const detRoot = findDetachmentRoot(info.root, mergedIdIndex);
      if (detRoot) {
        for (const det of arr(child(detRoot, "selectionEntries.selectionEntry"))) {
          if (det["@type"] === "upgrade" && det["@name"] && det["@id"]) {
            detIdToName.set(det["@id"], det["@name"]);
          }
        }
      }
      const pName = PARENT_CATALOGUE[factionKey];
      const parent = pName && linkedCats.find(({ link }) => link["@name"] === pName);
      const pRoot = parent && findDetachmentRoot(parent.linked.root, mergedIdIndex);
      if (pRoot) {
        for (const det of arr(child(pRoot, "selectionEntries.selectionEntry"))) {
          if (det["@type"] === "upgrade" && det["@name"] && det["@id"] && !detIdToName.has(det["@id"])) detIdToName.set(det["@id"], det["@name"]);
        }
      }
    }
    const catIdToName = buildCatIdToName(info.root);
    for (const { linked } of linkedCats) {
      for (const [id, n] of buildCatIdToName(linked.root)) {
        if (!catIdToName.has(id)) catIdToName.set(id, n);
      }
    }
    const rawUnitEntries = /* @__PURE__ */ new Map();
    const hiddenForPrimary = (entry, link) => isHiddenForCatalogue(entry, info.catalogueId) || link && isHiddenForCatalogue(link, info.catalogueId) || isCrusadeOnlyEntry(entry, link);
    const extractListed = (listed) => listed.filter(({ entry, link }) => !hiddenForPrimary(entry, link)).map(({ entry, link }, i) => ({
      entry,
      u: extractUnit(entry, mergedIdIndex, factionKey, i, detIdToName, catIdToName, link, info.catalogueId)
    })).filter(({ entry, u }) => isDatasheetUnit(u, entry)).map(({ entry, u }) => {
      if (entry["@id"] && !rawUnitEntries.has(entry["@id"])) rawUnitEntries.set(entry["@id"], entry);
      return u;
    });
    let units = extractListed(listUnits(info.root, mergedIdIndex));
    if (!units.length) units = extractListed(listSharedUnits(info.root, mergedIdIndex));
    const nativeMenuCount = units.length;
    const parentLinkName = PARENT_CATALOGUE[factionKey] || null;
    const nativeFactionKw = new Set(units.flatMap((u) => u.factionKeywords || []).map((k) => String(k).toLowerCase()));
    let importedIdx = units.length;
    for (const { link, linked } of linkedCats) {
      if (link["@importRootEntries"] !== "true") continue;
      const isParent = parentLinkName && link["@name"] === parentLinkName;
      let linkedUnits = listUnits(linked.root, mergedIdIndex, info.catalogueId);
      if (!linkedUnits.length && nativeMenuCount === 0) linkedUnits = listSharedUnits(linked.root, mergedIdIndex);
      for (const { entry, link: innerLink } of linkedUnits) {
        if (units.some((u2) => u2.bsId === entry["@id"])) continue;
        if (entry["@import"] === "false" || innerLink && innerLink["@import"] === "false") continue;
        if (hiddenForPrimary(entry, innerLink)) continue;
        const u = extractUnit(entry, mergedIdIndex, factionKey, importedIdx++, detIdToName, catIdToName, innerLink, info.catalogueId);
        if (!isDatasheetUnit(u, entry)) continue;
        if (entry["@id"] && !rawUnitEntries.has(entry["@id"])) rawUnitEntries.set(entry["@id"], entry);
        const kwNative = !parentLinkName && nativeFactionKw.size > 0 && (u.factionKeywords || []).some((k) => nativeFactionKw.has(String(k).toLowerCase()));
        if (!isParent && !kwNative) u.isAllied = true;
        units.push(u);
      }
    }
    if (!parentLinkName && nativeMenuCount === 0 && linkedCats.some(({ link }) => link["@importRootEntries"] === "true")) {
      const importLinks = linkedCats.filter(({ link }) => link["@importRootEntries"] === "true").map(({ link }) => link["@name"]);
      console.warn(`[allied] "${factionKey}" has NO native datasheet menu and imports its roster from [${importLinks.join(", ")}] with none recognised as parent \u2192 ALL units flagged Allied. Add "${factionKey}": "<primary library link name>" to PARENT_CATALOGUE in bsdata-parser.mjs.`);
    }
    for (const u of units) {
      if (!Array.isArray(u.reqCatIds)) continue;
      const ids = new Set(u.reqUnitIds || []);
      for (const v of units) {
        const re = rawUnitEntries.get(v.bsId);
        if (!re || v.bsId === u.bsId) continue;
        if (arr(child(re, "categoryLinks.categoryLink")).some((cl) => u.reqCatIds.includes(cl["@targetId"]))) ids.add(v.bsId);
      }
      delete u.reqCatIds;
      if (ids.size) u.reqUnitIds = [...ids];
      else delete u.reqUnitIds;
    }
    units.forEach((u, i) => {
      u.id = `${factionKey}_${i}`;
    });
    const wpnDict = {};
    const weaponsById = {};
    const _statSig = (e) => e.slice(1).join("|");
    const addToDict = (w) => {
      const key = (w.n || "").toLowerCase();
      if (!key) return;
      if (!wpnDict[key]) wpnDict[key] = [];
      const arrW = weaponAsArray(w);
      const sig = _statSig(arrW);
      if (!wpnDict[key].some((x) => _statSig(x) === sig)) wpnDict[key].push(arrW);
    };
    for (const u of units) {
      for (const w of u.weapons) {
        addToDict(w);
        if (w.bsId && !weaponsById[w.bsId]) {
          weaponsById[w.bsId] = { n: w.n, t: w.t, rng: w.rng, a: w.a, sk: w.sk, s: w.s, ap: w.ap, d: w.d, kw: w.kw };
        }
      }
      for (const w of u.optWeapons || []) addToDict(w);
    }
    for (const u of units) delete u.optWeapons;
    const dets = getDets(info.root, mergedIdIndex, info.catalogueId);
    const ownEnhRes = getEnhs(info.root, mergedIdIndex, info.catalogueId, detIdToName);
    const enhs = ownEnhRes.list;
    let enhCap = ownEnhRes.cap;
    const enhMenuIds = new Set(ownEnhRes.menuIds || []);
    if (parentLinkName) {
      const parent = linkedCats.find(({ link }) => link["@name"] === parentLinkName);
      if (parent) {
        const seenDetIds = new Set(dets.map((d) => d.bsId).filter(Boolean));
        for (const d of getDets(parent.linked.root, mergedIdIndex, info.catalogueId)) {
          if (d.bsId && seenDetIds.has(d.bsId)) continue;
          dets.push(d);
        }
      }
    }
    const seenEnhIds = new Set(enhs.map((e) => e.bsId).filter(Boolean));
    const ownDetNames = new Set(dets.map((d) => d.name).filter(Boolean));
    for (const { linked } of linkedCats) {
      const linkedEnhRes = getEnhs(linked.root, mergedIdIndex, info.catalogueId, detIdToName);
      if (!enhCap && linkedEnhRes.cap) enhCap = linkedEnhRes.cap;
      for (const id of linkedEnhRes.menuIds || []) enhMenuIds.add(id);
      for (const e of linkedEnhRes.list) {
        if (e.bsId && seenEnhIds.has(e.bsId)) continue;
        if (!e.det || !ownDetNames.has(e.det)) continue;
        if (e.bsId) seenEnhIds.add(e.bsId);
        enhs.push(e);
      }
    }
    const factionKeywords = /* @__PURE__ */ new Set();
    for (const u of units) for (const k of u.keywords || []) factionKeywords.add(k);
    const allFactionKeywords = /* @__PURE__ */ new Set();
    for (const u of units) for (const k of u.factionKeywords || []) allFactionKeywords.add(k);
    {
      const declared = units.map((u) => u.factionKeywords || []).filter((fk) => fk.length);
      for (const fk of declared) {
        for (const k of fk) {
          if (factionKeywords.has(k)) continue;
          if (declared.some((other) => !other.includes(k))) factionKeywords.add(k);
        }
      }
    }
    for (const e of enhs) {
      if (e && (!e.reqKeywords || !e.reqKeywords.length)) {
        e.reqKeywords = enhReqKeywords(e.desc, factionKeywords, allFactionKeywords);
      }
      if (e) delete e.unitEnh;
    }
    {
      const enhIds = new Set(enhs.map((e) => e.bsId).filter(Boolean));
      if (enhIds.size) {
        const groupRefCache = /* @__PURE__ */ new Map();
        const resolveLinkTarget = (tid) => {
          if (groupRefCache.has(tid)) return groupRefCache.get(tid);
          const set = /* @__PURE__ */ new Set();
          groupRefCache.set(tid, set);
          if (enhMenuIds.has(tid)) return set;
          const tgt = mergedIdIndex.get(tid);
          if (tgt && !tgt["@type"]) collectIds(tgt, set);
          return set;
        };
        const collectIds = (node, into) => {
          if (!node || typeof node !== "object") return;
          if (Array.isArray(node)) {
            for (const x of node) collectIds(x, into);
            return;
          }
          if (node["@id"]) into.add(node["@id"]);
          const tid = node["@targetId"];
          if (tid) {
            into.add(tid);
            for (const id of resolveLinkTarget(tid)) into.add(id);
          }
          for (const v of Object.values(node)) if (v && typeof v === "object") collectIds(v, into);
        };
        const bearersByEnh = /* @__PURE__ */ new Map();
        for (const [unitBsId, rawEntry] of rawUnitEntries) {
          const refs = /* @__PURE__ */ new Set();
          collectIds(rawEntry, refs);
          for (const id of refs) {
            if (id === unitBsId || !enhIds.has(id)) continue;
            if (!bearersByEnh.has(id)) bearersByEnh.set(id, []);
            bearersByEnh.get(id).push(unitBsId);
          }
        }
        for (const e of enhs) {
          const b = e.bsId && bearersByEnh.get(e.bsId);
          if (b && b.length) e.bearers = [...new Set(b)];
        }
      }
    }
    {
      const detIds = new Set(detIdToName.keys());
      const UNIT_SCOPES = /* @__PURE__ */ new Set(["ancestor", "self", "parent"]);
      const evalCond = (c, cats2) => {
        if ((c.type === "instanceOf" || c.type === "notInstanceOf") && UNIT_SCOPES.has(c.scope)) {
          const has = cats2.has(c.childId);
          return c.type === "instanceOf" ? has : !has;
        }
        if (c.field === "forces" && c.type === "lessThan" && Number(c.value) === 1 && (c.childId === CRUSADE_FORCE_ID || c.childId === BOARDING_FORCE_ID)) return true;
        if (c.field === "selections" && c.type === "lessThan" && Number(c.value) === 1 && (c.scope === "force" || c.scope === "roster") && detIds.has(c.childId)) return false;
        return null;
      };
      const evalTree = (cg, cats2) => {
        if (!cg) return false;
        const parts = [
          ...(cg.conds || []).map((c) => evalCond(c, cats2)),
          ...(cg.groups || []).map((g) => evalTree(g, cats2))
        ];
        if (!parts.length) return false;
        if (cg.op === "or") {
          if (parts.some((p) => p === true)) return true;
          return parts.some((p) => p === null) ? null : false;
        }
        if (parts.some((p) => p === false)) return false;
        return parts.some((p) => p === null) ? null : true;
      };
      const refsAncestorCat = (cg) => (cg.conds || []).some((c) => (c.type === "instanceOf" || c.type === "notInstanceOf") && UNIT_SCOPES.has(c.scope)) || (cg.groups || []).some(refsAncestorCat);
      const reachesMenu = (entry) => {
        let found = false;
        (function walk2(n) {
          if (found || !n || typeof n !== "object") return;
          if (Array.isArray(n)) {
            for (const x of n) walk2(x);
            return;
          }
          if (n["@targetId"] && enhMenuIds.has(n["@targetId"])) {
            found = true;
            return;
          }
          for (const v of Object.values(n)) if (v && typeof v === "object") walk2(v);
        })(entry);
        return found;
      };
      let candidates = units.filter((u) => u.bsId && rawUnitEntries.has(u.bsId) && reachesMenu(rawUnitEntries.get(u.bsId)));
      if (!candidates.length) candidates = units.filter((u) => u.bsId);
      const menuPathCats = (entry) => {
        const out2 = /* @__PURE__ */ new Set();
        const own = (n) => {
          const cl = n && n.categoryLinks && n.categoryLinks.categoryLink;
          return (Array.isArray(cl) ? cl : cl ? [cl] : []).map((x) => x && x["@targetId"]).filter(Boolean);
        };
        (function walk2(n, path) {
          if (!n || typeof n !== "object") return;
          if (Array.isArray(n)) {
            for (const x of n) walk2(x, path);
            return;
          }
          if (n["@targetId"] && enhMenuIds.has(n["@targetId"])) {
            for (const a of path) for (const id of own(a)) out2.add(id);
            return;
          }
          const next = n["@id"] ? [...path, n] : path;
          for (const [k, v] of Object.entries(n)) if (k !== "categoryLinks" && v && typeof v === "object") walk2(v, next);
        })(entry, []);
        return out2;
      };
      const linkIdsByTarget = /* @__PURE__ */ new Map();
      for (const [lid, ln] of mergedIdIndex) if (ln && ln["@targetId"] && lid) {
        if (!linkIdsByTarget.has(ln["@targetId"])) linkIdsByTarget.set(ln["@targetId"], []);
        linkIdsByTarget.get(ln["@targetId"]).push(lid);
      }
      const selfIds = (bsId) => [bsId, ...linkIdsByTarget.get(bsId) || []];
      const catSets = new Map(candidates.map((u) => [u.bsId, /* @__PURE__ */ new Set([...u.categoryIds || [], ...selfIds(u.bsId), ...rawUnitEntries.has(u.bsId) ? menuPathCats(rawUnitEntries.get(u.bsId)) : []])]));
      const allCatSets = new Map(units.filter((u) => u.bsId).map((u) => [u.bsId, /* @__PURE__ */ new Set([...u.categoryIds || [], ...selfIds(u.bsId)])]));
      const collectNeedSel = (cg, into, selfId) => {
        for (const c of cg.conds || []) {
          if (selfId && c.childId === selfId) continue;
          if (c.type === "lessThan" && Number(c.value) <= 1 && c.field === "selections" && (c.scope === "ancestor" || c.scope === "parent") && c.childId) into.add(c.childId);
        }
        for (const g of cg.groups || []) collectNeedSel(g, into, selfId);
      };
      const needSelModsOf = /* @__PURE__ */ new Map();
      for (const e of enhs) {
        const needSel = /* @__PURE__ */ new Set();
        const nsMods = [];
        for (const m of e.hideMods || []) {
          const before = needSel.size;
          collectNeedSel(m.cg, needSel, e.bsId);
          if (needSel.size > before) nsMods.push(m);
        }
        if (needSel.size) {
          e.needSel = [...needSel];
          needSelModsOf.set(e, nsMods);
        }
        const mods = (e.hideMods || []).filter((m) => refsAncestorCat(m.cg));
        delete e.hideMods;
        if (!mods.length) continue;
        let anyDecidable = false;
        const eligible = [];
        for (const u of candidates) {
          const cats2 = catSets.get(u.bsId);
          let hidden = false;
          for (const m of mods) {
            const r = evalTree(m.cg, cats2);
            if (r !== null) anyDecidable = true;
            if (r === true) {
              hidden = true;
              break;
            }
          }
          if (!hidden) eligible.push(u.bsId);
        }
        if (!anyDecidable) continue;
        if (!eligible.length) {
          if (!(e.bearers && e.bearers.length)) {
            e.bearers = [];
            e.noBearer = true;
          }
          continue;
        }
        if (e.bearers && e.bearers.length) {
          const kept = e.bearers.filter((b) => {
            const cats2 = allCatSets.get(b);
            if (!cats2) return eligible.includes(b);
            for (const m of mods) if (evalTree(m.cg, cats2) === true) return false;
            return true;
          });
          if (kept.length) e.bearers = kept;
        } else {
          e.bearers = eligible;
        }
      }
      for (const [e, nsMods] of needSelModsOf) {
        if (!Array.isArray(e.bearers) || !e.bearers.length) continue;
        if (!nsMods.every((m) => refsAncestorCat(m.cg))) continue;
        e._nsUnd = new Set(e.bearers.filter((b) => {
          const cats2 = allCatSets.get(b) || catSets.get(b);
          if (!cats2) return true;
          return nsMods.some((m) => evalTree(m.cg, cats2) === null);
        }));
      }
    }
    {
      const potentialKw = (bsId) => {
        const entry = rawUnitEntries.get(bsId);
        const out2 = /* @__PURE__ */ new Set();
        (function walk2(n) {
          if (!n || typeof n !== "object") return;
          if (Array.isArray(n)) {
            for (const x of n) walk2(x);
            return;
          }
          for (const [k, v] of Object.entries(n)) {
            if (k === "categoryLink") {
              for (const cl of Array.isArray(v) ? v : [v]) {
                const nm = cl && cl["@name"];
                if (nm) out2.add(String(nm).toLowerCase());
              }
            } else if (v && typeof v === "object") walk2(v);
          }
        })(entry);
        return out2;
      };
      const kwSets = new Map(units.filter((u) => u.bsId).map((u) => [
        u.bsId,
        /* @__PURE__ */ new Set([
          ...[...u.keywords || [], ...u.factionKeywords || []].map((k) => String(k).toLowerCase()),
          ...potentialKw(u.bsId)
        ])
      ]));
      for (const e of enhs) {
        if (!Array.isArray(e.bearers) || !e.bearers.length) continue;
        if (!Array.isArray(e.reqKeywords) || !e.reqKeywords.length) continue;
        const gs = Array.isArray(e.reqKeywords[0]) ? e.reqKeywords : [e.reqKeywords];
        const kept = e.bearers.filter((b) => {
          const s = kwSets.get(b);
          if (!s) return true;
          return gs.some((g) => g.every((k) => s.has(String(k).toLowerCase())));
        });
        if (kept.length && kept.length < e.bearers.length) e.bearers = kept;
      }
      for (const e of enhs) {
        if (!e._nsUnd) continue;
        const forB = (e.bearers || []).filter((b) => e._nsUnd.has(b));
        if (Array.isArray(e.bearers) && forB.length < e.bearers.length) e.needSelFor = forB;
        delete e._nsUnd;
      }
    }
    {
      const wNorm = (x) => String(x || "").toLowerCase().replace(/^[➜➤\s]+/, "").split(" - ")[0].replace(/\s*\((aura|psychic)\)\s*/g, "").replace(/[’']/g, "'").trim();
      for (const u of units) {
        if (!Array.isArray(u.abilities) || !u.abilities.length) continue;
        const names = /* @__PURE__ */ new Set();
        for (const o of u.opts || []) for (const ch of o[1] || []) {
          names.add(wNorm(ch[0]));
          for (const w of Array.isArray(ch[3]) ? ch[3] : ch[3] ? [ch[3]] : []) if (w && w.n) names.add(wNorm(w.n));
        }
        for (const w of u.weapons || []) if (w && w.n) names.add(wNorm(w.n));
        for (const g of u.comp || []) for (const m of g[3] || []) for (const w of m[2] || []) {
          const nm = Array.isArray(w) ? w[0] : w && w.n;
          if (nm) names.add(wNorm(nm));
        }
        names.delete("");
        u.abilities = u.abilities.map((a) => {
          if (!Array.isArray(a) || a[4] || !names.has(wNorm(a[0]))) return a;
          const t = a.slice();
          t[2] = t[2] ?? null;
          t[3] = t[3] ?? null;
          t[4] = 1;
          return t;
        });
      }
    }
    let armyRules = extractArmyRules(info.root);
    if (!armyRules.length && parentLinkName) {
      const parent = linkedCats.find(({ link }) => link["@name"] === parentLinkName);
      if (parent && parent.linked && parent.linked.root) armyRules = extractArmyRules(parent.linked.root);
    }
    if (!armyRules.length) {
      const ownLib = linkedCats.find(({ link }) => (link["@name"] || "").includes(classify.name));
      if (ownLib && ownLib.linked && ownLib.linked.root) armyRules = extractArmyRules(ownLib.linked.root);
    }
    if (!armyRules.length) armyRules = deriveArmyRuleFromUnits(units);
    out[classify.name] = {
      alliance: classify.alliance,
      // This faction's primary catalogue id — the value runtime cost-mod
      // evaluation compares against for `primary-catalogue` conditions (the
      // ally price bump fires when a unit's own catalogueId ≠ this).
      catalogueId: info.catalogueId,
      units,
      dets,
      enhs,
      enhCap,
      armyRules,
      wpnDict,
      weaponsById,
      // Ally factions: a linked catalogue is an ally pool only if the faction
      // either IMPORTS its roster (importRootEntries="true") or links a PLAYABLE
      // faction catalogue directly (Chaos Knights ↔ Chaos Space Marines, Imperial
      // Knights → Adeptus Mechanicus). A plain <catalogueLink> to a LIBRARY
      // (library="true") is NOT an ally pool — it exists only so the faction can
      // resolve a handful of entries by id (Death Guard's detachment-gated Nurgle
      // daemons reach into the Daemons Library). Treating that reference link as
      // an ally made the app load EVERY Daemons unit (Be'lakor, Beasts of Nurgle…)
      // as a Death Guard ally, even though DG only fields the specific daemons its
      // Tallyband Summoners detachment grants. CSM / Chaos Knights keep daemon
      // allies because THEY import the Daemons Library with importRootEntries.
      allyFactions: linkedCats.filter(({ link, linked }) => link["@importRootEntries"] === "true" || linked && linked.root && linked.root["@library"] !== "true").map(({ link }) => linkedFactionName(link["@name"])).filter(Boolean)
    };
  }
  CURRENT_PRIMARY_CAT = null;
  return out;
}
export {
  canLeadOrphan,
  classifyCatFile,
  detAllies,
  detDpCost,
  extractTokens,
  getCoreRules,
  parseAllCatalogues,
  parseCatalogue
};
