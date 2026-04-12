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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   THEME_STORAGE_KEY: () => (/* binding */ THEME_STORAGE_KEY),\n/* harmony export */   ThemeProvider: () => (/* binding */ ThemeProvider),\n/* harmony export */   applyDomTheme: () => (/* binding */ applyDomTheme),\n/* harmony export */   useTheme: () => (/* binding */ useTheme)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n\n\nconst THEME_STORAGE_KEY = \"ttd-theme\";\nconst ThemeContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)(null);\nfunction applyDomTheme(mode) {\n    if (typeof document === \"undefined\") {\n        return;\n    }\n    const root = document.documentElement;\n    if (mode === \"light\") {\n        root.setAttribute(\"data-theme\", \"light\");\n    } else {\n        root.removeAttribute(\"data-theme\");\n    }\n}\nfunction ThemeProvider({ children }) {\n    const [theme, setThemeState] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"light\");\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useLayoutEffect)(()=>{\n        try {\n            const stored = window.localStorage.getItem(THEME_STORAGE_KEY);\n            if (stored === \"light\" || stored === \"dark\") {\n                setThemeState(stored);\n                applyDomTheme(stored);\n            } else {\n                applyDomTheme(\"light\");\n            }\n        } catch  {\n            applyDomTheme(\"light\");\n        }\n    }, []);\n    const setTheme = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((mode)=>{\n        setThemeState(mode);\n        applyDomTheme(mode);\n        try {\n            window.localStorage.setItem(THEME_STORAGE_KEY, mode);\n        } catch  {\n        /* ignore */ }\n    }, []);\n    const toggleTheme = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(()=>{\n        setThemeState((current)=>{\n            const next = current === \"dark\" ? \"light\" : \"dark\";\n            applyDomTheme(next);\n            try {\n                window.localStorage.setItem(THEME_STORAGE_KEY, next);\n            } catch  {\n            /* ignore */ }\n            return next;\n        });\n    }, []);\n    const value = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(()=>({\n            theme,\n            setTheme,\n            toggleTheme\n        }), [\n        theme,\n        setTheme,\n        toggleTheme\n    ]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(ThemeContext.Provider, {\n        value: value,\n        children: children\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\nisha\\\\Downloads\\\\Natwest-talk_to_data-1\\\\frontend\\\\context\\\\ThemeContext.tsx\",\n        lineNumber: 80,\n        columnNumber: 10\n    }, this);\n}\nfunction useTheme() {\n    const ctx = (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(ThemeContext);\n    if (!ctx) {\n        throw new Error(\"useTheme must be used within ThemeProvider\");\n    }\n    return ctx;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9jb250ZXh0L1RoZW1lQ29udGV4dC50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUWU7QUFFUixNQUFNTSxvQkFBb0IsWUFBWTtBQVU3QyxNQUFNQyw2QkFBZVAsb0RBQWFBLENBQTJCO0FBRXRELFNBQVNRLGNBQWNDLElBQWU7SUFDM0MsSUFBSSxPQUFPQyxhQUFhLGFBQWE7UUFDbkM7SUFDRjtJQUNBLE1BQU1DLE9BQU9ELFNBQVNFLGVBQWU7SUFDckMsSUFBSUgsU0FBUyxTQUFTO1FBQ3BCRSxLQUFLRSxZQUFZLENBQUMsY0FBYztJQUNsQyxPQUFPO1FBQ0xGLEtBQUtHLGVBQWUsQ0FBQztJQUN2QjtBQUNGO0FBRU8sU0FBU0MsY0FBYyxFQUFFQyxRQUFRLEVBQTJCO0lBQ2pFLE1BQU0sQ0FBQ0MsT0FBT0MsY0FBYyxHQUFHYiwrQ0FBUUEsQ0FBWTtJQUVuREYsc0RBQWVBLENBQUM7UUFDZCxJQUFJO1lBQ0YsTUFBTWdCLFNBQVNDLE9BQU9DLFlBQVksQ0FBQ0MsT0FBTyxDQUFDaEI7WUFDM0MsSUFBSWEsV0FBVyxXQUFXQSxXQUFXLFFBQVE7Z0JBQzNDRCxjQUFjQztnQkFDZFgsY0FBY1c7WUFDaEIsT0FBTztnQkFDTFgsY0FBYztZQUNoQjtRQUNGLEVBQUUsT0FBTTtZQUNOQSxjQUFjO1FBQ2hCO0lBQ0YsR0FBRyxFQUFFO0lBRUwsTUFBTWUsV0FBV3RCLGtEQUFXQSxDQUFDLENBQUNRO1FBQzVCUyxjQUFjVDtRQUNkRCxjQUFjQztRQUNkLElBQUk7WUFDRlcsT0FBT0MsWUFBWSxDQUFDRyxPQUFPLENBQUNsQixtQkFBbUJHO1FBQ2pELEVBQUUsT0FBTTtRQUNOLFVBQVUsR0FDWjtJQUNGLEdBQUcsRUFBRTtJQUVMLE1BQU1nQixjQUFjeEIsa0RBQVdBLENBQUM7UUFDOUJpQixjQUFjLENBQUNRO1lBQ2IsTUFBTUMsT0FBT0QsWUFBWSxTQUFTLFVBQVU7WUFDNUNsQixjQUFjbUI7WUFDZCxJQUFJO2dCQUNGUCxPQUFPQyxZQUFZLENBQUNHLE9BQU8sQ0FBQ2xCLG1CQUFtQnFCO1lBQ2pELEVBQUUsT0FBTTtZQUNOLFVBQVUsR0FDWjtZQUNBLE9BQU9BO1FBQ1Q7SUFDRixHQUFHLEVBQUU7SUFFTCxNQUFNQyxRQUFReEIsOENBQU9BLENBQ25CLElBQU87WUFBRWE7WUFBT007WUFBVUU7UUFBWSxJQUN0QztRQUFDUjtRQUFPTTtRQUFVRTtLQUFZO0lBR2hDLHFCQUFPLDhEQUFDbEIsYUFBYXNCLFFBQVE7UUFBQ0QsT0FBT0E7a0JBQVFaOzs7Ozs7QUFDL0M7QUFFTyxTQUFTYztJQUNkLE1BQU1DLE1BQU03QixpREFBVUEsQ0FBQ0s7SUFDdkIsSUFBSSxDQUFDd0IsS0FBSztRQUNSLE1BQU0sSUFBSUMsTUFBTTtJQUNsQjtJQUNBLE9BQU9EO0FBQ1QiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90YWxrLXRvLWRhdGEtZnJvbnRlbmQvLi9jb250ZXh0L1RoZW1lQ29udGV4dC50c3g/OTMxYiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xyXG4gIGNyZWF0ZUNvbnRleHQsXHJcbiAgdXNlQ2FsbGJhY2ssXHJcbiAgdXNlQ29udGV4dCxcclxuICB1c2VMYXlvdXRFZmZlY3QsXHJcbiAgdXNlTWVtbyxcclxuICB1c2VTdGF0ZSxcclxuICB0eXBlIFJlYWN0Tm9kZSxcclxufSBmcm9tIFwicmVhY3RcIjtcclxuXHJcbmV4cG9ydCBjb25zdCBUSEVNRV9TVE9SQUdFX0tFWSA9IFwidHRkLXRoZW1lXCI7XHJcblxyXG5leHBvcnQgdHlwZSBUaGVtZU1vZGUgPSBcImxpZ2h0XCIgfCBcImRhcmtcIjtcclxuXHJcbnR5cGUgVGhlbWVDb250ZXh0VmFsdWUgPSB7XHJcbiAgdGhlbWU6IFRoZW1lTW9kZTtcclxuICBzZXRUaGVtZTogKG1vZGU6IFRoZW1lTW9kZSkgPT4gdm9pZDtcclxuICB0b2dnbGVUaGVtZTogKCkgPT4gdm9pZDtcclxufTtcclxuXHJcbmNvbnN0IFRoZW1lQ29udGV4dCA9IGNyZWF0ZUNvbnRleHQ8VGhlbWVDb250ZXh0VmFsdWUgfCBudWxsPihudWxsKTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhcHBseURvbVRoZW1lKG1vZGU6IFRoZW1lTW9kZSkge1xyXG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3Qgcm9vdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcclxuICBpZiAobW9kZSA9PT0gXCJsaWdodFwiKSB7XHJcbiAgICByb290LnNldEF0dHJpYnV0ZShcImRhdGEtdGhlbWVcIiwgXCJsaWdodFwiKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcm9vdC5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLXRoZW1lXCIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIFRoZW1lUHJvdmlkZXIoeyBjaGlsZHJlbiB9OiB7IGNoaWxkcmVuOiBSZWFjdE5vZGUgfSkge1xyXG4gIGNvbnN0IFt0aGVtZSwgc2V0VGhlbWVTdGF0ZV0gPSB1c2VTdGF0ZTxUaGVtZU1vZGU+KFwibGlnaHRcIik7XHJcblxyXG4gIHVzZUxheW91dEVmZmVjdCgoKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBzdG9yZWQgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oVEhFTUVfU1RPUkFHRV9LRVkpIGFzIFRoZW1lTW9kZSB8IG51bGw7XHJcbiAgICAgIGlmIChzdG9yZWQgPT09IFwibGlnaHRcIiB8fCBzdG9yZWQgPT09IFwiZGFya1wiKSB7XHJcbiAgICAgICAgc2V0VGhlbWVTdGF0ZShzdG9yZWQpO1xyXG4gICAgICAgIGFwcGx5RG9tVGhlbWUoc3RvcmVkKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBhcHBseURvbVRoZW1lKFwibGlnaHRcIik7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICBhcHBseURvbVRoZW1lKFwibGlnaHRcIik7XHJcbiAgICB9XHJcbiAgfSwgW10pO1xyXG5cclxuICBjb25zdCBzZXRUaGVtZSA9IHVzZUNhbGxiYWNrKChtb2RlOiBUaGVtZU1vZGUpID0+IHtcclxuICAgIHNldFRoZW1lU3RhdGUobW9kZSk7XHJcbiAgICBhcHBseURvbVRoZW1lKG1vZGUpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKFRIRU1FX1NUT1JBR0VfS0VZLCBtb2RlKTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICAvKiBpZ25vcmUgKi9cclxuICAgIH1cclxuICB9LCBbXSk7XHJcblxyXG4gIGNvbnN0IHRvZ2dsZVRoZW1lID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xyXG4gICAgc2V0VGhlbWVTdGF0ZSgoY3VycmVudCkgPT4ge1xyXG4gICAgICBjb25zdCBuZXh0ID0gY3VycmVudCA9PT0gXCJkYXJrXCIgPyBcImxpZ2h0XCIgOiBcImRhcmtcIjtcclxuICAgICAgYXBwbHlEb21UaGVtZShuZXh0KTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oVEhFTUVfU1RPUkFHRV9LRVksIG5leHQpO1xyXG4gICAgICB9IGNhdGNoIHtcclxuICAgICAgICAvKiBpZ25vcmUgKi9cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gbmV4dDtcclxuICAgIH0pO1xyXG4gIH0sIFtdKTtcclxuXHJcbiAgY29uc3QgdmFsdWUgPSB1c2VNZW1vKFxyXG4gICAgKCkgPT4gKHsgdGhlbWUsIHNldFRoZW1lLCB0b2dnbGVUaGVtZSB9KSxcclxuICAgIFt0aGVtZSwgc2V0VGhlbWUsIHRvZ2dsZVRoZW1lXSxcclxuICApO1xyXG5cclxuICByZXR1cm4gPFRoZW1lQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17dmFsdWV9PntjaGlsZHJlbn08L1RoZW1lQ29udGV4dC5Qcm92aWRlcj47XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1c2VUaGVtZSgpIHtcclxuICBjb25zdCBjdHggPSB1c2VDb250ZXh0KFRoZW1lQ29udGV4dCk7XHJcbiAgaWYgKCFjdHgpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInVzZVRoZW1lIG11c3QgYmUgdXNlZCB3aXRoaW4gVGhlbWVQcm92aWRlclwiKTtcclxuICB9XHJcbiAgcmV0dXJuIGN0eDtcclxufVxyXG4iXSwibmFtZXMiOlsiY3JlYXRlQ29udGV4dCIsInVzZUNhbGxiYWNrIiwidXNlQ29udGV4dCIsInVzZUxheW91dEVmZmVjdCIsInVzZU1lbW8iLCJ1c2VTdGF0ZSIsIlRIRU1FX1NUT1JBR0VfS0VZIiwiVGhlbWVDb250ZXh0IiwiYXBwbHlEb21UaGVtZSIsIm1vZGUiLCJkb2N1bWVudCIsInJvb3QiLCJkb2N1bWVudEVsZW1lbnQiLCJzZXRBdHRyaWJ1dGUiLCJyZW1vdmVBdHRyaWJ1dGUiLCJUaGVtZVByb3ZpZGVyIiwiY2hpbGRyZW4iLCJ0aGVtZSIsInNldFRoZW1lU3RhdGUiLCJzdG9yZWQiLCJ3aW5kb3ciLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwic2V0VGhlbWUiLCJzZXRJdGVtIiwidG9nZ2xlVGhlbWUiLCJjdXJyZW50IiwibmV4dCIsInZhbHVlIiwiUHJvdmlkZXIiLCJ1c2VUaGVtZSIsImN0eCIsIkVycm9yIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./context/ThemeContext.tsx\n");

/***/ }),

/***/ "./pages/_document.tsx":
/*!*****************************!*\
  !*** ./pages/_document.tsx ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Document)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_document__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/document */ \"./node_modules/next/document.js\");\n/* harmony import */ var next_document__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_document__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _context_ThemeContext__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../context/ThemeContext */ \"./context/ThemeContext.tsx\");\n\n\n\nconst THEME_BOOT = `(function(){try{var t=localStorage.getItem(\"${_context_ThemeContext__WEBPACK_IMPORTED_MODULE_2__.THEME_STORAGE_KEY}\");if(t===\"light\"||!t)document.documentElement.setAttribute(\"data-theme\",\"light\");}catch(e){document.documentElement.setAttribute(\"data-theme\",\"light\");}})();`;\nfunction Document() {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Html, {\n        lang: \"en\",\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Head, {\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"script\", {\n                    dangerouslySetInnerHTML: {\n                        __html: THEME_BOOT\n                    }\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\nisha\\\\Downloads\\\\Natwest-talk_to_data-1\\\\frontend\\\\pages\\\\_document.tsx\",\n                    lineNumber: 10,\n                    columnNumber: 9\n                }, this)\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\nisha\\\\Downloads\\\\Natwest-talk_to_data-1\\\\frontend\\\\pages\\\\_document.tsx\",\n                lineNumber: 9,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"body\", {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Main, {}, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\nisha\\\\Downloads\\\\Natwest-talk_to_data-1\\\\frontend\\\\pages\\\\_document.tsx\",\n                        lineNumber: 13,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.NextScript, {}, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\nisha\\\\Downloads\\\\Natwest-talk_to_data-1\\\\frontend\\\\pages\\\\_document.tsx\",\n                        lineNumber: 14,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"C:\\\\Users\\\\nisha\\\\Downloads\\\\Natwest-talk_to_data-1\\\\frontend\\\\pages\\\\_document.tsx\",\n                lineNumber: 12,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"C:\\\\Users\\\\nisha\\\\Downloads\\\\Natwest-talk_to_data-1\\\\frontend\\\\pages\\\\_document.tsx\",\n        lineNumber: 8,\n        columnNumber: 5\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fZG9jdW1lbnQudHN4IiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBNkQ7QUFDRDtBQUU1RCxNQUFNSyxhQUFhLENBQUMsNENBQTRDLEVBQUVELG9FQUFpQkEsQ0FBQyw4SkFBOEosQ0FBQztBQUVwTyxTQUFTRTtJQUN0QixxQkFDRSw4REFBQ0wsK0NBQUlBO1FBQUNNLE1BQUs7OzBCQUNULDhEQUFDUCwrQ0FBSUE7MEJBQ0gsNEVBQUNRO29CQUFPQyx5QkFBeUI7d0JBQUVDLFFBQVFMO29CQUFXOzs7Ozs7Ozs7OzswQkFFeEQsOERBQUNNOztrQ0FDQyw4REFBQ1QsK0NBQUlBOzs7OztrQ0FDTCw4REFBQ0MscURBQVVBOzs7Ozs7Ozs7Ozs7Ozs7OztBQUluQiIsInNvdXJjZXMiOlsid2VicGFjazovL3RhbGstdG8tZGF0YS1mcm9udGVuZC8uL3BhZ2VzL19kb2N1bWVudC50c3g/ZDM3ZCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIZWFkLCBIdG1sLCBNYWluLCBOZXh0U2NyaXB0IH0gZnJvbSBcIm5leHQvZG9jdW1lbnRcIjtcclxuaW1wb3J0IHsgVEhFTUVfU1RPUkFHRV9LRVkgfSBmcm9tIFwiLi4vY29udGV4dC9UaGVtZUNvbnRleHRcIjtcclxuXHJcbmNvbnN0IFRIRU1FX0JPT1QgPSBgKGZ1bmN0aW9uKCl7dHJ5e3ZhciB0PWxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiJHtUSEVNRV9TVE9SQUdFX0tFWX1cIik7aWYodD09PVwibGlnaHRcInx8IXQpZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNldEF0dHJpYnV0ZShcImRhdGEtdGhlbWVcIixcImxpZ2h0XCIpO31jYXRjaChlKXtkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2V0QXR0cmlidXRlKFwiZGF0YS10aGVtZVwiLFwibGlnaHRcIik7fX0pKCk7YDtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIERvY3VtZW50KCkge1xyXG4gIHJldHVybiAoXHJcbiAgICA8SHRtbCBsYW5nPVwiZW5cIj5cclxuICAgICAgPEhlYWQ+XHJcbiAgICAgICAgPHNjcmlwdCBkYW5nZXJvdXNseVNldElubmVySFRNTD17eyBfX2h0bWw6IFRIRU1FX0JPT1QgfX0gLz5cclxuICAgICAgPC9IZWFkPlxyXG4gICAgICA8Ym9keT5cclxuICAgICAgICA8TWFpbiAvPlxyXG4gICAgICAgIDxOZXh0U2NyaXB0IC8+XHJcbiAgICAgIDwvYm9keT5cclxuICAgIDwvSHRtbD5cclxuICApO1xyXG59XHJcbiJdLCJuYW1lcyI6WyJIZWFkIiwiSHRtbCIsIk1haW4iLCJOZXh0U2NyaXB0IiwiVEhFTUVfU1RPUkFHRV9LRVkiLCJUSEVNRV9CT09UIiwiRG9jdW1lbnQiLCJsYW5nIiwic2NyaXB0IiwiZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUwiLCJfX2h0bWwiLCJib2R5Il0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./pages/_document.tsx\n");

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