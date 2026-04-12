"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_document";
exports.ids = ["pages/_document"];
exports.modules = {

/***/ "./context/ThemeContext.tsx":
/*!**********************************!*\
  !*** ./context/ThemeContext.tsx ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   THEME_STORAGE_KEY: () => (/* binding */ THEME_STORAGE_KEY),\n/* harmony export */   ThemeProvider: () => (/* binding */ ThemeProvider),\n/* harmony export */   applyDomTheme: () => (/* binding */ applyDomTheme),\n/* harmony export */   useTheme: () => (/* binding */ useTheme)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n\n\nconst THEME_STORAGE_KEY = \"ttd-theme\";\nconst ThemeContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)(null);\nfunction applyDomTheme(mode) {\n    if (typeof document === \"undefined\") {\n        return;\n    }\n    const root = document.documentElement;\n    if (mode === \"light\") {\n        root.setAttribute(\"data-theme\", \"light\");\n    } else {\n        root.removeAttribute(\"data-theme\");\n    }\n}\nfunction ThemeProvider({ children }) {\n    const [theme, setThemeState] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"dark\");\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useLayoutEffect)(()=>{\n        try {\n            const stored = window.localStorage.getItem(THEME_STORAGE_KEY);\n            if (stored === \"light\" || stored === \"dark\") {\n                setThemeState(stored);\n                applyDomTheme(stored);\n            } else {\n                applyDomTheme(\"dark\");\n            }\n        } catch  {\n            applyDomTheme(\"dark\");\n        }\n    }, []);\n    const setTheme = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((mode)=>{\n        setThemeState(mode);\n        applyDomTheme(mode);\n        try {\n            window.localStorage.setItem(THEME_STORAGE_KEY, mode);\n        } catch  {\n        /* ignore */ }\n    }, []);\n    const toggleTheme = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(()=>{\n        setThemeState((current)=>{\n            const next = current === \"dark\" ? \"light\" : \"dark\";\n            applyDomTheme(next);\n            try {\n                window.localStorage.setItem(THEME_STORAGE_KEY, next);\n            } catch  {\n            /* ignore */ }\n            return next;\n        });\n    }, []);\n    const value = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(()=>({\n            theme,\n            setTheme,\n            toggleTheme\n        }), [\n        theme,\n        setTheme,\n        toggleTheme\n    ]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(ThemeContext.Provider, {\n        value: value,\n        children: children\n    }, void 0, false, {\n        fileName: \"/Users/ishantmadaan/Projects/Natwest-talk_to_data/frontend/context/ThemeContext.tsx\",\n        lineNumber: 80,\n        columnNumber: 10\n    }, this);\n}\nfunction useTheme() {\n    const ctx = (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(ThemeContext);\n    if (!ctx) {\n        throw new Error(\"useTheme must be used within ThemeProvider\");\n    }\n    return ctx;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9jb250ZXh0L1RoZW1lQ29udGV4dC50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUWU7QUFFUixNQUFNTSxvQkFBb0IsWUFBWTtBQVU3QyxNQUFNQyw2QkFBZVAsb0RBQWFBLENBQTJCO0FBRXRELFNBQVNRLGNBQWNDLElBQWU7SUFDM0MsSUFBSSxPQUFPQyxhQUFhLGFBQWE7UUFDbkM7SUFDRjtJQUNBLE1BQU1DLE9BQU9ELFNBQVNFLGVBQWU7SUFDckMsSUFBSUgsU0FBUyxTQUFTO1FBQ3BCRSxLQUFLRSxZQUFZLENBQUMsY0FBYztJQUNsQyxPQUFPO1FBQ0xGLEtBQUtHLGVBQWUsQ0FBQztJQUN2QjtBQUNGO0FBRU8sU0FBU0MsY0FBYyxFQUFFQyxRQUFRLEVBQTJCO0lBQ2pFLE1BQU0sQ0FBQ0MsT0FBT0MsY0FBYyxHQUFHYiwrQ0FBUUEsQ0FBWTtJQUVuREYsc0RBQWVBLENBQUM7UUFDZCxJQUFJO1lBQ0YsTUFBTWdCLFNBQVNDLE9BQU9DLFlBQVksQ0FBQ0MsT0FBTyxDQUFDaEI7WUFDM0MsSUFBSWEsV0FBVyxXQUFXQSxXQUFXLFFBQVE7Z0JBQzNDRCxjQUFjQztnQkFDZFgsY0FBY1c7WUFDaEIsT0FBTztnQkFDTFgsY0FBYztZQUNoQjtRQUNGLEVBQUUsT0FBTTtZQUNOQSxjQUFjO1FBQ2hCO0lBQ0YsR0FBRyxFQUFFO0lBRUwsTUFBTWUsV0FBV3RCLGtEQUFXQSxDQUFDLENBQUNRO1FBQzVCUyxjQUFjVDtRQUNkRCxjQUFjQztRQUNkLElBQUk7WUFDRlcsT0FBT0MsWUFBWSxDQUFDRyxPQUFPLENBQUNsQixtQkFBbUJHO1FBQ2pELEVBQUUsT0FBTTtRQUNOLFVBQVUsR0FDWjtJQUNGLEdBQUcsRUFBRTtJQUVMLE1BQU1nQixjQUFjeEIsa0RBQVdBLENBQUM7UUFDOUJpQixjQUFjLENBQUNRO1lBQ2IsTUFBTUMsT0FBT0QsWUFBWSxTQUFTLFVBQVU7WUFDNUNsQixjQUFjbUI7WUFDZCxJQUFJO2dCQUNGUCxPQUFPQyxZQUFZLENBQUNHLE9BQU8sQ0FBQ2xCLG1CQUFtQnFCO1lBQ2pELEVBQUUsT0FBTTtZQUNOLFVBQVUsR0FDWjtZQUNBLE9BQU9BO1FBQ1Q7SUFDRixHQUFHLEVBQUU7SUFFTCxNQUFNQyxRQUFReEIsOENBQU9BLENBQ25CLElBQU87WUFBRWE7WUFBT007WUFBVUU7UUFBWSxJQUN0QztRQUFDUjtRQUFPTTtRQUFVRTtLQUFZO0lBR2hDLHFCQUFPLDhEQUFDbEIsYUFBYXNCLFFBQVE7UUFBQ0QsT0FBT0E7a0JBQVFaOzs7Ozs7QUFDL0M7QUFFTyxTQUFTYztJQUNkLE1BQU1DLE1BQU03QixpREFBVUEsQ0FBQ0s7SUFDdkIsSUFBSSxDQUFDd0IsS0FBSztRQUNSLE1BQU0sSUFBSUMsTUFBTTtJQUNsQjtJQUNBLE9BQU9EO0FBQ1QiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90YWxrLXRvLWRhdGEtZnJvbnRlbmQvLi9jb250ZXh0L1RoZW1lQ29udGV4dC50c3g/OTMxYiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBjcmVhdGVDb250ZXh0LFxuICB1c2VDYWxsYmFjayxcbiAgdXNlQ29udGV4dCxcbiAgdXNlTGF5b3V0RWZmZWN0LFxuICB1c2VNZW1vLFxuICB1c2VTdGF0ZSxcbiAgdHlwZSBSZWFjdE5vZGUsXG59IGZyb20gXCJyZWFjdFwiO1xuXG5leHBvcnQgY29uc3QgVEhFTUVfU1RPUkFHRV9LRVkgPSBcInR0ZC10aGVtZVwiO1xuXG5leHBvcnQgdHlwZSBUaGVtZU1vZGUgPSBcImxpZ2h0XCIgfCBcImRhcmtcIjtcblxudHlwZSBUaGVtZUNvbnRleHRWYWx1ZSA9IHtcbiAgdGhlbWU6IFRoZW1lTW9kZTtcbiAgc2V0VGhlbWU6IChtb2RlOiBUaGVtZU1vZGUpID0+IHZvaWQ7XG4gIHRvZ2dsZVRoZW1lOiAoKSA9PiB2b2lkO1xufTtcblxuY29uc3QgVGhlbWVDb250ZXh0ID0gY3JlYXRlQ29udGV4dDxUaGVtZUNvbnRleHRWYWx1ZSB8IG51bGw+KG51bGwpO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlEb21UaGVtZShtb2RlOiBUaGVtZU1vZGUpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCByb290ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICBpZiAobW9kZSA9PT0gXCJsaWdodFwiKSB7XG4gICAgcm9vdC5zZXRBdHRyaWJ1dGUoXCJkYXRhLXRoZW1lXCIsIFwibGlnaHRcIik7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLXRoZW1lXCIpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBUaGVtZVByb3ZpZGVyKHsgY2hpbGRyZW4gfTogeyBjaGlsZHJlbjogUmVhY3ROb2RlIH0pIHtcbiAgY29uc3QgW3RoZW1lLCBzZXRUaGVtZVN0YXRlXSA9IHVzZVN0YXRlPFRoZW1lTW9kZT4oXCJkYXJrXCIpO1xuXG4gIHVzZUxheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0b3JlZCA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShUSEVNRV9TVE9SQUdFX0tFWSkgYXMgVGhlbWVNb2RlIHwgbnVsbDtcbiAgICAgIGlmIChzdG9yZWQgPT09IFwibGlnaHRcIiB8fCBzdG9yZWQgPT09IFwiZGFya1wiKSB7XG4gICAgICAgIHNldFRoZW1lU3RhdGUoc3RvcmVkKTtcbiAgICAgICAgYXBwbHlEb21UaGVtZShzdG9yZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwbHlEb21UaGVtZShcImRhcmtcIik7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBhcHBseURvbVRoZW1lKFwiZGFya1wiKTtcbiAgICB9XG4gIH0sIFtdKTtcblxuICBjb25zdCBzZXRUaGVtZSA9IHVzZUNhbGxiYWNrKChtb2RlOiBUaGVtZU1vZGUpID0+IHtcbiAgICBzZXRUaGVtZVN0YXRlKG1vZGUpO1xuICAgIGFwcGx5RG9tVGhlbWUobW9kZSk7XG4gICAgdHJ5IHtcbiAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShUSEVNRV9TVE9SQUdFX0tFWSwgbW9kZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvKiBpZ25vcmUgKi9cbiAgICB9XG4gIH0sIFtdKTtcblxuICBjb25zdCB0b2dnbGVUaGVtZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBzZXRUaGVtZVN0YXRlKChjdXJyZW50KSA9PiB7XG4gICAgICBjb25zdCBuZXh0ID0gY3VycmVudCA9PT0gXCJkYXJrXCIgPyBcImxpZ2h0XCIgOiBcImRhcmtcIjtcbiAgICAgIGFwcGx5RG9tVGhlbWUobmV4dCk7XG4gICAgICB0cnkge1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oVEhFTUVfU1RPUkFHRV9LRVksIG5leHQpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8qIGlnbm9yZSAqL1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5leHQ7XG4gICAgfSk7XG4gIH0sIFtdKTtcblxuICBjb25zdCB2YWx1ZSA9IHVzZU1lbW8oXG4gICAgKCkgPT4gKHsgdGhlbWUsIHNldFRoZW1lLCB0b2dnbGVUaGVtZSB9KSxcbiAgICBbdGhlbWUsIHNldFRoZW1lLCB0b2dnbGVUaGVtZV0sXG4gICk7XG5cbiAgcmV0dXJuIDxUaGVtZUNvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3ZhbHVlfT57Y2hpbGRyZW59PC9UaGVtZUNvbnRleHQuUHJvdmlkZXI+O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlVGhlbWUoKSB7XG4gIGNvbnN0IGN0eCA9IHVzZUNvbnRleHQoVGhlbWVDb250ZXh0KTtcbiAgaWYgKCFjdHgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1c2VUaGVtZSBtdXN0IGJlIHVzZWQgd2l0aGluIFRoZW1lUHJvdmlkZXJcIik7XG4gIH1cbiAgcmV0dXJuIGN0eDtcbn1cbiJdLCJuYW1lcyI6WyJjcmVhdGVDb250ZXh0IiwidXNlQ2FsbGJhY2siLCJ1c2VDb250ZXh0IiwidXNlTGF5b3V0RWZmZWN0IiwidXNlTWVtbyIsInVzZVN0YXRlIiwiVEhFTUVfU1RPUkFHRV9LRVkiLCJUaGVtZUNvbnRleHQiLCJhcHBseURvbVRoZW1lIiwibW9kZSIsImRvY3VtZW50Iiwicm9vdCIsImRvY3VtZW50RWxlbWVudCIsInNldEF0dHJpYnV0ZSIsInJlbW92ZUF0dHJpYnV0ZSIsIlRoZW1lUHJvdmlkZXIiLCJjaGlsZHJlbiIsInRoZW1lIiwic2V0VGhlbWVTdGF0ZSIsInN0b3JlZCIsIndpbmRvdyIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJzZXRUaGVtZSIsInNldEl0ZW0iLCJ0b2dnbGVUaGVtZSIsImN1cnJlbnQiLCJuZXh0IiwidmFsdWUiLCJQcm92aWRlciIsInVzZVRoZW1lIiwiY3R4IiwiRXJyb3IiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./context/ThemeContext.tsx\n");

/***/ }),

/***/ "./pages/_document.tsx":
/*!*****************************!*\
  !*** ./pages/_document.tsx ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Document)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_document__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/document */ \"./node_modules/next/document.js\");\n/* harmony import */ var next_document__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_document__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _context_ThemeContext__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../context/ThemeContext */ \"./context/ThemeContext.tsx\");\n\n\n\nconst THEME_BOOT = `(function(){try{if(localStorage.getItem(\"${_context_ThemeContext__WEBPACK_IMPORTED_MODULE_2__.THEME_STORAGE_KEY}\")===\"light\")document.documentElement.setAttribute(\"data-theme\",\"light\");}catch(e){}})();`;\nfunction Document() {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Html, {\n        lang: \"en\",\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Head, {\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"script\", {\n                    dangerouslySetInnerHTML: {\n                        __html: THEME_BOOT\n                    }\n                }, void 0, false, {\n                    fileName: \"/Users/ishantmadaan/Projects/Natwest-talk_to_data/frontend/pages/_document.tsx\",\n                    lineNumber: 10,\n                    columnNumber: 9\n                }, this)\n            }, void 0, false, {\n                fileName: \"/Users/ishantmadaan/Projects/Natwest-talk_to_data/frontend/pages/_document.tsx\",\n                lineNumber: 9,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"body\", {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Main, {}, void 0, false, {\n                        fileName: \"/Users/ishantmadaan/Projects/Natwest-talk_to_data/frontend/pages/_document.tsx\",\n                        lineNumber: 13,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.NextScript, {}, void 0, false, {\n                        fileName: \"/Users/ishantmadaan/Projects/Natwest-talk_to_data/frontend/pages/_document.tsx\",\n                        lineNumber: 14,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/ishantmadaan/Projects/Natwest-talk_to_data/frontend/pages/_document.tsx\",\n                lineNumber: 12,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/ishantmadaan/Projects/Natwest-talk_to_data/frontend/pages/_document.tsx\",\n        lineNumber: 8,\n        columnNumber: 5\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fZG9jdW1lbnQudHN4IiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBNkQ7QUFDRDtBQUU1RCxNQUFNSyxhQUFhLENBQUMseUNBQXlDLEVBQUVELG9FQUFpQkEsQ0FBQyx5RkFBeUYsQ0FBQztBQUU1SixTQUFTRTtJQUN0QixxQkFDRSw4REFBQ0wsK0NBQUlBO1FBQUNNLE1BQUs7OzBCQUNULDhEQUFDUCwrQ0FBSUE7MEJBQ0gsNEVBQUNRO29CQUFPQyx5QkFBeUI7d0JBQUVDLFFBQVFMO29CQUFXOzs7Ozs7Ozs7OzswQkFFeEQsOERBQUNNOztrQ0FDQyw4REFBQ1QsK0NBQUlBOzs7OztrQ0FDTCw4REFBQ0MscURBQVVBOzs7Ozs7Ozs7Ozs7Ozs7OztBQUluQiIsInNvdXJjZXMiOlsid2VicGFjazovL3RhbGstdG8tZGF0YS1mcm9udGVuZC8uL3BhZ2VzL19kb2N1bWVudC50c3g/ZDM3ZCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIZWFkLCBIdG1sLCBNYWluLCBOZXh0U2NyaXB0IH0gZnJvbSBcIm5leHQvZG9jdW1lbnRcIjtcbmltcG9ydCB7IFRIRU1FX1NUT1JBR0VfS0VZIH0gZnJvbSBcIi4uL2NvbnRleHQvVGhlbWVDb250ZXh0XCI7XG5cbmNvbnN0IFRIRU1FX0JPT1QgPSBgKGZ1bmN0aW9uKCl7dHJ5e2lmKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiJHtUSEVNRV9TVE9SQUdFX0tFWX1cIik9PT1cImxpZ2h0XCIpZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNldEF0dHJpYnV0ZShcImRhdGEtdGhlbWVcIixcImxpZ2h0XCIpO31jYXRjaChlKXt9fSkoKTtgO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBEb2N1bWVudCgpIHtcbiAgcmV0dXJuIChcbiAgICA8SHRtbCBsYW5nPVwiZW5cIj5cbiAgICAgIDxIZWFkPlxuICAgICAgICA8c2NyaXB0IGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogVEhFTUVfQk9PVCB9fSAvPlxuICAgICAgPC9IZWFkPlxuICAgICAgPGJvZHk+XG4gICAgICAgIDxNYWluIC8+XG4gICAgICAgIDxOZXh0U2NyaXB0IC8+XG4gICAgICA8L2JvZHk+XG4gICAgPC9IdG1sPlxuICApO1xufVxuIl0sIm5hbWVzIjpbIkhlYWQiLCJIdG1sIiwiTWFpbiIsIk5leHRTY3JpcHQiLCJUSEVNRV9TVE9SQUdFX0tFWSIsIlRIRU1FX0JPT1QiLCJEb2N1bWVudCIsImxhbmciLCJzY3JpcHQiLCJkYW5nZXJvdXNseVNldElubmVySFRNTCIsIl9faHRtbCIsImJvZHkiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./pages/_document.tsx\n");

/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("react/jsx-runtime");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("./pages/_document.tsx")));
module.exports = __webpack_exports__;

})();