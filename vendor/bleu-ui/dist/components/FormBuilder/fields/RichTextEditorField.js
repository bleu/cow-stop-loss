import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useContext, createContext, Suspense, lazy } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { useFormContext, Controller } from 'react-hook-form';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { useTranslation, Trans } from 'react-i18next';

var cn = function() {
    for(var _len = arguments.length, inputs = new Array(_len), _key = 0; _key < _len; _key++){
        inputs[_key] = arguments[_key];
    }
    return twMerge(clsx(inputs));
};

function _define_property$4(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread$4(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$4(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$2(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$2(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
        var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
        for(i = 0; i < sourceSymbolKeys.length; i++){
            key = sourceSymbolKeys[i];
            if (excluded.indexOf(key) >= 0) continue;
            if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
            target[key] = source[key];
        }
    }
    return target;
}
function _object_without_properties_loose$2(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
    }
    return target;
}
var labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
var Label = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$2(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(LabelPrimitive.Root, _object_spread$4({
        ref: ref,
        className: cn(labelVariants(), className)
    }, props));
});
Label.displayName = LabelPrimitive.Root.displayName;

function _define_property$3(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread$3(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$3(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$2(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$2(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$2(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$1(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$1(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
        var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
        for(i = 0; i < sourceSymbolKeys.length; i++){
            key = sourceSymbolKeys[i];
            if (excluded.indexOf(key) >= 0) continue;
            if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
            target[key] = source[key];
        }
    }
    return target;
}
function _object_without_properties_loose$1(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
    }
    return target;
}
var TooltipProvider = TooltipPrimitive.Provider;
var TooltipRoot = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, _param_sideOffset = _param.sideOffset, sideOffset = _param_sideOffset === void 0 ? 4 : _param_sideOffset, props = _object_without_properties$1(_param, [
        "className",
        "sideOffset"
    ]);
    return /*#__PURE__*/ jsx(TooltipPrimitive.Content, _object_spread$3({
        ref: ref,
        sideOffset: sideOffset,
        className: cn("z-50 rounded-md bg-primary px-3 py-1.5 text-xs max-w-96 text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className)
    }, props));
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
function Tooltip(_param) {
    var children = _param.children, content = _param.content, open = _param.open, defaultOpen = _param.defaultOpen, onOpenChange = _param.onOpenChange, props = _object_without_properties$1(_param, [
        "children",
        "content",
        "open",
        "defaultOpen",
        "onOpenChange"
    ]);
    if (!content) return children;
    return /*#__PURE__*/ jsx(TooltipProvider, {
        children: /*#__PURE__*/ jsxs(TooltipRoot, {
            open: open,
            defaultOpen: defaultOpen,
            onOpenChange: onOpenChange,
            delayDuration: 100,
            children: [
                /*#__PURE__*/ jsx(TooltipTrigger, {
                    asChild: true,
                    children: children
                }),
                /*#__PURE__*/ jsx(TooltipContent, _object_spread_props$2(_object_spread$3({
                    side: "top",
                    align: "center"
                }, props), {
                    children: /*#__PURE__*/ jsx("span", {
                        dangerouslySetInnerHTML: {
                            __html: content
                        }
                    })
                }))
            ]
        })
    });
}

function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property$2(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
function _iterable_to_array_limit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _non_iterable_rest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_destructuring_empty(o) {
    if (o === null || o === void 0) throw new TypeError("Cannot destructure " + o);
    return o;
}
function _object_spread$2(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$2(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$1(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$1(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$1(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
        var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
        for(i = 0; i < sourceSymbolKeys.length; i++){
            key = sourceSymbolKeys[i];
            if (excluded.indexOf(key) >= 0) continue;
            if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
            target[key] = source[key];
        }
    }
    return target;
}
function _object_without_properties_loose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
    }
    return target;
}
function _sliced_to_array(arr, i) {
    return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array(arr, i) || _non_iterable_rest();
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
// Create separate contexts for form field state and updater
var FormFieldStateContext = /*#__PURE__*/ React.createContext(undefined);
var FormFieldUpdaterContext = /*#__PURE__*/ React.createContext(undefined);
// Create a provider component for form field context
var FormFieldProvider = function(_param) {
    var children = _param.children, props = _object_without_properties(_param, [
        "children"
    ]);
    var _React_useState = _sliced_to_array(React.useState({
        name: props.name
    }), 2), fieldState = _React_useState[0], setFieldState = _React_useState[1];
    return /*#__PURE__*/ jsx(FormFieldStateContext.Provider, {
        value: fieldState,
        children: /*#__PURE__*/ jsx(FormFieldUpdaterContext.Provider, {
            value: setFieldState,
            children: children
        })
    });
};
var FormField = function(_param) {
    var props = _extends({}, _object_destructuring_empty(_param));
    return /*#__PURE__*/ jsx(FormFieldProvider, _object_spread_props$1(_object_spread$2({}, props), {
        children: /*#__PURE__*/ jsx(Controller, _object_spread$2({}, props))
    }));
};
// Use hooks to access form field state and updater
var useFormFieldState = function() {
    var fieldState = React.useContext(FormFieldStateContext);
    if (typeof fieldState === "undefined") {
        throw new Error("useFormFieldState must be used within a FormFieldProvider");
    }
    return fieldState;
};
// Create separate contexts for form item state and updater
var FormItemStateContext = /*#__PURE__*/ React.createContext(undefined);
var FormItemUpdaterContext = /*#__PURE__*/ React.createContext(undefined);
// Create a provider component for form item context
var FormItemProvider = function(param) {
    var children = param.children;
    var _React_useState = _sliced_to_array(React.useState({
        id: React.useId()
    }), 2), itemState = _React_useState[0], setItemState = _React_useState[1];
    return /*#__PURE__*/ jsx(FormItemStateContext.Provider, {
        value: itemState,
        children: /*#__PURE__*/ jsx(FormItemUpdaterContext.Provider, {
            value: setItemState,
            children: children
        })
    });
};
var FormItem = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(FormItemProvider, {
        children: /*#__PURE__*/ jsx("div", _object_spread$2({
            ref: ref,
            className: cn("space-y-2", className)
        }, props))
    });
});
FormItem.displayName = "FormItem";
// Use hooks to access form item state and updater
var useFormItemState = function() {
    var itemState = React.useContext(FormItemStateContext);
    if (typeof itemState === "undefined") {
        throw new Error("useFormItemState must be used within a FormItemProvider");
    }
    return itemState;
};
// const useFormItemUpdater = () => {
//   const setItemState = React.useContext(FormItemUpdaterContext);
//   if (typeof setItemState === "undefined") {
//     throw new Error(
//       "useFormItemUpdater must be used within a FormItemProvider"
//     );
//   }
//   return setItemState;
// };
var useFormField = function() {
    var fieldState = useFormFieldState();
    var itemState = useFormItemState();
    var _useFormContext = useFormContext(), getFieldState = _useFormContext.getFieldState, formState = _useFormContext.formState;
    var fieldStateFromForm = getFieldState(fieldState.name, formState);
    if (!fieldState) {
        throw new Error("useFormField should be used within <FormField>");
    }
    var id = itemState.id;
    return _object_spread$2({
        id: id,
        name: fieldState.name,
        formItemId: "".concat(id, "-form-item"),
        formDescriptionId: "".concat(id, "-form-item-description"),
        formMessageId: "".concat(id, "-form-item-message")
    }, fieldStateFromForm);
};
var FormLabel = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, tooltip = _param.tooltip, props = _object_without_properties(_param, [
        "className",
        "tooltip"
    ]);
    var _useFormField = useFormField(), error = _useFormField.error, formItemId = _useFormField.formItemId;
    return /*#__PURE__*/ jsx(Tooltip, {
        content: tooltip,
        children: /*#__PURE__*/ jsxs("div", {
            className: "flex items-center gap-x-2",
            children: [
                /*#__PURE__*/ jsx(Label, _object_spread$2({
                    ref: ref,
                    className: cn(error && "text-destructive", className),
                    htmlFor: formItemId
                }, props)),
                tooltip && /*#__PURE__*/ jsx(InfoCircledIcon, {})
            ]
        })
    });
});
FormLabel.displayName = "FormLabel";
var FormControl = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var props = _extends({}, _object_destructuring_empty(_param));
    var _useFormField = useFormField(), error = _useFormField.error, formItemId = _useFormField.formItemId, formDescriptionId = _useFormField.formDescriptionId, formMessageId = _useFormField.formMessageId;
    return /*#__PURE__*/ jsx(Slot, _object_spread$2({
        ref: ref,
        id: formItemId,
        "aria-describedby": !error ? "".concat(formDescriptionId) : "".concat(formDescriptionId, " ").concat(formMessageId),
        "aria-invalid": !!error
    }, props));
});
FormControl.displayName = "FormControl";
var FormDescription = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties(_param, [
        "className"
    ]);
    var formDescriptionId = useFormField().formDescriptionId;
    return /*#__PURE__*/ jsx("p", _object_spread$2({
        ref: ref,
        id: formDescriptionId,
        className: cn("text-muted-foreground text-sm", className)
    }, props));
});
FormDescription.displayName = "FormDescription";
var FormMessage = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, children = _param.children, props = _object_without_properties(_param, [
        "className",
        "children"
    ]);
    var _useFormField = useFormField(), error = _useFormField.error, formMessageId = _useFormField.formMessageId;
    var body = error ? String(error === null || error === void 0 ? void 0 : error.message) : children;
    if (!body) {
        return null;
    }
    return /*#__PURE__*/ jsx("p", _object_spread_props$1(_object_spread$2({
        ref: ref,
        id: formMessageId,
        className: cn("text-destructive text-sm font-medium", className)
    }, props), {
        children: body
    }));
});
FormMessage.displayName = "FormMessage";

var evaluateConditions = function(form, conditions, index) {
    if (!conditions) return true;
    if (conditions.allOf) {
        return conditions.allOf.every(function(cond) {
            return evaluateConditions(form, cond, index);
        });
    }
    if (conditions.anyOf) {
        return conditions.anyOf.some(function(cond) {
            return evaluateConditions(form, cond, index);
        });
    }
    if (Object.keys(conditions).length === 0) return true;
    var key = Object.keys(conditions)[0];
    var watchField = form.watch(key.replace("RESOURCE_ID", String(index)));
    var values = conditions[key];
    if (!Array.isArray(values)) {
        return values === watchField;
    }
    return values.includes(watchField);
};

function _define_property$1(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread$1(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$1(target, key, source[key]);
        });
    }
    return target;
}
function withConditional(Component) {
    return function(props) {
        var form = props.form, field = props.field;
        var shouldRender = evaluateConditions(form, field === null || field === void 0 ? void 0 : field.conditions, field === null || field === void 0 ? void 0 : field.index);
        if (!shouldRender) return null;
        return /*#__PURE__*/ jsx(Component, _object_spread$1({}, props));
    };
}

var initialState = {
    theme: "system",
    setTheme: function() {
        return null;
    }
};
var ThemeProviderContext = /*#__PURE__*/ createContext(initialState);
var useTheme = function() {
    var context = useContext(ThemeProviderContext);
    if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};

var JoditEditor = /*#__PURE__*/ lazy(function() {
    return(// @ts-ignore
    import('jodit-react').then(function(obj) {
        return typeof obj.default === "function" ? obj : obj.default;
    }));
});
var EDITOR_BUTTONS = [
    "undo",
    "redo",
    "|",
    "bold",
    "strikethrough",
    "underline",
    "italic",
    "|",
    "superscript",
    "subscript",
    "|",
    "align",
    "|",
    "ul",
    "ol",
    "outdent",
    "indent",
    "|",
    "font",
    "fontsize",
    "brush",
    "paragraph",
    "|",
    "image",
    "link",
    "table",
    "|",
    "hr",
    "eraser",
    "copyformat",
    "|",
    "fullsize",
    "selectall",
    "print",
    "|",
    "source"
];
function RichTextEditor(param) {
    var initialValue = param.initialValue, onChange = param.onChange;
    var theme = useTheme().theme;
    var t = useTranslation().t;
    return /*#__PURE__*/ jsx("div", {
        children: /*#__PURE__*/ jsx(Suspense, {
            fallback: /*#__PURE__*/ jsx(Trans, {
                children: "Loading"
            }),
            children: /*#__PURE__*/ jsx(JoditEditor, {
                value: initialValue,
                config: {
                    // @ts-ignore
                    placeholder: t("Start writing"),
                    readonly: false,
                    height: 300,
                    theme: theme,
                    toolbar: true,
                    buttons: EDITOR_BUTTONS,
                    // @ts-ignore
                    uploader: {
                        insertImageAsBase64URI: true
                    }
                },
                onBlur: function(content) {
                    return onChange(content);
                },
                onChange: function() {}
            })
        })
    });
}

function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
var RichTextEditorField = withConditional(function(param) {
    var form = param.form, field = param.field;
    var control = form.control, setValue = form.setValue;
    var defaultValue = form.getValues(field.name) || field.defaultValue || "";
    var handleRichTextChange = function(content) {
        setValue(field.name, content);
    };
    return /*#__PURE__*/ jsx(FormField, {
        control: control,
        name: field.name,
        // @ts-ignore
        rules: field.required && {
            required: true
        },
        defaultValue: defaultValue,
        render: function(param) {
            var formField = param.field;
            return /*#__PURE__*/ jsxs(FormItem, {
                className: "w-full",
                children: [
                    /*#__PURE__*/ jsx(FormLabel, {
                        tooltip: field.tooltip,
                        children: field.label
                    }),
                    /*#__PURE__*/ jsx(FormDescription, {
                        children: field.description
                    }),
                    /*#__PURE__*/ jsx("input", _object_spread_props(_object_spread({
                        hidden: true
                    }, formField), {
                        value: formField.value
                    })),
                    /*#__PURE__*/ jsx(RichTextEditor, {
                        initialValue: typeof formField.value === "string" ? formField.value : "",
                        onChange: handleRichTextChange
                    }),
                    /*#__PURE__*/ jsx(FormMessage, {})
                ]
            });
        }
    });
});

export { RichTextEditorField };
