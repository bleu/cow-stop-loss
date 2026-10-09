import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, Cross2Icon, MagnifyingGlassIcon, CircleIcon, InfoCircledIcon, ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon, ArrowRightIcon, FileIcon, ClipboardCopyIcon, PlusCircledIcon, MoonIcon, SunIcon, ArrowDownIcon, ArrowUpIcon, CaretSortIcon, EyeNoneIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon, DotsHorizontalIcon, MixerHorizontalIcon, MoveIcon, TrashIcon, CalendarIcon, Cross1Icon } from '@radix-ui/react-icons';
import * as React from 'react';
import React__default, { useState, useEffect, createContext, useMemo, useContext, useLayoutEffect, useCallback, useRef, useReducer, Suspense, lazy } from 'react';
import { useNavigate, Link as Link$1, useNavigation, useSearchParams } from 'react-router-dom';
import { useTranslation, Trans, initReactI18next } from 'react-i18next';
import useSWR from 'swr';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { DayPicker } from 'react-day-picker';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Command as Command$1, useCommandState } from 'cmdk';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { DropdownMenuTrigger as DropdownMenuTrigger$1 } from '@radix-ui/react-dropdown-menu';
import { FormProvider, Controller, useFormContext, useForm, useFieldArray } from 'react-hook-form';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as ToastPrimitives from '@radix-ui/react-toast';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import useEmblaCarousel from 'embla-carousel-react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import copy from 'copy-to-clipboard';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues, getExpandedRowModel, getGroupedRowModel, flexRender } from '@tanstack/react-table';
import { Droppable, DragDropContext, Draggable } from 'react-beautiful-dnd';
import { format } from 'date-fns';
import { z } from 'zod';
import { HexAlphaColorPicker } from 'react-colorful';
import i18n$1 from 'i18next';

var cn = function() {
    for(var _len = arguments.length, inputs = new Array(_len), _key = 0; _key < _len; _key++){
        inputs[_key] = arguments[_key];
    }
    return twMerge(clsx(inputs));
};

function _define_property$T(obj, key, value) {
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
function _object_spread$T(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$T(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$B(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$B(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$B(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
var Icons = {
    Spinner: function(props) {
        return /*#__PURE__*/ jsx("svg", _object_spread_props$B(_object_spread$T({
            xmlns: "http://www.w3.org/2000/svg",
            width: "24",
            height: "24",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round"
        }, props), {
            children: /*#__PURE__*/ jsx("path", {
                d: "M21 12a9 9 0 1 1-6.219-8.56"
            })
        }));
    }
};

function _define_property$S(obj, key, value) {
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
function _object_spread$S(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$S(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$A(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$A(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$A(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$A(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$A(source, excluded);
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
function _object_without_properties_loose$A(source, excluded) {
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
var buttonVariants = cva("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
            destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
            outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-9 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-10 rounded-md px-8",
            icon: "h-9 w-9"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
var Button = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, variant = _param.variant, size = _param.size, _param_asChild = _param.asChild, asChild = _param_asChild === void 0 ? false : _param_asChild, _param_loading = _param.loading, loading = _param_loading === void 0 ? false : _param_loading, _loadingText = _param.loadingText, props = _object_without_properties$A(_param, [
        "className",
        "variant",
        "size",
        "asChild",
        "loading",
        "loadingText"
    ]);
    var Comp = asChild ? Slot : "button";
    var t = useTranslation().t;
    var loadingText = _loadingText !== null && _loadingText !== void 0 ? _loadingText : t("Loading");
    return /*#__PURE__*/ jsx(Comp, _object_spread_props$A(_object_spread$S({
        className: cn(buttonVariants({
            variant: variant,
            size: size
        }), className),
        ref: ref,
        disabled: loading
    }, props), {
        children: loading ? /*#__PURE__*/ jsxs(Fragment, {
            children: [
                /*#__PURE__*/ jsx(Icons.Spinner, {
                    "aria-label": loadingText,
                    className: "mr-2 size-4 animate-spin"
                }),
                loadingText
            ]
        }) : props.children
    }));
});
Button.displayName = "Button";

function _define_property$R(obj, key, value) {
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
function _object_spread$R(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$R(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$z(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$z(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$z(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$z(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$z(source, excluded);
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
function _object_without_properties_loose$z(source, excluded) {
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
var AlertDialog = AlertDialogPrimitive.Root;
var AlertDialogTrigger = AlertDialogPrimitive.Trigger;
var AlertDialogPortal = AlertDialogPrimitive.Portal;
var AlertDialogOverlay = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$z(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(AlertDialogPrimitive.Overlay, _object_spread_props$z(_object_spread$R({
        className: cn("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className)
    }, props), {
        ref: ref
    }));
});
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
var AlertDialogContent = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$z(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsxs(AlertDialogPortal, {
        children: [
            /*#__PURE__*/ jsx(AlertDialogOverlay, {}),
            /*#__PURE__*/ jsx(AlertDialogPrimitive.Content, _object_spread$R({
                ref: ref,
                className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg", className)
            }, props))
        ]
    });
});
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
var AlertDialogHeader = function(_param) {
    var className = _param.className, props = _object_without_properties$z(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("div", _object_spread$R({
        className: cn("flex flex-col space-y-2 text-center sm:text-left", className)
    }, props));
};
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = function(_param) {
    var className = _param.className, props = _object_without_properties$z(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("div", _object_spread$R({
        className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)
    }, props));
};
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$z(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(AlertDialogPrimitive.Title, _object_spread$R({
        ref: ref,
        className: cn("text-lg font-semibold", className)
    }, props));
});
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
var AlertDialogDescription = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$z(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(AlertDialogPrimitive.Description, _object_spread$R({
        ref: ref,
        className: cn("text-sm text-muted-foreground", className)
    }, props));
});
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
var AlertDialogAction = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$z(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(AlertDialogPrimitive.Action, _object_spread$R({
        ref: ref,
        className: cn(buttonVariants(), className)
    }, props));
});
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
var AlertDialogCancel = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$z(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(AlertDialogPrimitive.Cancel, _object_spread$R({
        ref: ref,
        className: cn(buttonVariants({
            variant: "outline"
        }), "mt-2 sm:mt-0", className)
    }, props));
});
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

function _define_property$Q(obj, key, value) {
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
function _object_spread$Q(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$Q(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$y(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$y(source, excluded);
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
function _object_without_properties_loose$y(source, excluded) {
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
var Avatar = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$y(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(AvatarPrimitive.Root, _object_spread$Q({
        ref: ref,
        className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)
    }, props));
});
Avatar.displayName = AvatarPrimitive.Root.displayName;
var AvatarImage = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$y(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(AvatarPrimitive.Image, _object_spread$Q({
        ref: ref,
        className: cn("aspect-square size-5", className)
    }, props));
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;
var AvatarFallback = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$y(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(AvatarPrimitive.Fallback, _object_spread$Q({
        ref: ref,
        className: cn("bg-muted flex size-full items-center justify-center rounded-full", className)
    }, props));
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

function _define_property$P(obj, key, value) {
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
function _object_spread$P(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$P(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$x(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$x(source, excluded);
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
function _object_without_properties_loose$x(source, excluded) {
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
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
    variants: {
        color: {
            primary: "bg-primary text-primary-foreground hover:bg-primary/80",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
            success: "bg-green text-primary-foreground hover:bg-green/80",
            pending: "bg-orange text-primary-foreground hover:bg-orange/80"
        },
        outline: {
            none: "",
            outline: "border-2 hover:border-current/80"
        },
        size: {
            xs: "text-xs",
            sm: "text-sm",
            md: "text-base",
            lg: "text-lg"
        }
    },
    compoundVariants: [
        {
            color: "primary",
            outline: "outline",
            className: "border-primary"
        },
        {
            color: "secondary",
            outline: "outline",
            className: "border-secondary"
        },
        {
            color: "destructive",
            outline: "outline",
            className: "border-destructive"
        },
        {
            color: "success",
            outline: "outline",
            className: "border-green"
        },
        {
            color: "pending",
            outline: "outline",
            className: "border-orange"
        }
    ],
    defaultVariants: {
        color: "primary",
        outline: "none",
        size: "xs"
    }
});
var Badge = function(_param) {
    var className = _param.className, color = _param.color, outline = _param.outline, size = _param.size, props = _object_without_properties$x(_param, [
        "className",
        "color",
        "outline",
        "size"
    ]);
    return /*#__PURE__*/ jsx("div", _object_spread$P({
        className: cn(badgeVariants({
            color: color,
            outline: outline,
            size: size
        }), className)
    }, props));
};

function _array_like_to_array$k(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$i(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property$O(obj, key, value) {
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
function _iterable_to_array_limit$i(arr, i) {
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
function _non_iterable_rest$i() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread$O(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$O(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$w(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$w(source, excluded);
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
function _object_without_properties_loose$w(source, excluded) {
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
function _sliced_to_array$i(arr, i) {
    return _array_with_holes$i(arr) || _iterable_to_array_limit$i(arr, i) || _unsupported_iterable_to_array$k(arr, i) || _non_iterable_rest$i();
}
function _unsupported_iterable_to_array$k(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$k(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$k(o, minLen);
}
var TimePicker = function(param) {
    var value = param.value, setValue = param.setValue, _param_className = param.className, className = _param_className === void 0 ? "" : _param_className;
    return /*#__PURE__*/ jsx("div", {
        className: cn("flex items-center space-y-2 p-3 sm:space-x-4 sm:space-y-0", className),
        children: /*#__PURE__*/ jsxs("label", {
            htmlFor: "time",
            className: "text-sm font-medium",
            children: [
                "Pick a time:",
                /*#__PURE__*/ jsx("input", {
                    id: "time",
                    type: "time",
                    value: value,
                    onChange: setValue,
                    className: cn(buttonVariants({
                        variant: "outline"
                    }), "form-input text-sm font-medium transition duration-200 ease-in-out", "focus:border-accent h-9 rounded-md border dark:border-2 bg-transparent p-2 focus:outline-none")
                })
            ]
        })
    });
};
var IconLeft = function() {
    return /*#__PURE__*/ jsx(ChevronLeftIcon, {
        className: "h-4 w-4"
    });
};
var IconRight = function() {
    return /*#__PURE__*/ jsx(ChevronRightIcon, {
        className: "h-4 w-4"
    });
};
function Calendar(_param) {
    var _param_withTime = _param.withTime, withTime = _param_withTime === void 0 ? true : _param_withTime, className = _param.className, classNames = _param.classNames, _param_showOutsideDays = _param.showOutsideDays, showOutsideDays = _param_showOutsideDays === void 0 ? true : _param_showOutsideDays, selected = _param.selected, setSelected = _param.onSelect, props = _object_without_properties$w(_param, [
        "withTime",
        "className",
        "classNames",
        "showOutsideDays",
        "selected",
        "onSelect"
    ]);
    var _React_useState = _sliced_to_array$i(React.useState(selected ? "".concat(new Date(selected).getHours().toString().padStart(2, "0"), ":").concat(new Date(selected).getMinutes().toString().padStart(2, "0")) : "00:00"), 2), timeValue = _React_useState[0], setTimeValue = _React_useState[1];
    var handleTimeChange = function(e) {
        var time = e.target.value;
        var _time_split_map = _sliced_to_array$i(time.split(":").map(function(str) {
            return parseInt(str, 10);
        }), 2), hours = _time_split_map[0], minutes = _time_split_map[1];
        // If the input is not a valid time, set the time to 00:00
        // This will handle 00 being inputed on 12h format
        hours = !Number.isFinite(hours) || hours < 0 || hours > 23 ? 0 : hours;
        minutes = !Number.isFinite(minutes) || minutes < 0 || minutes > 59 ? 0 : minutes;
        var validatedTime = "".concat(hours.toString().padStart(2, "0"), ":").concat(minutes.toString().padStart(2, "0"));
        if (!selected) {
            setTimeValue(validatedTime);
            return;
        }
        var selectedDate = new Date(selected);
        var newSelectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hours, minutes);
        setSelected(newSelectedDate);
        setTimeValue(validatedTime);
    };
    var handleDaySelect = function(date) {
        if (!timeValue || !date) {
            setSelected(date);
            return;
        }
        var _timeValue_split_map = _sliced_to_array$i(timeValue.split(":").map(function(str) {
            return parseInt(str, 10);
        }), 2), hours = _timeValue_split_map[0], minutes = _timeValue_split_map[1];
        var newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
        setSelected(newDate);
    };
    return /*#__PURE__*/ jsx("div", {
        children: /*#__PURE__*/ jsx(DayPicker, _object_spread$O({
            mode: "single",
            showOutsideDays: showOutsideDays,
            selected: selected,
            onSelect: handleDaySelect,
            className: cn("p-3", className),
            classNames: _object_spread$O({
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(buttonVariants({
                    variant: "outline"
                }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(buttonVariants({
                    variant: "ghost"
                }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible"
            }, classNames),
            components: {
                IconLeft: IconLeft,
                IconRight: IconRight
            },
            footer: withTime ? /*#__PURE__*/ jsx(TimePicker, {
                value: timeValue,
                setValue: handleTimeChange
            }) : null
        }, props))
    });
}
Calendar.displayName = "Calendar";

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}
function camelToSnake(str) {
    return str.replace(/([A-Z])/g, "_$1").toLowerCase();
}

function formatDate(date) {
    var language = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "en";
    return Intl.DateTimeFormat(language, {
        year: "numeric",
        month: "short",
        day: "numeric"
    }).format(new Date(date));
}
function formatDateTime(date) {
    var language = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "en";
    return Intl.DateTimeFormat(language, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZoneName: "short"
    }).format(new Date(date));
}
function formatDateToLocalDatetime(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    var hours = String(date.getHours()).padStart(2, "0");
    var minutes = String(date.getMinutes()).padStart(2, "0");
    return "".concat(year, "-").concat(month, "-").concat(day, "T").concat(hours, ":").concat(minutes);
}
var epochToDate = function(epoch) {
    return new Date(epoch * 1000);
};

function _type_of$3(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
var languageMap = {
    en: "en-US",
    "pt-BR": "pt-BR"
};
var formatNumber = function(number) {
    var decimals = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1, numberStyle = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "decimal", notation = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "compact", lessThanThresholdToReplace = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 0.001, language = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : "en";
    if (number === undefined || number === null || number === "") return "0";
    var num;
    if ((typeof number === "undefined" ? "undefined" : _type_of$3(number)) === "bigint") {
        num = Number(number.toString());
    } else {
        num = Number(number);
    }
    if (Number.isNaN(num)) return "Invalid Number";
    if (num === 0) return "0";
    var absNum = Math.abs(num);
    if (absNum > 0 && absNum < lessThanThresholdToReplace) {
        return "< ".concat(lessThanThresholdToReplace.toLocaleString(languageMap[language] || "en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }));
    }
    var options = {
        notation: notation,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        style: numberStyle
    };
    if (numberStyle === "currency") {
        options.currency = "USD";
    }
    return num.toLocaleString(languageMap[language] || "en-US", options);
};
function numberToPercent(value) {
    if (value === undefined) return undefined;
    return value * 100;
}
function percentToNumber(value) {
    return value / 100;
}
function convertStringToNumberAndRoundDown(value) {
    var num = parseFloat(value);
    if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
        return BigInt(Math.floor(num));
    }
    var integerPartLength = Math.floor(Math.abs(num)).toString().length;
    var maxDecimalPlaces = Math.max(0, 15 - integerPartLength);
    return Number(num.toFixed(maxDecimalPlaces));
}

/**
 * Serializes an object into a query string. This function handles nested objects, arrays,
 * and primitive data types (strings, numbers, booleans). It encodes keys and values to
 * ensure a valid query string. The function throws an error if the input is not an object.
 *
 * @example
 * // Basic usage
 * const params = { name: 'John', age: 30 };
 * serializeQuery(params);
 * > 'name=John&age=30'
 *
 * @example
 * // Nested objects and arrays
 * const complexParams = {
 *   user: { name: 'John', roles: ['admin', 'user'] },
 *   active: true
 * };
 * serializeQuery(complexParams);
 * > 'user[name]=John&user[roles][]=admin&user[roles][]=user&active=true'
 *
 * @param {Object} params - The object to be serialized into a query string.
 * @param {string} [prefix=""] - A prefix used for nested objects (internal use).
 * @returns {string} - The serialized query string.
 * @throws {Error} - Throws an error if the input is not an object.
 */ function _array_like_to_array$j(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$h(arr) {
    if (Array.isArray(arr)) return arr;
}
function _iterable_to_array_limit$h(arr, i) {
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
function _non_iterable_rest$h() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _sliced_to_array$h(arr, i) {
    return _array_with_holes$h(arr) || _iterable_to_array_limit$h(arr, i) || _unsupported_iterable_to_array$j(arr, i) || _non_iterable_rest$h();
}
function _type_of$2(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _unsupported_iterable_to_array$j(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$j(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$j(o, minLen);
}
function serializeQuery(params) {
    var prefix = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    if ((typeof params === "undefined" ? "undefined" : _type_of$2(params)) !== "object" || params === null) {
        throw new Error("Input must be an object");
    }
    return Object.entries(params).reduce(function(acc, param) {
        var _param = _sliced_to_array$h(param, 2), key = _param[0], value = _param[1];
        if (value == null) return acc;
        var fullKey = prefix ? "".concat(prefix, "[").concat(encodeURIComponent(key), "]") : encodeURIComponent(key);
        if (Array.isArray(value)) {
            value.forEach(function(elem) {
                acc.push("".concat(fullKey, "[]=").concat(encodeURIComponent(elem)));
            });
        } else if ((typeof value === "undefined" ? "undefined" : _type_of$2(value)) === "object") {
            acc.push(serializeQuery(value, fullKey));
        } else if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
            acc.push("".concat(fullKey, "=").concat(encodeURIComponent(value)));
        }
        return acc;
    }, []).join("&");
}
/**
 * Deserializes a query string into an object. This function can handle nested parameters
 * and arrays. It uses URLSearchParams to parse the query string and reconstructs the
 * original object structure. The function throws an error if the input is not a string.
 *
 * @example
 * const queryString = 'user[name]=John&user[roles][]=admin&user[roles][]=user&active=true';
 * deserializeQuery(queryString);
 * > { user: { name: 'John', roles: ['admin', 'user'] }, active: 'true' }
 *
 * @param {string} queryString - The query string to be deserialized into an object.
 * @returns {Object} - The deserialized object.
 * @throws {Error} - Throws an error if the input is not a string.
 */ function deserializeQuery(queryString) {
    if (typeof queryString !== "string") {
        throw new Error("Query string must be a string");
    }
    var result = {};
    var params = new URLSearchParams(queryString);
    params.forEach(function(value, key) {
        var path = key.split(/\[|\]/).filter(Boolean);
        var current = result;
        path.forEach(function(part, index) {
            var isLast = index === path.length - 1;
            if (isLast) {
                if (current[part]) {
                    if (Array.isArray(current[part])) {
                        current[part].push(value);
                    } else {
                        current[part] = [
                            current[part],
                            value
                        ];
                    }
                } else {
                    current[part] = value;
                }
            } else if (part.endsWith("[]")) {
                var arrayKey = part.slice(0, -2);
                current[arrayKey] = current[arrayKey] || [];
                current = current[arrayKey];
            } else {
                current[part] = current[part] || {};
                current = current[part];
            }
        });
    });
    return result;
}

function _define_property$N(obj, key, value) {
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
function _object_spread$N(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$N(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$v(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$v(source, excluded);
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
function _object_without_properties_loose$v(source, excluded) {
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
var Card = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$v(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("div", _object_spread$N({
        ref: ref,
        className: cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)
    }, props));
});
Card.displayName = "Card";
var CardHeader = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$v(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("div", _object_spread$N({
        ref: ref,
        className: cn("flex flex-col space-y-1.5 p-6", className)
    }, props));
});
CardHeader.displayName = "CardHeader";
var CardTitle = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$v(_param, [
        "className"
    ]);
    return(// eslint-disable-next-line jsx-a11y/heading-has-content
    /*#__PURE__*/ jsx("h3", _object_spread$N({
        ref: ref,
        className: cn("text-2xl font-semibold leading-none tracking-tight", className)
    }, props)));
});
CardTitle.displayName = "CardTitle";
var CardDescription = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$v(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("p", _object_spread$N({
        ref: ref,
        className: cn("text-sm text-muted-foreground", className)
    }, props));
});
CardDescription.displayName = "CardDescription";
var CardContent = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$v(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("div", _object_spread$N({
        ref: ref,
        className: cn("p-6 pt-0", className)
    }, props));
});
CardContent.displayName = "CardContent";
var CardFooter = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$v(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("div", _object_spread$N({
        ref: ref,
        className: cn("flex items-center p-6 pt-0", className)
    }, props));
});
CardFooter.displayName = "CardFooter";

function _define_property$M(obj, key, value) {
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
function _object_spread$M(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$M(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$y(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$y(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$y(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$u(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$u(source, excluded);
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
function _object_without_properties_loose$u(source, excluded) {
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
var Checkbox = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$u(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(CheckboxPrimitive.Root, _object_spread_props$y(_object_spread$M({
        ref: ref,
        className: cn("border-primary ring-offset-background focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground peer h-4 w-4 shrink-0 rounded-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)
    }, props), {
        children: /*#__PURE__*/ jsx(CheckboxPrimitive.Indicator, {
            className: cn("flex items-center justify-center text-current"),
            children: /*#__PURE__*/ jsx(CheckIcon, {
                className: "h-4 w-4"
            })
        })
    }));
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

function _define_property$L(obj, key, value) {
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
function _object_spread$L(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$L(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$x(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$x(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$x(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$t(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$t(source, excluded);
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
function _object_without_properties_loose$t(source, excluded) {
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
var Dialog = DialogPrimitive.Root;
var DialogTrigger = DialogPrimitive.Trigger;
var DialogPortal = DialogPrimitive.Portal;
var DialogClose = DialogPrimitive.Close;
var DialogOverlay = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$t(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(DialogPrimitive.Overlay, _object_spread$L({
        ref: ref,
        className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className)
    }, props));
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
var DialogContent = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, children = _param.children, closeButton = _param.closeButton, props = _object_without_properties$t(_param, [
        "className",
        "children",
        "closeButton"
    ]);
    var defaultCloseButton = /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Cross2Icon, {
                className: "h-4 w-4"
            }),
            /*#__PURE__*/ jsx("span", {
                className: "sr-only",
                children: "Close"
            })
        ]
    });
    return /*#__PURE__*/ jsxs(DialogPortal, {
        children: [
            /*#__PURE__*/ jsx(DialogOverlay, {}),
            /*#__PURE__*/ jsxs(DialogPrimitive.Content, _object_spread_props$x(_object_spread$L({
                ref: ref,
                className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg", className)
            }, props), {
                children: [
                    children,
                    /*#__PURE__*/ jsx(DialogClose, {
                        className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
                        children: closeButton || defaultCloseButton
                    })
                ]
            }))
        ]
    });
});
DialogContent.displayName = DialogPrimitive.Content.displayName;
var DialogHeader = function(_param) {
    var className = _param.className, props = _object_without_properties$t(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("div", _object_spread$L({
        className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className)
    }, props));
};
DialogHeader.displayName = "DialogHeader";
var DialogFooter = function(_param) {
    var className = _param.className, props = _object_without_properties$t(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("div", _object_spread$L({
        className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)
    }, props));
};
DialogFooter.displayName = "DialogFooter";
var DialogTitle = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$t(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(DialogPrimitive.Title, _object_spread$L({
        ref: ref,
        className: cn("text-lg font-semibold leading-none tracking-tight", className)
    }, props));
});
DialogTitle.displayName = DialogPrimitive.Title.displayName;
var DialogDescription = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$t(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(DialogPrimitive.Description, _object_spread$L({
        ref: ref,
        className: cn("text-sm text-muted-foreground", className)
    }, props));
});
DialogDescription.displayName = DialogPrimitive.Description.displayName;

function _define_property$K(obj, key, value) {
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
function _object_spread$K(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$K(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$w(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$w(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$w(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$s(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$s(source, excluded);
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
function _object_without_properties_loose$s(source, excluded) {
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
var Command = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$s(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(Command$1, _object_spread$K({
        ref: ref,
        className: cn("bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md", className)
    }, props));
});
Command.displayName = Command$1.displayName;
var CommandDialog = function(_param) {
    var children = _param.children, loading = _param.loading, props = _object_without_properties$s(_param, [
        "children",
        "loading"
    ]);
    return /*#__PURE__*/ jsx(Dialog, _object_spread_props$w(_object_spread$K({}, props), {
        children: /*#__PURE__*/ jsx(DialogContent, {
            className: cn("overflow-hidden p-0 shadow-lg", props.className),
            closeButton: loading ? /*#__PURE__*/ jsx("p", {
                className: "text-muted-foreground justify-end",
                children: /*#__PURE__*/ jsxs("svg", {
                    className: "animate-spin h-4 w-4",
                    xmlns: "http://www.w3.org/2000/svg",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    children: [
                        /*#__PURE__*/ jsx("circle", {
                            className: "opacity-25",
                            cx: "12",
                            cy: "12",
                            r: "10",
                            stroke: "currentColor",
                            strokeWidth: "4"
                        }),
                        /*#__PURE__*/ jsx("path", {
                            className: "opacity-75",
                            fill: "currentColor",
                            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        })
                    ]
                })
            }) : undefined,
            children: /*#__PURE__*/ jsx(Command, {
                className: "[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5",
                children: children
            })
        })
    }));
};
var CommandInput = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, loading = _param.loading, children = _param.children, props = _object_without_properties$s(_param, [
        "className",
        "loading",
        "children"
    ]);
    return(// eslint-disable-next-line react/no-unknown-property
    /*#__PURE__*/ jsxs("div", {
        className: cn("grid grid-cols-[auto_1fr] gap-2 items-center px-3", className),
        // eslint-disable-next-line react/no-unknown-property
        "cmdk-input-wrapper": "",
        children: [
            /*#__PURE__*/ jsx("div", {
                children: loading ? /*#__PURE__*/ jsxs("svg", {
                    className: "animate-spin h-4 w-4 opacity-50",
                    xmlns: "http://www.w3.org/2000/svg",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    children: [
                        /*#__PURE__*/ jsx("circle", {
                            className: "opacity-25",
                            cx: "12",
                            cy: "12",
                            r: "10",
                            stroke: "currentColor",
                            strokeWidth: "4"
                        }),
                        /*#__PURE__*/ jsx("path", {
                            className: "opacity-75",
                            fill: "currentColor",
                            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        })
                    ]
                }) : /*#__PURE__*/ jsx(MagnifyingGlassIcon, {
                    className: "h-4 w-4 opacity-50"
                })
            }),
            /*#__PURE__*/ jsx(Command$1.Input, _object_spread_props$w(_object_spread$K({
                ref: ref,
                className: cn("placeholder:text-muted-foreground flex h-11 w-full rounded-md border-none bg-transparent py-3 text-sm focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50")
            }, props), {
                children: children
            }))
        ]
    }));
});
CommandInput.displayName = Command$1.Input.displayName;
var CommandList = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$s(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(Command$1.List, _object_spread$K({
        ref: ref,
        className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)
    }, props));
});
CommandList.displayName = Command$1.List.displayName;
var CommandEmpty = /*#__PURE__*/ React.forwardRef(function(props, ref) {
    return /*#__PURE__*/ jsx(Command$1.Empty, _object_spread$K({
        ref: ref,
        className: "py-6 text-center text-sm"
    }, props));
});
CommandEmpty.displayName = Command$1.Empty.displayName;
var CommandGroup = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$s(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(Command$1.Group, _object_spread$K({
        ref: ref,
        className: cn("text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium", className)
    }, props));
});
CommandGroup.displayName = Command$1.Group.displayName;
var CommandSeparator = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$s(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(Command$1.Separator, _object_spread$K({
        ref: ref,
        className: cn("bg-border -mx-1 h-px", className)
    }, props));
});
CommandSeparator.displayName = Command$1.Separator.displayName;
var CommandItem = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$s(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(Command$1.Item, _object_spread$K({
        ref: ref,
        className: cn("aria-[selected='true']:bg-accent aria-[selected='true']:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50", className)
    }, props));
});
CommandItem.displayName = Command$1.Item.displayName;
var CommandShortcut = function(_param) {
    var className = _param.className, props = _object_without_properties$s(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("span", _object_spread$K({
        className: cn("text-muted-foreground ml-auto text-xs tracking-widest", className)
    }, props));
};
CommandShortcut.displayName = "CommandShortcut";

function _array_like_to_array$i(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$g(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property$J(obj, key, value) {
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
function _iterable_to_array_limit$g(arr, i) {
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
function _non_iterable_rest$g() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread$J(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$J(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$v(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$v(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$v(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$r(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$r(source, excluded);
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
function _object_without_properties_loose$r(source, excluded) {
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
function _sliced_to_array$g(arr, i) {
    return _array_with_holes$g(arr) || _iterable_to_array_limit$g(arr, i) || _unsupported_iterable_to_array$i(arr, i) || _non_iterable_rest$g();
}
function _unsupported_iterable_to_array$i(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$i(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$i(o, minLen);
}
function Counter(_param) {
    var duration = _param.duration, toValue = _param.toValue, fromValue = _param.fromValue, _param_delimiter = _param.delimiter, delimiter = _param_delimiter === void 0 ? "," : _param_delimiter, props = _object_without_properties$r(_param, [
        "duration",
        "toValue",
        "fromValue",
        "delimiter"
    ]);
    var _useState = _sliced_to_array$g(useState(fromValue), 2), currentValue = _useState[0], setCurrentValue = _useState[1];
    useEffect(function() {
        var difference = toValue - fromValue;
        var startTime = Date.now();
        var updateCounter = function() {
            var elapsedTime = Date.now() - startTime;
            if (elapsedTime < duration) {
                var newCount = fromValue + difference * (elapsedTime / duration);
                setCurrentValue(Math.floor(newCount));
                requestAnimationFrame(updateCounter);
            } else {
                setCurrentValue(toValue);
            }
        };
        requestAnimationFrame(updateCounter);
    }, [
        duration,
        toValue,
        fromValue
    ]);
    return /*#__PURE__*/ jsx("span", _object_spread_props$v(_object_spread$J({}, props), {
        children: currentValue.toLocaleString("en-US", {
            useGrouping: delimiter === ","
        })
    }));
}

function _define_property$I(obj, key, value) {
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
function _object_spread$I(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$I(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$u(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$u(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$u(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$q(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$q(source, excluded);
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
function _object_without_properties_loose$q(source, excluded) {
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
var DropdownMenu = DropdownMenuPrimitive.Root;
var DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
var DropdownMenuGroup = DropdownMenuPrimitive.Group;
var DropdownMenuPortal = DropdownMenuPrimitive.Portal;
var DropdownMenuSub = DropdownMenuPrimitive.Sub;
var DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
var DropdownMenuSubTrigger = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, inset = _param.inset, children = _param.children, props = _object_without_properties$q(_param, [
        "className",
        "inset",
        "children"
    ]);
    return /*#__PURE__*/ jsxs(DropdownMenuPrimitive.SubTrigger, _object_spread_props$u(_object_spread$I({
        ref: ref,
        className: cn("focus:bg-accent data-[state=open]:bg-accent flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none", inset && "pl-8", className)
    }, props), {
        children: [
            children,
            /*#__PURE__*/ jsx(ChevronRightIcon, {
                className: "ml-auto h-4 w-4"
            })
        ]
    }));
});
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
var DropdownMenuSubContent = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$q(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(DropdownMenuPrimitive.SubContent, _object_spread$I({
        ref: ref,
        className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg", className)
    }, props));
});
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
var DropdownMenuContent = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, _param_sideOffset = _param.sideOffset, sideOffset = _param_sideOffset === void 0 ? 4 : _param_sideOffset, props = _object_without_properties$q(_param, [
        "className",
        "sideOffset"
    ]);
    return /*#__PURE__*/ jsx(DropdownMenuPrimitive.Portal, {
        children: /*#__PURE__*/ jsx(DropdownMenuPrimitive.Content, _object_spread$I({
            ref: ref,
            sideOffset: sideOffset,
            className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md", className)
        }, props))
    });
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
var DropdownMenuItem = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, inset = _param.inset, props = _object_without_properties$q(_param, [
        "className",
        "inset"
    ]);
    return /*#__PURE__*/ jsx(DropdownMenuPrimitive.Item, _object_spread$I({
        ref: ref,
        className: cn("focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50", inset && "pl-8", className)
    }, props));
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
var DropdownMenuCheckboxItem = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, children = _param.children, checked = _param.checked, props = _object_without_properties$q(_param, [
        "className",
        "children",
        "checked"
    ]);
    return /*#__PURE__*/ jsxs(DropdownMenuPrimitive.CheckboxItem, _object_spread_props$u(_object_spread$I({
        ref: ref,
        className: cn("focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
        checked: checked
    }, props), {
        children: [
            /*#__PURE__*/ jsx("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ jsx(DropdownMenuPrimitive.ItemIndicator, {
                    children: /*#__PURE__*/ jsx(CheckIcon, {
                        className: "h-4 w-4"
                    })
                })
            }),
            children
        ]
    }));
});
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
var DropdownMenuRadioItem = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, children = _param.children, props = _object_without_properties$q(_param, [
        "className",
        "children"
    ]);
    return /*#__PURE__*/ jsxs(DropdownMenuPrimitive.RadioItem, _object_spread_props$u(_object_spread$I({
        ref: ref,
        className: cn("focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)
    }, props), {
        children: [
            /*#__PURE__*/ jsx("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ jsx(DropdownMenuPrimitive.ItemIndicator, {
                    children: /*#__PURE__*/ jsx(CircleIcon, {
                        className: "h-2 w-2 fill-current"
                    })
                })
            }),
            children
        ]
    }));
});
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
var DropdownMenuLabel = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, inset = _param.inset, props = _object_without_properties$q(_param, [
        "className",
        "inset"
    ]);
    return /*#__PURE__*/ jsx(DropdownMenuPrimitive.Label, _object_spread$I({
        ref: ref,
        className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)
    }, props));
});
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
var DropdownMenuSeparator = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$q(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(DropdownMenuPrimitive.Separator, _object_spread$I({
        ref: ref,
        className: cn("bg-muted -mx-1 my-1 h-px", className)
    }, props));
});
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
var DropdownMenuShortcut = function(_param) {
    var className = _param.className, props = _object_without_properties$q(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("span", _object_spread$I({
        className: cn("ml-auto text-xs tracking-widest opacity-60", className)
    }, props));
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

function _define_property$H(obj, key, value) {
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
function _object_spread$H(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$H(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$p(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$p(source, excluded);
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
function _object_without_properties_loose$p(source, excluded) {
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
    var className = _param.className, props = _object_without_properties$p(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(LabelPrimitive.Root, _object_spread$H({
        ref: ref,
        className: cn(labelVariants(), className)
    }, props));
});
Label.displayName = LabelPrimitive.Root.displayName;

function _define_property$G(obj, key, value) {
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
function _object_spread$G(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$G(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$t(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$t(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$t(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$o(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$o(source, excluded);
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
function _object_without_properties_loose$o(source, excluded) {
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
    var className = _param.className, _param_sideOffset = _param.sideOffset, sideOffset = _param_sideOffset === void 0 ? 4 : _param_sideOffset, props = _object_without_properties$o(_param, [
        "className",
        "sideOffset"
    ]);
    return /*#__PURE__*/ jsx(TooltipPrimitive.Content, _object_spread$G({
        ref: ref,
        sideOffset: sideOffset,
        className: cn("z-50 rounded-md bg-primary px-3 py-1.5 text-xs max-w-96 text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className)
    }, props));
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
function Tooltip(_param) {
    var children = _param.children, content = _param.content, open = _param.open, defaultOpen = _param.defaultOpen, onOpenChange = _param.onOpenChange, props = _object_without_properties$o(_param, [
        "children",
        "content",
        "open",
        "defaultOpen",
        "onOpenChange"
    ]);
    if (!content) return children;
    var tooltipContent = typeof content === "string" ? // eslint-disable-next-line react/no-danger
    /*#__PURE__*/ jsx("div", {
        dangerouslySetInnerHTML: {
            __html: content
        }
    }) : content;
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
                /*#__PURE__*/ jsx(TooltipContent, _object_spread_props$t(_object_spread$G({
                    side: "top",
                    align: "center"
                }, props), {
                    children: tooltipContent
                }))
            ]
        })
    });
}

function loadCSRFFromMetaTag() {
    if (window === undefined || window.document === undefined) {
        return "";
    }
    var metaTag = window.document.querySelector('meta[name="csrf-token"]');
    var content = (metaTag === null || metaTag === void 0 ? void 0 : metaTag.getAttribute("content")) || "";
    return content;
}
var RailsAppContext = /*#__PURE__*/ createContext({
    csrfToken: ""
});
var RailsAppProvider = function(param) {
    var children = param.children, csrfToken = param.csrfToken;
    var value = useMemo(function() {
        return {
            csrfToken: csrfToken || loadCSRFFromMetaTag()
        };
    }, [
        csrfToken
    ]);
    return /*#__PURE__*/ jsx(RailsAppContext.Provider, {
        value: value,
        children: children
    });
};
var useRailsApp = function() {
    return useContext(RailsAppContext);
};

function _array_like_to_array$h(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$f(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property$F(obj, key, value) {
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
function _extends$1() {
    _extends$1 = Object.assign || function(target) {
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
    return _extends$1.apply(this, arguments);
}
function _iterable_to_array_limit$f(arr, i) {
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
function _non_iterable_rest$f() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_destructuring_empty$1(o) {
    if (o === null || o === void 0) throw new TypeError("Cannot destructure " + o);
    return o;
}
function _object_spread$F(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$F(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$s(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$s(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$s(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$n(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$n(source, excluded);
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
function _object_without_properties_loose$n(source, excluded) {
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
function _sliced_to_array$f(arr, i) {
    return _array_with_holes$f(arr) || _iterable_to_array_limit$f(arr, i) || _unsupported_iterable_to_array$h(arr, i) || _non_iterable_rest$f();
}
function _unsupported_iterable_to_array$h(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$h(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$h(o, minLen);
}
// Create separate contexts for form field state and updater
var FormFieldStateContext = /*#__PURE__*/ React.createContext(undefined);
var FormFieldUpdaterContext = /*#__PURE__*/ React.createContext(undefined);
var Form = function(_param) {
    var children = _param.children, _param_className = _param.className, className = _param_className === void 0 ? "" : _param_className, _param_action = _param.action, action = _param_action === void 0 ? undefined : _param_action, _param_method = _param.method, method = _param_method === void 0 ? undefined : _param_method, _param_onSubmit = _param.onSubmit, onSubmit = _param_onSubmit === void 0 ? function() {} : _param_onSubmit, _param_encType = _param.encType, encType = _param_encType === void 0 ? "application/x-www-form-urlencoded" : _param_encType, props = _object_without_properties$n(_param, [
        "children",
        "className",
        "action",
        "method",
        "onSubmit",
        "encType"
    ]);
    var csrfToken = useRailsApp().csrfToken;
    return(// @ts-expect-error TS(2740) FIXME: Type '{ children: Element; }' is missing the follo... Remove this comment to see the full error message
    /*#__PURE__*/ jsx(FormProvider, _object_spread_props$s(_object_spread$F({}, props), {
        children: /*#__PURE__*/ jsxs("form", {
            action: action,
            method: method,
            className: className,
            encType: encType,
            onSubmit: onSubmit,
            children: [
                children,
                csrfToken && /*#__PURE__*/ jsx("input", {
                    type: "hidden",
                    name: "authenticity_token",
                    value: csrfToken,
                    "data-testid": "csrf-token"
                })
            ]
        })
    })));
};
// Create a provider component for form field context
var FormFieldProvider = function(_param) {
    var children = _param.children, props = _object_without_properties$n(_param, [
        "children"
    ]);
    var _React_useState = _sliced_to_array$f(React.useState({
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
    var props = _extends$1({}, _object_destructuring_empty$1(_param));
    return /*#__PURE__*/ jsx(FormFieldProvider, _object_spread_props$s(_object_spread$F({}, props), {
        children: /*#__PURE__*/ jsx(Controller, _object_spread$F({}, props))
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
var useFormFieldUpdater = function() {
    var setFieldState = React.useContext(FormFieldUpdaterContext);
    if (typeof setFieldState === "undefined") {
        throw new Error("useFormFieldUpdater must be used within a FormFieldProvider");
    }
    return setFieldState;
};
// Create separate contexts for form item state and updater
var FormItemStateContext = /*#__PURE__*/ React.createContext(undefined);
var FormItemUpdaterContext = /*#__PURE__*/ React.createContext(undefined);
// Create a provider component for form item context
var FormItemProvider = function(param) {
    var children = param.children;
    var _React_useState = _sliced_to_array$f(React.useState({
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
    var className = _param.className, props = _object_without_properties$n(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(FormItemProvider, {
        children: /*#__PURE__*/ jsx("div", _object_spread$F({
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
    return _object_spread$F({
        id: id,
        name: fieldState.name,
        formItemId: "".concat(id, "-form-item"),
        formDescriptionId: "".concat(id, "-form-item-description"),
        formMessageId: "".concat(id, "-form-item-message")
    }, fieldStateFromForm);
};
var FormLabel = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, tooltip = _param.tooltip, props = _object_without_properties$n(_param, [
        "className",
        "tooltip"
    ]);
    var _useFormField = useFormField(), error = _useFormField.error, formItemId = _useFormField.formItemId;
    return /*#__PURE__*/ jsx(Tooltip, {
        content: tooltip,
        children: /*#__PURE__*/ jsxs("div", {
            className: "flex items-center gap-x-2",
            children: [
                /*#__PURE__*/ jsx(Label, _object_spread$F({
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
    var props = _extends$1({}, _object_destructuring_empty$1(_param));
    var _useFormField = useFormField(), error = _useFormField.error, formItemId = _useFormField.formItemId, formDescriptionId = _useFormField.formDescriptionId, formMessageId = _useFormField.formMessageId;
    return /*#__PURE__*/ jsx(Slot, _object_spread$F({
        ref: ref,
        id: formItemId,
        "aria-describedby": !error ? "".concat(formDescriptionId) : "".concat(formDescriptionId, " ").concat(formMessageId),
        "aria-invalid": !!error
    }, props));
});
FormControl.displayName = "FormControl";
var FormDescription = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$n(_param, [
        "className"
    ]);
    var formDescriptionId = useFormField().formDescriptionId;
    return /*#__PURE__*/ jsx("p", _object_spread$F({
        ref: ref,
        id: formDescriptionId,
        className: cn("text-muted-foreground text-sm", className)
    }, props));
});
FormDescription.displayName = "FormDescription";
var FormMessage = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, children = _param.children, props = _object_without_properties$n(_param, [
        "className",
        "children"
    ]);
    var _useFormField = useFormField(), error = _useFormField.error, formMessageId = _useFormField.formMessageId;
    var body = error ? String(error === null || error === void 0 ? void 0 : error.message) : children;
    if (!body) {
        return null;
    }
    return /*#__PURE__*/ jsx("p", _object_spread_props$s(_object_spread$F({
        ref: ref,
        id: formMessageId,
        className: cn("text-destructive text-sm font-medium", className)
    }, props), {
        children: body
    }));
});
FormMessage.displayName = "FormMessage";

function _define_property$E(obj, key, value) {
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
function _object_spread$E(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$E(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$m(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$m(source, excluded);
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
function _object_without_properties_loose$m(source, excluded) {
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
var Input = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, type = _param.type, props = _object_without_properties$m(_param, [
        "className",
        "type"
    ]);
    return /*#__PURE__*/ jsx("input", _object_spread$E({
        type: type,
        className: cn("border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-2", className),
        ref: ref
    }, props));
});
Input.displayName = "Input";

function Pagination(param) {
    var page = param.page, pageSize = param.pageSize, totalItems = param.totalItems, handleNext = param.handleNext, handlePrev = param.handlePrev;
    var totalPages = Math.ceil(totalItems / pageSize);
    var firstItem = pageSize * (page - 1) + 1;
    var lastItem = Math.min(pageSize * page, totalItems);
    return /*#__PURE__*/ jsxs("nav", {
        className: "mx-auto flex w-full items-center justify-between border-t border-gray-200 bg-white px-28 py-3 sm:px-28",
        "aria-label": "Pagination",
        children: [
            /*#__PURE__*/ jsx("div", {
                className: "hidden sm:block",
                children: /*#__PURE__*/ jsxs("p", {
                    className: "text-sm text-gray-700",
                    children: [
                        "Showing ",
                        /*#__PURE__*/ jsx("span", {
                            className: "font-medium",
                            children: firstItem
                        }),
                        " to",
                        " ",
                        /*#__PURE__*/ jsx("span", {
                            className: "font-medium",
                            children: lastItem
                        }),
                        " of",
                        " ",
                        /*#__PURE__*/ jsx("span", {
                            className: "font-medium",
                            children: totalItems
                        }),
                        " results"
                    ]
                })
            }),
            /*#__PURE__*/ jsxs("div", {
                className: "flex flex-1 items-center justify-between gap-2 sm:justify-end",
                children: [
                    /*#__PURE__*/ jsx(Button, {
                        onClick: function() {
                            return handlePrev(page);
                        },
                        disabled: Number(page) === 1,
                        children: "Previous"
                    }),
                    /*#__PURE__*/ jsx(Button, {
                        onClick: function() {
                            return handleNext(page);
                        },
                        disabled: Number(page) === totalPages,
                        children: "Next"
                    })
                ]
            })
        ]
    });
}

function _define_property$D(obj, key, value) {
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
function _object_spread$D(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$D(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$l(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$l(source, excluded);
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
function _object_without_properties_loose$l(source, excluded) {
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
var Popover = PopoverPrimitive.Root;
var PopoverTrigger = PopoverPrimitive.Trigger;
var PopoverAnchor = PopoverPrimitive.Anchor;
var PopoverContent = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, _param_align = _param.align, align = _param_align === void 0 ? "center" : _param_align, _param_sideOffset = _param.sideOffset, sideOffset = _param_sideOffset === void 0 ? 4 : _param_sideOffset, props = _object_without_properties$l(_param, [
        "className",
        "align",
        "sideOffset"
    ]);
    return /*#__PURE__*/ jsx(PopoverPrimitive.Portal, {
        children: /*#__PURE__*/ jsx(PopoverPrimitive.Content, _object_spread$D({
            ref: ref,
            align: align,
            sideOffset: sideOffset,
            className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-full rounded-md border p-4 shadow-md outline-none", className)
        }, props))
    });
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

function _define_property$C(obj, key, value) {
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
function _object_spread$C(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$C(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$r(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$r(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$r(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$k(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$k(source, excluded);
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
function _object_without_properties_loose$k(source, excluded) {
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
var RadioGroup = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$k(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(RadioGroupPrimitive.Root, _object_spread_props$r(_object_spread$C({
        className: cn("grid gap-2", className)
    }, props), {
        ref: ref
    }));
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;
var RadioGroupItem = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$k(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(RadioGroupPrimitive.Item, _object_spread_props$r(_object_spread$C({
        ref: ref,
        className: cn("border-primary text-primary ring-offset-background focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground aspect-square h-4 w-4 rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)
    }, props), {
        children: /*#__PURE__*/ jsx(RadioGroupPrimitive.Indicator, {
            className: "flex items-center justify-center",
            children: /*#__PURE__*/ jsx(Cross2Icon, {
                className: "h-3 w-3"
            })
        })
    }));
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

function _define_property$B(obj, key, value) {
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
function _object_spread$B(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$B(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$q(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$q(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$q(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$j(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$j(source, excluded);
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
function _object_without_properties_loose$j(source, excluded) {
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
var SelectRoot = SelectPrimitive.Root;
var SelectGroup = SelectPrimitive.Group;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, children = _param.children, props = _object_without_properties$j(_param, [
        "className",
        "children"
    ]);
    return /*#__PURE__*/ jsxs(SelectPrimitive.Trigger, _object_spread_props$q(_object_spread$B({
        ref: ref,
        className: cn("flex h-10 w-full items-center justify-between rounded-md border dark:border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className)
    }, props), {
        children: [
            children,
            /*#__PURE__*/ jsx(SelectPrimitive.Icon, {
                asChild: true,
                children: /*#__PURE__*/ jsx(ChevronDownIcon, {
                    className: "h-4 w-4 opacity-50"
                })
            })
        ]
    }));
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$j(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(SelectPrimitive.ScrollUpButton, _object_spread_props$q(_object_spread$B({
        ref: ref,
        className: cn("flex cursor-default items-center justify-center py-1", className)
    }, props), {
        children: /*#__PURE__*/ jsx(ChevronUpIcon, {
            className: "h-4 w-4"
        })
    }));
});
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$j(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(SelectPrimitive.ScrollDownButton, _object_spread_props$q(_object_spread$B({
        ref: ref,
        className: cn("flex cursor-default items-center justify-center py-1", className)
    }, props), {
        children: /*#__PURE__*/ jsx(ChevronDownIcon, {
            className: "h-4 w-4"
        })
    }));
});
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, children = _param.children, _param_position = _param.position, position = _param_position === void 0 ? "popper" : _param_position, props = _object_without_properties$j(_param, [
        "className",
        "children",
        "position"
    ]);
    return /*#__PURE__*/ jsx(SelectPrimitive.Portal, {
        children: /*#__PURE__*/ jsxs(SelectPrimitive.Content, _object_spread_props$q(_object_spread$B({
            ref: ref,
            className: cn("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
            position: position
        }, props), {
            children: [
                /*#__PURE__*/ jsx(SelectScrollUpButton, {}),
                /*#__PURE__*/ jsx(SelectPrimitive.Viewport, {
                    className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
                    children: children
                }),
                /*#__PURE__*/ jsx(SelectScrollDownButton, {})
            ]
        }))
    });
});
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$j(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(SelectPrimitive.Label, _object_spread$B({
        ref: ref,
        className: cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)
    }, props));
});
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, children = _param.children, props = _object_without_properties$j(_param, [
        "className",
        "children"
    ]);
    return /*#__PURE__*/ jsxs(SelectPrimitive.Item, _object_spread_props$q(_object_spread$B({
        ref: ref,
        className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)
    }, props), {
        children: [
            /*#__PURE__*/ jsx("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ jsx(SelectPrimitive.ItemIndicator, {
                    children: /*#__PURE__*/ jsx(CheckIcon, {
                        className: "h-4 w-4"
                    })
                })
            }),
            /*#__PURE__*/ jsx(SelectPrimitive.ItemText, {
                children: children
            })
        ]
    }));
});
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$j(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(SelectPrimitive.Separator, _object_spread$B({
        ref: ref,
        className: cn("-mx-1 my-1 h-px bg-muted", className)
    }, props));
});
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

var Select = /*#__PURE__*/Object.freeze({
  __proto__: null,
  SelectContent: SelectContent,
  SelectGroup: SelectGroup,
  SelectItem: SelectItem,
  SelectLabel: SelectLabel,
  SelectRoot: SelectRoot,
  SelectScrollDownButton: SelectScrollDownButton,
  SelectScrollUpButton: SelectScrollUpButton,
  SelectSeparator: SelectSeparator,
  SelectTrigger: SelectTrigger,
  SelectValue: SelectValue
});

var SelectInput = function(param) {
    var label = param.label, name = param.name, options = param.options, onValueChange = param.onValueChange;
    return /*#__PURE__*/ jsx("div", {
        className: "flex w-full flex-col items-start justify-start",
        children: /*#__PURE__*/ jsxs("label", {
            className: "block text-sm text-gray-800",
            htmlFor: name,
            children: [
                label,
                /*#__PURE__*/ jsxs(SelectRoot, {
                    onValueChange: onValueChange,
                    name: name,
                    children: [
                        /*#__PURE__*/ jsx(SelectTrigger, {
                            className: "h-[35px] inline-flex w-full items-center justify-start gap-[5px] rounded bg-white",
                            children: /*#__PURE__*/ jsx(SelectValue, {})
                        }),
                        /*#__PURE__*/ jsx(SelectContent, {
                            className: "z-[10000] w-full overflow-hidden rounded-md bg-white text-gray-900",
                            children: /*#__PURE__*/ jsxs(SelectGroup, {
                                children: [
                                    /*#__PURE__*/ jsx(SelectLabel, {
                                        className: "pl-4"
                                    }),
                                    options.map(function(option) {
                                        return /*#__PURE__*/ jsx(SelectItem, {
                                            value: option.id.toString(),
                                            className: "relative flex select-none items-center bg-white leading-none text-gray-900 data-[highlighted]:bg-gray-300 data-[highlighted]:font-semibold data-[disabled]:text-gray-400 data-[highlighted]:outline-none",
                                            children: option.value
                                        }, option.id);
                                    })
                                ]
                            })
                        })
                    ]
                })
            ]
        })
    });
};

function _define_property$A(obj, key, value) {
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
function _object_spread$A(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$A(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$i(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$i(source, excluded);
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
function _object_without_properties_loose$i(source, excluded) {
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
var Separator = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, _param_orientation = _param.orientation, orientation = _param_orientation === void 0 ? "horizontal" : _param_orientation, _param_decorative = _param.decorative, decorative = _param_decorative === void 0 ? true : _param_decorative, props = _object_without_properties$i(_param, [
        "className",
        "orientation",
        "decorative"
    ]);
    return /*#__PURE__*/ jsx(SeparatorPrimitive.Root, _object_spread$A({
        ref: ref,
        decorative: decorative,
        orientation: orientation,
        className: cn("bg-border shrink-0", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)
    }, props));
});
Separator.displayName = SeparatorPrimitive.Root.displayName;

function _define_property$z(obj, key, value) {
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
function _object_spread$z(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$z(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$p(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$p(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$p(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$h(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$h(source, excluded);
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
function _object_without_properties_loose$h(source, excluded) {
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
var Switch = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$h(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(SwitchPrimitives.Root, _object_spread_props$p(_object_spread$z({
        className: cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className)
    }, props), {
        ref: ref,
        children: /*#__PURE__*/ jsx(SwitchPrimitives.Thumb, {
            className: cn("pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0")
        })
    }));
});
Switch.displayName = SwitchPrimitives.Root.displayName;

function _define_property$y(obj, key, value) {
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
function _object_spread$y(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$y(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$g(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$g(source, excluded);
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
function _object_without_properties_loose$g(source, excluded) {
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
var Table = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$g(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("div", {
        className: "relative w-full overflow-auto",
        children: /*#__PURE__*/ jsx("table", _object_spread$y({
            ref: ref,
            className: cn("w-full caption-bottom text-sm", className)
        }, props))
    });
});
Table.displayName = "Table";
var TableHeader = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$g(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("thead", _object_spread$y({
        ref: ref,
        className: cn("[&_tr]:border-b dark:[&_tr]:border-b-2", className)
    }, props));
});
TableHeader.displayName = "TableHeader";
var TableBody = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$g(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("tbody", _object_spread$y({
        ref: ref,
        className: cn("[&_tr:last-child]:border-0", className)
    }, props));
});
TableBody.displayName = "TableBody";
var TableFooter = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$g(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("tfoot", _object_spread$y({
        ref: ref,
        className: cn("bg-primary text-primary-foreground font-medium", className)
    }, props));
});
TableFooter.displayName = "TableFooter";
var TableRow = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$g(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("tr", _object_spread$y({
        ref: ref,
        className: cn("hover:bg-muted/50 data-[state=selected]:bg-muted border-b dark:border-b-2 transition-colors", className)
    }, props));
});
TableRow.displayName = "TableRow";
var TableHead = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$g(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("th", _object_spread$y({
        ref: ref,
        className: cn("text-muted-foreground h-10 px-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)
    }, props));
});
TableHead.displayName = "TableHead";
var TableCell = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$g(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("td", _object_spread$y({
        ref: ref,
        className: cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)
    }, props));
});
TableCell.displayName = "TableCell";
var TableCaption = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$g(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("caption", _object_spread$y({
        ref: ref,
        className: cn("text-muted-foreground mt-4 text-sm", className)
    }, props));
});
TableCaption.displayName = "TableCaption";

function _define_property$x(obj, key, value) {
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
function _object_spread$x(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$x(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$f(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$f(source, excluded);
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
function _object_without_properties_loose$f(source, excluded) {
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
var TabsRoot = TabsPrimitive.Root;
var TabsList = /*#__PURE__*/ React__default.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$f(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(TabsPrimitive.List, _object_spread$x({
        ref: ref,
        className: cn("bg-muted text-muted-foreground inline-flex h-9 items-center justify-center rounded-lg p-1", className)
    }, props));
});
TabsList.displayName = TabsPrimitive.List.displayName;
var TabsTrigger = /*#__PURE__*/ React__default.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$f(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(TabsPrimitive.Trigger, _object_spread$x({
        ref: ref,
        className: cn("ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow", className)
    }, props));
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
var TabsContent = /*#__PURE__*/ React__default.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$f(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(TabsPrimitive.Content, _object_spread$x({
        ref: ref,
        className: cn("ring-offset-background focus-visible:ring-ring mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2", className)
    }, props));
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

function _define_property$w(obj, key, value) {
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
function _object_spread$w(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$w(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$e(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$e(source, excluded);
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
function _object_without_properties_loose$e(source, excluded) {
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
var Textarea = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$e(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("textarea", _object_spread$w({
        className: cn("border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-2", className),
        ref: ref
    }, props));
});
Textarea.displayName = "Textarea";

function _define_property$v(obj, key, value) {
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
function _object_spread$v(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$v(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$o(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$o(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$o(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$d(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$d(source, excluded);
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
function _object_without_properties_loose$d(source, excluded) {
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
var ToastProvider = ToastPrimitives.Provider;
var toastViewPortVariants = cva("fixed z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:flex-col md:max-w-[420px]", {
    variants: {
        position: {
            "top-right": "top-0 sm:right-0",
            "bottom-right": "top-0 sm:bottom-0 sm:right-0",
            "top-left": "top-0 sm:left-0",
            "bottom-left": "top-0 sm:bottom-0 sm:left-0"
        }
    },
    defaultVariants: {
        position: "bottom-right"
    }
});
var ToastViewport = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, position = _param.position, props = _object_without_properties$d(_param, [
        "className",
        "position"
    ]);
    return /*#__PURE__*/ jsx(ToastPrimitives.Viewport, _object_spread$v({
        ref: ref,
        className: cn(toastViewPortVariants({
            position: position
        }), className)
    }, props));
});
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
var toastVariants = cva("group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full", {
    variants: {
        variant: {
            default: "border bg-background text-foreground",
            destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
var Toast = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, variant = _param.variant, props = _object_without_properties$d(_param, [
        "className",
        "variant"
    ]);
    return /*#__PURE__*/ jsx(ToastPrimitives.Root, _object_spread$v({
        ref: ref,
        className: cn(toastVariants({
            variant: variant
        }), className)
    }, props));
});
Toast.displayName = ToastPrimitives.Root.displayName;
var ToastAction = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$d(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(ToastPrimitives.Action, _object_spread$v({
        ref: ref,
        className: cn("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive", className)
    }, props));
});
ToastAction.displayName = ToastPrimitives.Action.displayName;
var ToastClose = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$d(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(ToastPrimitives.Close, _object_spread_props$o(_object_spread$v({
        ref: ref,
        className: cn("absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className),
        "toast-close": ""
    }, props), {
        children: /*#__PURE__*/ jsx(Cross2Icon, {
            className: "h-4 w-4"
        })
    }));
});
ToastClose.displayName = ToastPrimitives.Close.displayName;
var ToastTitle = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$d(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(ToastPrimitives.Title, _object_spread$v({
        ref: ref,
        className: cn("text-sm font-semibold [&+div]:text-xs", className)
    }, props));
});
ToastTitle.displayName = ToastPrimitives.Title.displayName;
var ToastDescription = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$d(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx(ToastPrimitives.Description, _object_spread$v({
        ref: ref,
        className: cn("text-sm opacity-90", className)
    }, props));
});
ToastDescription.displayName = ToastPrimitives.Description.displayName;

/* eslint-disable default-case */ // Inspired by react-hot-toast library
function _array_like_to_array$g(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$e(arr) {
    if (Array.isArray(arr)) return arr;
}
function _array_without_holes$3(arr) {
    if (Array.isArray(arr)) return _array_like_to_array$g(arr);
}
function _define_property$u(obj, key, value) {
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
function _iterable_to_array$3(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _iterable_to_array_limit$e(arr, i) {
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
function _non_iterable_rest$e() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _non_iterable_spread$3() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_destructuring_empty(o) {
    if (o === null || o === void 0) throw new TypeError("Cannot destructure " + o);
    return o;
}
function _object_spread$u(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$u(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$n(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$n(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$n(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _sliced_to_array$e(arr, i) {
    return _array_with_holes$e(arr) || _iterable_to_array_limit$e(arr, i) || _unsupported_iterable_to_array$g(arr, i) || _non_iterable_rest$e();
}
function _to_consumable_array$3(arr) {
    return _array_without_holes$3(arr) || _iterable_to_array$3(arr) || _unsupported_iterable_to_array$g(arr) || _non_iterable_spread$3();
}
function _unsupported_iterable_to_array$g(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$g(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$g(o, minLen);
}
var TOAST_LIMIT = 1;
var TOAST_REMOVE_DELAY = 1000000;
var count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
var toastTimeouts = new Map();
var addToRemoveQueue = function(toastId) {
    if (toastTimeouts.has(toastId)) {
        return;
    }
    var timeout = setTimeout(function() {
        toastTimeouts.delete(toastId);
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
// eslint-disable-next-line consistent-return
var reducer = function(state, action) {
    switch(action.type){
        case "ADD_TOAST":
            return _object_spread_props$n(_object_spread$u({}, state), {
                toasts: [
                    action.toast
                ].concat(_to_consumable_array$3(state.toasts)).slice(0, TOAST_LIMIT)
            });
        case "UPDATE_TOAST":
            return _object_spread_props$n(_object_spread$u({}, state), {
                toasts: state.toasts.map(function(t) {
                    return t.id === action.toast.id ? _object_spread$u({}, t, action.toast) : t;
                })
            });
        case "DISMISS_TOAST":
            {
                var toastId = action.toastId;
                // ! Side effects ! - This could be extracted into a dismissToast() action,
                // but I'll keep it here for simplicity
                if (toastId) {
                    addToRemoveQueue(toastId);
                } else {
                    // eslint-disable-next-line no-shadow
                    state.toasts.forEach(function(toast) {
                        addToRemoveQueue(toast.id);
                    });
                }
                return _object_spread_props$n(_object_spread$u({}, state), {
                    toasts: state.toasts.map(function(t) {
                        return t.id === toastId || toastId === undefined ? _object_spread_props$n(_object_spread$u({}, t), {
                            open: false
                        }) : t;
                    })
                });
            }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return _object_spread_props$n(_object_spread$u({}, state), {
                    toasts: []
                });
            }
            return _object_spread_props$n(_object_spread$u({}, state), {
                toasts: state.toasts.filter(function(t) {
                    return t.id !== action.toastId;
                })
            });
    }
};
var listeners = [];
var memoryState = {
    toasts: []
};
function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach(function(listener) {
        listener(memoryState);
    });
}
function toast(_param) {
    var props = _extends({}, _object_destructuring_empty(_param));
    var id = genId();
    // eslint-disable-next-line no-shadow
    var update = function(props) {
        return dispatch({
            type: "UPDATE_TOAST",
            toast: _object_spread_props$n(_object_spread$u({}, props), {
                id: id
            })
        });
    };
    var dismiss = function() {
        return dispatch({
            type: "DISMISS_TOAST",
            toastId: id
        });
    };
    dispatch({
        type: "ADD_TOAST",
        toast: _object_spread_props$n(_object_spread$u({}, props), {
            id: id,
            open: true,
            onOpenChange: function(open) {
                if (!open) dismiss();
            }
        })
    });
    return {
        id: id,
        dismiss: dismiss,
        update: update
    };
}
function useToast() {
    var _React_useState = _sliced_to_array$e(React.useState(memoryState), 2), state = _React_useState[0], setState = _React_useState[1];
    React.useEffect(function() {
        listeners.push(setState);
        return function() {
            var index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, [
        state
    ]);
    return _object_spread_props$n(_object_spread$u({}, state), {
        toast: toast,
        dismiss: function(toastId) {
            return dispatch({
                type: "DISMISS_TOAST",
                toastId: toastId
            });
        }
    });
}

function _define_property$t(obj, key, value) {
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
function _object_spread$t(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$t(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$m(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$m(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$m(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$c(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$c(source, excluded);
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
function _object_without_properties_loose$c(source, excluded) {
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
function Toaster(param) {
    var _param_position = param.position, position = _param_position === void 0 ? "top-right" : _param_position;
    var toasts = useToast().toasts;
    return /*#__PURE__*/ jsxs(ToastProvider, {
        children: [
            toasts.map(function(_param) {
                var id = _param.id, title = _param.title, description = _param.description, action = _param.action, props = _object_without_properties$c(_param, [
                    "id",
                    "title",
                    "description",
                    "action"
                ]);
                return /*#__PURE__*/ jsxs(Toast, _object_spread_props$m(_object_spread$t({}, props), {
                    children: [
                        /*#__PURE__*/ jsxs("div", {
                            className: "grid gap-1",
                            children: [
                                title && /*#__PURE__*/ jsx(ToastTitle, {
                                    children: title
                                }),
                                description && /*#__PURE__*/ jsx(ToastDescription, {
                                    children: description
                                })
                            ]
                        }),
                        action,
                        /*#__PURE__*/ jsx(ToastClose, {})
                    ]
                }), id);
            }),
            /*#__PURE__*/ jsx(ToastViewport, {
                position: position
            })
        ]
    });
}

function _define_property$s(obj, key, value) {
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
function _object_spread$s(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$s(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$l(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$l(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$l(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$b(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$b(source, excluded);
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
function _object_without_properties_loose$b(source, excluded) {
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
var Progress = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, value = _param.value, props = _object_without_properties$b(_param, [
        "className",
        "value"
    ]);
    return /*#__PURE__*/ jsx(ProgressPrimitive.Root, _object_spread_props$l(_object_spread$s({
        ref: ref,
        className: cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)
    }, props), {
        children: /*#__PURE__*/ jsx(ProgressPrimitive.Indicator, {
            className: "size-full flex-1 bg-primary transition-all",
            style: {
                transform: "translateX(-".concat(100 - (value || 0), "%)")
            }
        })
    }));
});
Progress.displayName = ProgressPrimitive.Root.displayName;

var SpinnerSize;
// eslint-disable-next-line no-shadow
(function(SpinnerSize) {
    SpinnerSize[SpinnerSize["sm"] = 6] = "sm";
    SpinnerSize[SpinnerSize["md"] = 12] = "md";
    SpinnerSize[SpinnerSize["lg"] = 20] = "lg";
})(SpinnerSize || (SpinnerSize = {}));
function Spinner(param) {
    var _param_size = param.size, size = _param_size === void 0 ? "md" : _param_size;
    var SpinnerSizeNumber = SpinnerSize[size];
    return /*#__PURE__*/ jsx("div", {
        className: cn("flex w-full flex-col items-center rounded-3xl", {
            "px-12 py-16 md:py-20": SpinnerSizeNumber === 12
        }),
        children: /*#__PURE__*/ jsx("div", {
            className: cn("border-6 mx-2 animate-spin rounded-full border-2 border-solid border-l-primary border-foreground", {
                "h-4 w-4": SpinnerSizeNumber === 6,
                "h-12 w-12": SpinnerSizeNumber === 12,
                "h-20 w-20": SpinnerSizeNumber === 20
            })
        })
    });
}

function _define_property$r(obj, key, value) {
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
function _object_spread$r(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$r(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$k(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$k(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$k(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$a(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$a(source, excluded);
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
function _object_without_properties_loose$a(source, excluded) {
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
var KpiCard = function(_param) {
    var children = _param.children, className = _param.className, props = _object_without_properties$a(_param, [
        "children",
        "className"
    ]);
    return /*#__PURE__*/ jsx("div", _object_spread_props$k(_object_spread$r({}, props), {
        className: cn("mb-2 flex w-full flex-col rounded-md border dark:border-2 bg-background p-4 shadow-sm hover:shadow-lg", className),
        children: children
    }));
};
var Header = function(param) {
    var children = param.children, className = param.className;
    return /*#__PURE__*/ jsx("div", {
        className: cn("mb-1 flex justify-between items-center", className),
        children: children
    });
};
var Title = function(param) {
    var children = param.children, className = param.className;
    return /*#__PURE__*/ jsx("span", {
        className: cn("text-base text-foreground", className),
        children: children
    });
};
var Content = function(param) {
    var children = param.children, className = param.className;
    return /*#__PURE__*/ jsx("div", {
        className: cn("mb-1 flex flex-col", className),
        children: /*#__PURE__*/ jsx("span", {
            className: cn("text-xl font-bold text-foreground", className),
            children: children
        })
    });
};
var FooterNote = function(param) {
    var children = param.children, className = param.className;
    return /*#__PURE__*/ jsx("span", {
        className: cn("text-xs text-muted-foreground", className),
        children: children
    });
};
KpiCard.Header = Header;
KpiCard.Title = Title;
KpiCard.Content = Content;
KpiCard.FooterNote = FooterNote;

function _define_property$q(obj, key, value) {
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
function _object_spread$q(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$q(target, key, source[key]);
        });
    }
    return target;
}
function _object_without_properties$9(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$9(source, excluded);
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
function _object_without_properties_loose$9(source, excluded) {
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
function Skeleton(_param) {
    var className = _param.className, props = _object_without_properties$9(_param, [
        "className"
    ]);
    return /*#__PURE__*/ jsx("div", _object_spread$q({
        className: cn("animate-pulse rounded-md bg-muted", className)
    }, props));
}

function _array_like_to_array$f(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$d(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property$p(obj, key, value) {
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
function _iterable_to_array_limit$d(arr, i) {
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
function _non_iterable_rest$d() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread$p(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$p(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$j(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$j(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$j(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$8(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$8(source, excluded);
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
function _object_without_properties_loose$8(source, excluded) {
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
function _sliced_to_array$d(arr, i) {
    return _array_with_holes$d(arr) || _iterable_to_array_limit$d(arr, i) || _unsupported_iterable_to_array$f(arr, i) || _non_iterable_rest$d();
}
function _unsupported_iterable_to_array$f(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$f(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$f(o, minLen);
}
var CarouselContext = /*#__PURE__*/ React.createContext(null);
function useCarousel() {
    var context = React.useContext(CarouselContext);
    if (!context) {
        throw new Error("useCarousel must be used within a <Carousel />");
    }
    return context;
}
var Carousel = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var _param_orientation = _param.orientation, orientation = _param_orientation === void 0 ? "horizontal" : _param_orientation, opts = _param.opts, setApi = _param.setApi, plugins = _param.plugins, className = _param.className, children = _param.children, props = _object_without_properties$8(_param, [
        "orientation",
        "opts",
        "setApi",
        "plugins",
        "className",
        "children"
    ]);
    var _useEmblaCarousel = _sliced_to_array$d(useEmblaCarousel(_object_spread_props$j(_object_spread$p({}, opts), {
        axis: orientation === "horizontal" ? "x" : "y"
    }), plugins), 2), carouselRef = _useEmblaCarousel[0], api = _useEmblaCarousel[1];
    var _React_useState = _sliced_to_array$d(React.useState(false), 2), canScrollPrev = _React_useState[0], setCanScrollPrev = _React_useState[1];
    var _React_useState1 = _sliced_to_array$d(React.useState(false), 2), canScrollNext = _React_useState1[0], setCanScrollNext = _React_useState1[1];
    // eslint-disable-next-line no-shadow
    var onSelect = React.useCallback(function(api) {
        if (!api) {
            return;
        }
        setCanScrollPrev(api.canScrollPrev());
        setCanScrollNext(api.canScrollNext());
    }, []);
    var scrollPrev = React.useCallback(function() {
        api === null || api === void 0 ? void 0 : api.scrollPrev();
    }, [
        api
    ]);
    var scrollNext = React.useCallback(function() {
        api === null || api === void 0 ? void 0 : api.scrollNext();
    }, [
        api
    ]);
    var handleKeyDown = React.useCallback(function(event) {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollPrev();
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollNext();
        }
    }, [
        scrollPrev,
        scrollNext
    ]);
    React.useEffect(function() {
        if (!api || !setApi) {
            return;
        }
        setApi(api);
    }, [
        api,
        setApi
    ]);
    React.useEffect(function() {
        if (!api) {
            return;
        }
        onSelect(api);
        api.on("reInit", onSelect);
        api.on("select", onSelect);
        // eslint-disable-next-line consistent-return
        return function() {
            api === null || api === void 0 ? void 0 : api.off("select", onSelect);
        };
    }, [
        api,
        onSelect
    ]);
    return /*#__PURE__*/ jsx(CarouselContext.Provider, {
        // eslint-disable-next-line react/jsx-no-constructed-context-values
        value: {
            carouselRef: carouselRef,
            api: api,
            opts: opts,
            orientation: orientation || ((opts === null || opts === void 0 ? void 0 : opts.axis) === "y" ? "vertical" : "horizontal"),
            scrollPrev: scrollPrev,
            scrollNext: scrollNext,
            canScrollPrev: canScrollPrev,
            canScrollNext: canScrollNext
        },
        children: /*#__PURE__*/ jsx("div", _object_spread_props$j(_object_spread$p({
            ref: ref,
            onKeyDownCapture: handleKeyDown,
            className: cn("relative", className),
            role: "region",
            "aria-roledescription": "carousel"
        }, props), {
            children: children
        }))
    });
});
Carousel.displayName = "Carousel";
var CarouselContent = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$8(_param, [
        "className"
    ]);
    var _useCarousel = useCarousel(), carouselRef = _useCarousel.carouselRef, orientation = _useCarousel.orientation;
    return /*#__PURE__*/ jsx("div", {
        ref: carouselRef,
        className: "overflow-hidden",
        children: /*#__PURE__*/ jsx("div", _object_spread$p({
            ref: ref,
            className: cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)
        }, props))
    });
});
CarouselContent.displayName = "CarouselContent";
var CarouselItem = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, props = _object_without_properties$8(_param, [
        "className"
    ]);
    var orientation = useCarousel().orientation;
    return /*#__PURE__*/ jsx("div", _object_spread$p({
        ref: ref,
        role: "group",
        "aria-roledescription": "slide",
        className: cn("min-w-0 shrink-0 grow-0 basis-full", orientation === "horizontal" ? "pl-4" : "pt-4", className)
    }, props));
});
CarouselItem.displayName = "CarouselItem";
var CarouselPrevious = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, _param_variant = _param.variant, variant = _param_variant === void 0 ? "outline" : _param_variant, _param_size = _param.size, size = _param_size === void 0 ? "icon" : _param_size, props = _object_without_properties$8(_param, [
        "className",
        "variant",
        "size"
    ]);
    var _useCarousel = useCarousel(), orientation = _useCarousel.orientation, scrollPrev = _useCarousel.scrollPrev, canScrollPrev = _useCarousel.canScrollPrev;
    return /*#__PURE__*/ jsxs(Button, _object_spread_props$j(_object_spread$p({
        ref: ref,
        variant: variant,
        size: size,
        className: cn("absolute  h-8 w-8 rounded-full", orientation === "horizontal" ? "-left-12 top-1/2 -translate-y-1/2" : "-top-12 left-1/2 -translate-x-1/2 rotate-90", className),
        disabled: !canScrollPrev,
        onClick: scrollPrev
    }, props), {
        children: [
            /*#__PURE__*/ jsx(ArrowLeftIcon, {
                className: "h-4 w-4"
            }),
            /*#__PURE__*/ jsx("span", {
                className: "sr-only",
                children: "Previous slide"
            })
        ]
    }));
});
CarouselPrevious.displayName = "CarouselPrevious";
var CarouselNext = /*#__PURE__*/ React.forwardRef(function(_param, ref) {
    var className = _param.className, _param_variant = _param.variant, variant = _param_variant === void 0 ? "outline" : _param_variant, _param_size = _param.size, size = _param_size === void 0 ? "icon" : _param_size, props = _object_without_properties$8(_param, [
        "className",
        "variant",
        "size"
    ]);
    var _useCarousel = useCarousel(), orientation = _useCarousel.orientation, scrollNext = _useCarousel.scrollNext, canScrollNext = _useCarousel.canScrollNext;
    return /*#__PURE__*/ jsxs(Button, _object_spread_props$j(_object_spread$p({
        ref: ref,
        variant: variant,
        size: size,
        className: cn("absolute h-8 w-8 rounded-full", orientation === "horizontal" ? "-right-12 top-1/2 -translate-y-1/2" : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90", className),
        disabled: !canScrollNext,
        onClick: scrollNext
    }, props), {
        children: [
            /*#__PURE__*/ jsx(ArrowRightIcon, {
                className: "h-4 w-4"
            }),
            /*#__PURE__*/ jsx("span", {
                className: "sr-only",
                children: "Next slide"
            })
        ]
    }));
});
CarouselNext.displayName = "CarouselNext";

var Collapsible = CollapsiblePrimitive.Root;
var CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;
var CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

function _array_like_to_array$e(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$c(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property$o(obj, key, value) {
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
function _instanceof$1(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
function _iterable_to_array_limit$c(arr, i) {
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
function _non_iterable_rest$c() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread$o(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$o(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$i(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$i(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$i(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$7(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$7(source, excluded);
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
function _object_without_properties_loose$7(source, excluded) {
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
function _sliced_to_array$c(arr, i) {
    return _array_with_holes$c(arr) || _iterable_to_array_limit$c(arr, i) || _unsupported_iterable_to_array$e(arr, i) || _non_iterable_rest$c();
}
function _unsupported_iterable_to_array$e(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$e(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$e(o, minLen);
}
function useGlobalShortcut(setOpen, enableGlobalShortcut) {
    React.useEffect(function() {
        var handleKeyDown = function handleKeyDown(e) {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(function(prevOpen) {
                    return !prevOpen;
                });
            }
        };
        if (!enableGlobalShortcut) {
            return;
        }
        document.addEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line consistent-return
        return function() {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        setOpen
    ]);
}
var SharedCommandContent = function(param) {
    var searchResults = param.searchResults, isLoading = param.isLoading, icons = param.icons, commands = param.commands, runCommand = param.runCommand;
    var t = useTranslation().t;
    var commandList = commands && (commands === null || commands === void 0 ? void 0 : commands.length) > 0 && /*#__PURE__*/ jsx(CommandGroup, {
        heading: "Links",
        children: commands.map(function(navItem) {
            return /*#__PURE__*/ jsxs(CommandItem, {
                value: navItem.title,
                onMouseDown: function(e) {
                    return e.preventDefault();
                },
                onSelect: function() {
                    runCommand(navItem.href);
                },
                children: [
                    /*#__PURE__*/ jsx(CircleIcon, {
                        className: "mr-2 h-2 w-2"
                    }),
                    navItem.title
                ]
            }, navItem.href);
        })
    });
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            isLoading || searchResults !== undefined ? /*#__PURE__*/ jsxs(Fragment, {
                children: [
                    /*#__PURE__*/ jsx(CommandGroup, {
                        heading: t("Search results"),
                        children: /*#__PURE__*/ jsx("div", {
                            className: "grid grid-cols-[auto_1fr]",
                            children: searchResults === null || searchResults === void 0 ? void 0 : searchResults.map(function(result) {
                                var Icon = icons && result.type ? icons[result.type] : FileIcon;
                                return /*#__PURE__*/ jsxs(CommandItem, {
                                    value: result.title,
                                    onSelect: function() {
                                        runCommand(result.href);
                                    },
                                    className: "grid grid-cols-subgrid col-span-2 gap-2",
                                    children: [
                                        /*#__PURE__*/ jsxs("div", {
                                            children: [
                                                /*#__PURE__*/ jsx(Icon, {
                                                    className: "inline-flex h-4 w-4 mr-1 stroke-1"
                                                }),
                                                /*#__PURE__*/ jsx("b", {
                                                    children: result.result_type
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ jsx("div", {
                                            children: result.title
                                        })
                                    ]
                                }, result.href);
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(CommandSeparator, {})
                ]
            }) : null,
            /*#__PURE__*/ jsx(CommandEmpty, {
                children: isLoading ? /*#__PURE__*/ jsxs("div", {
                    className: "w-40 flex justify-center gap-x-2",
                    children: [
                        /*#__PURE__*/ jsx(Spinner, {
                            size: "sm"
                        }),
                        " ",
                        /*#__PURE__*/ jsx(Trans, {
                            children: "Loading"
                        })
                    ]
                }) : /*#__PURE__*/ jsx(Trans, {
                    children: "No results found"
                })
            }),
            commandList
        ]
    });
};
var useDebounce = function(value, delay) {
    var _useState = _sliced_to_array$c(useState(value), 2), debouncedValue = _useState[0], setDebouncedValue = _useState[1];
    useEffect(function() {
        var handler = setTimeout(function() {
            setDebouncedValue(value);
        }, delay);
        return function() {
            clearTimeout(handler);
        };
    }, [
        value,
        delay
    ]);
    return debouncedValue;
};
var CommandMenu = function(_param) {
    var commands = _param.commands, fetcher = _param.fetcher, icons = _param.icons, placeholder = _param.placeholder, _param_usePopover = _param.usePopover, usePopover = _param_usePopover === void 0 ? false : _param_usePopover, _param_enableGlobalShortcut = _param.enableGlobalShortcut, enableGlobalShortcut = _param_enableGlobalShortcut === void 0 ? true : _param_enableGlobalShortcut, _param_openInNewTab = _param.openInNewTab, openInNewTab = _param_openInNewTab === void 0 ? false : _param_openInNewTab, props = _object_without_properties$7(_param, [
        "commands",
        "fetcher",
        "icons",
        "placeholder",
        "usePopover",
        "enableGlobalShortcut",
        "openInNewTab"
    ]);
    var navigate = useNavigate();
    var t = useTranslation().t;
    var _React_useState = _sliced_to_array$c(React.useState(false), 2), open = _React_useState[0], setOpen = _React_useState[1];
    var _React_useState1 = _sliced_to_array$c(React.useState(""), 2), search = _React_useState1[0], setSearch = _React_useState1[1];
    var debouncedSearch = useDebounce(search, 300);
    var _useSWR = useSWR(function() {
        return debouncedSearch || null;
    }, fetcher || function() {
        return Promise.resolve([]);
    }), searchResults = _useSWR.data, isLoading = _useSWR.isLoading;
    useGlobalShortcut(setOpen, enableGlobalShortcut);
    var runCommand = function(href) {
        setOpen(false);
        if (!openInNewTab) navigate(href);
        var handle = window.open(href, "_blank", "noopener noreferrer");
        handle === null || handle === void 0 ? void 0 : handle.blur();
        window.focus();
    };
    return usePopover ? /*#__PURE__*/ jsx(Popover, _object_spread_props$i(_object_spread$o({}, props), {
        open: open,
        onOpenChange: setOpen,
        children: /*#__PURE__*/ jsxs(Command, {
            className: "[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5",
            children: [
                /*#__PURE__*/ jsx(PopoverAnchor, {
                    asChild: true,
                    children: /*#__PURE__*/ jsx(CommandInput, {
                        placeholder: placeholder || t("Type a command or search"),
                        value: search,
                        onValueChange: setSearch,
                        className: cn("text-muted-foreground justify-center text-sm inline-flex", props.className),
                        onKeyDown: function(e) {
                            return setOpen(e.key !== "Escape");
                        },
                        onMouseDown: function() {
                            return setOpen(function(isOpen) {
                                return !!search && !isOpen;
                            });
                        },
                        loading: isLoading
                    })
                }),
                /*#__PURE__*/ jsx(PopoverContent, {
                    side: "bottom",
                    asChild: true,
                    onOpenAutoFocus: function(e) {
                        return e.preventDefault();
                    },
                    onInteractOutside: function(e) {
                        if (_instanceof$1(e.target, Element) && e.target.hasAttribute("cmdk-input")) {
                            e.preventDefault();
                        }
                    },
                    children: /*#__PURE__*/ jsx(CommandList, {
                        children: /*#__PURE__*/ jsx(SharedCommandContent, {
                            searchResults: searchResults,
                            isLoading: isLoading,
                            icons: icons,
                            commands: commands,
                            runCommand: runCommand
                        })
                    })
                })
            ]
        })
    })) : /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Button, {
                variant: "outline",
                className: "text-muted-foreground relative w-full justify-start text-sm sm:pr-12 md:w-40 lg:w-64",
                onClick: function() {
                    return setOpen(true);
                },
                children: /*#__PURE__*/ jsx("span", {
                    className: "inline-flex",
                    children: t("Global search")
                })
            }),
            /*#__PURE__*/ jsxs(CommandDialog, {
                open: open,
                onOpenChange: setOpen,
                loading: isLoading,
                children: [
                    /*#__PURE__*/ jsx(CommandInput, {
                        placeholder: placeholder || t("Type a command or search"),
                        value: search,
                        onValueChange: setSearch,
                        className: cn(props.className)
                    }),
                    /*#__PURE__*/ jsx(CommandList, {
                        children: /*#__PURE__*/ jsx(SharedCommandContent, {
                            searchResults: searchResults,
                            isLoading: isLoading,
                            icons: icons,
                            commands: commands,
                            runCommand: runCommand
                        })
                    })
                ]
            })
        ]
    });
};

/* eslint-disable consistent-return */ function _array_like_to_array$d(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$b(arr) {
    if (Array.isArray(arr)) return arr;
}
function _iterable_to_array_limit$b(arr, i) {
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
function _non_iterable_rest$b() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _sliced_to_array$b(arr, i) {
    return _array_with_holes$b(arr) || _iterable_to_array_limit$b(arr, i) || _unsupported_iterable_to_array$d(arr, i) || _non_iterable_rest$b();
}
function _unsupported_iterable_to_array$d(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$d(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$d(o, minLen);
}
function ClickToCopy(param) {
    var text = param.text, className = param.className, children = param.children;
    var _React_useState = _sliced_to_array$b(React__default.useState(false), 2), copied = _React_useState[0], setCopied = _React_useState[1];
    var toast = useToast().toast;
    var t = useTranslation().t;
    useLayoutEffect(function() {
        if (copied) {
            var timeout = setTimeout(function() {
                setCopied(false);
            }, 2000);
            toast({
                title: t("Copied to clipboard"),
                variant: "default"
            });
            return function() {
                return clearTimeout(timeout);
            };
        }
    }, [
        copied
    ]);
    return /*#__PURE__*/ jsx("div", {
        children: /*#__PURE__*/ jsx(CopyToClipboard, {
            text: text,
            onCopy: function() {
                return setCopied(true);
            },
            className: cn("flex flex-row items-center", className),
            children: /*#__PURE__*/ jsxs(Fragment, {
                children: [
                    /*#__PURE__*/ jsx("span", {
                        className: "mr-1",
                        children: children
                    }),
                    /*#__PURE__*/ jsx(ClipboardCopyIcon, {
                        width: 18,
                        height: 18,
                        className: "text-foreground"
                    })
                ]
            })
        })
    });
}
function CopyToClipboard(param) {
    var text = param.text, className = param.className, onCopy = param.onCopy, children = param.children;
    var _React_useState = _sliced_to_array$b(React__default.useState(false), 2), copied = _React_useState[0], setCopied = _React_useState[1];
    useLayoutEffect(function() {
        if (copied) {
            var timeout = setTimeout(function() {
                setCopied(false);
            }, 1000);
            return function() {
                return clearTimeout(timeout);
            };
        }
    }, [
        copied
    ]);
    var handleCopy = useCallback(function() {
        copy(text);
        onCopy === null || onCopy === void 0 ? void 0 : onCopy();
    }, [
        text,
        onCopy
    ]);
    return(// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    /*#__PURE__*/ jsx("div", {
        className: cn("cursor-pointer", className),
        onClick: handleCopy,
        children: children
    }));
}

function _define_property$n(obj, key, value) {
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
function _object_spread$n(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$n(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$h(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$h(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$h(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$6(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$6(source, excluded);
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
function _object_without_properties_loose$6(source, excluded) {
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
var SubItem$1 = function(_param) {
    var tags = _param.tags, onSelect = _param.onSelect, props = _object_without_properties$6(_param, [
        "tags",
        "onSelect"
    ]);
    var search = useCommandState(function(state) {
        return state.search;
    });
    if (!search) return null;
    var tagExists = tags.some(function(tag) {
        return tag.value === search;
    });
    if (tagExists) return null;
    return /*#__PURE__*/ jsx(CommandItem, _object_spread_props$h(_object_spread$n({
        onSelect: function() {
            return onSelect({
                tag: search
            });
        }
    }, props), {
        children: search
    }));
};
var TaggablePopover = function(param) {
    var tags = param.tags, selectedTags = param.selectedTags, onSelect = param.onSelect;
    return /*#__PURE__*/ jsxs(Popover, {
        children: [
            /*#__PURE__*/ jsx(PopoverTrigger, {
                asChild: true,
                children: /*#__PURE__*/ jsxs(Button, {
                    variant: "outline",
                    size: "sm",
                    className: "my-4 h-8 border-dashed dark:border-2",
                    children: [
                        /*#__PURE__*/ jsx(PlusCircledIcon, {
                            className: "mr-2 h-4 w-4"
                        }),
                        "Tags",
                        (selectedTags === null || selectedTags === void 0 ? void 0 : selectedTags.length) > 0 && /*#__PURE__*/ jsxs(Fragment, {
                            children: [
                                /*#__PURE__*/ jsx(Separator, {
                                    orientation: "vertical",
                                    className: "mx-2 h-4"
                                }),
                                /*#__PURE__*/ jsx(Badge, {
                                    color: "secondary",
                                    className: "rounded-sm px-1 font-normal lg:hidden",
                                    children: selectedTags.length
                                }),
                                /*#__PURE__*/ jsx("div", {
                                    className: "hidden space-x-1 lg:flex",
                                    children: selectedTags.length > 2 ? /*#__PURE__*/ jsxs(Badge, {
                                        color: "secondary",
                                        className: "rounded-sm px-1 font-normal",
                                        children: [
                                            selectedTags.length,
                                            " tags"
                                        ]
                                    }) : tags.filter(function(option) {
                                        return selectedTags.includes(option.value);
                                    }).map(function(option) {
                                        return /*#__PURE__*/ jsx(Badge, {
                                            color: "secondary",
                                            className: "rounded-sm px-1 font-normal",
                                            children: option.label
                                        }, option.value);
                                    })
                                })
                            ]
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsx(PopoverContent, {
                className: "w-[200px] p-0",
                align: "start",
                children: /*#__PURE__*/ jsxs(Command, {
                    children: [
                        /*#__PURE__*/ jsx(CommandInput, {
                            placeholder: "tags"
                        }),
                        /*#__PURE__*/ jsxs(CommandList, {
                            children: [
                                tags.sort(function(a, b) {
                                    return selectedTags.includes(b.value) - selectedTags.includes(a.value) || a.label.localeCompare(b.label);
                                }).map(function(option) {
                                    var isSelected = selectedTags.includes(option.value);
                                    return /*#__PURE__*/ jsxs(CommandItem, {
                                        onSelect: function(tag) {
                                            return onSelect({
                                                tag: tag
                                            });
                                        },
                                        children: [
                                            /*#__PURE__*/ jsx("div", {
                                                className: cn("border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"),
                                                children: /*#__PURE__*/ jsx(CheckIcon, {
                                                    className: cn("h-4 w-4")
                                                })
                                            }),
                                            /*#__PURE__*/ jsx("span", {
                                                children: option.label
                                            })
                                        ]
                                    }, option.value);
                                }),
                                /*#__PURE__*/ jsx(SubItem$1, {
                                    tags: tags,
                                    onSelect: onSelect
                                })
                            ]
                        })
                    ]
                })
            })
        ]
    });
};

function _array_like_to_array$c(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$a(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property$m(obj, key, value) {
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
function _iterable_to_array_limit$a(arr, i) {
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
function _non_iterable_rest$a() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread$m(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$m(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$g(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$g(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$g(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$5(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$5(source, excluded);
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
function _object_without_properties_loose$5(source, excluded) {
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
function _sliced_to_array$a(arr, i) {
    return _array_with_holes$a(arr) || _iterable_to_array_limit$a(arr, i) || _unsupported_iterable_to_array$c(arr, i) || _non_iterable_rest$a();
}
function _unsupported_iterable_to_array$c(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$c(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$c(o, minLen);
}
var initialState$1 = {
    theme: "system",
    setTheme: function() {
        return null;
    }
};
var ThemeProviderContext = /*#__PURE__*/ createContext(initialState$1);
function ThemeProvider(_param) {
    var children = _param.children, _param_defaultTheme = _param.defaultTheme, defaultTheme = _param_defaultTheme === void 0 ? "system" : _param_defaultTheme, _param_storageKey = _param.storageKey, storageKey = _param_storageKey === void 0 ? "bleu-ui-theme" : _param_storageKey, props = _object_without_properties$5(_param, [
        "children",
        "defaultTheme",
        "storageKey"
    ]);
    var _useState = _sliced_to_array$a(useState(function() {
        return localStorage.getItem(storageKey) || defaultTheme;
    }), 2), theme = _useState[0], setTheme = _useState[1];
    useEffect(function() {
        var root = window.document.documentElement;
        root.classList.remove("light", "dark");
        if (theme === "system") {
            var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
            return;
        }
        root.classList.add(theme);
    }, [
        theme
    ]);
    var value = useMemo(function() {
        return {
            theme: theme,
            setTheme: function(newTheme) {
                localStorage.setItem(storageKey, newTheme);
                setTheme(newTheme);
            }
        };
    }, [
        theme,
        storageKey
    ]);
    return /*#__PURE__*/ jsx(ThemeProviderContext.Provider, _object_spread_props$g(_object_spread$m({}, props), {
        value: value,
        children: children
    }));
}
var useTheme = function() {
    var context = useContext(ThemeProviderContext);
    if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};

function ModeToggle() {
    var _useTheme = useTheme(), setTheme = _useTheme.setTheme, theme = _useTheme.theme;
    return /*#__PURE__*/ jsxs(DropdownMenu, {
        children: [
            /*#__PURE__*/ jsx(DropdownMenuTrigger, {
                asChild: true,
                children: /*#__PURE__*/ jsxs(Button, {
                    variant: "outline",
                    size: "icon",
                    children: [
                        theme === "dark" ? /*#__PURE__*/ jsx(MoonIcon, {
                            className: "h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all"
                        }) : /*#__PURE__*/ jsx(SunIcon, {
                            className: "absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all"
                        }),
                        /*#__PURE__*/ jsx("span", {
                            className: "sr-only",
                            children: /*#__PURE__*/ jsx(Trans, {
                                children: "Toggle theme"
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxs(DropdownMenuContent, {
                align: "end",
                children: [
                    /*#__PURE__*/ jsx(DropdownMenuItem, {
                        onClick: function() {
                            return setTheme("light");
                        },
                        children: /*#__PURE__*/ jsx(Trans, {
                            children: "Light"
                        })
                    }),
                    /*#__PURE__*/ jsxs(DropdownMenuItem, {
                        onClick: function() {
                            return setTheme("dark");
                        },
                        children: [
                            /*#__PURE__*/ jsx(Trans, {
                                children: "Dark"
                            }),
                            /*#__PURE__*/ jsx("span", {
                                className: "ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000] no-underline group-hover:no-underline",
                                children: /*#__PURE__*/ jsx(Trans, {
                                    children: "Beta"
                                })
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

function DataTableColumnHeader(param) {
    var column = param.column, title = param.title, className = param.className;
    if (!column.getCanSort()) {
        return /*#__PURE__*/ jsx("div", {
            className: cn(className),
            children: title
        });
    }
    return /*#__PURE__*/ jsx("div", {
        className: cn("flex items-center space-x-2", className),
        children: /*#__PURE__*/ jsxs(DropdownMenu, {
            children: [
                /*#__PURE__*/ jsx(DropdownMenuTrigger, {
                    asChild: true,
                    children: /*#__PURE__*/ jsxs(Button, {
                        variant: "ghost",
                        size: "sm",
                        className: "data-[state=open]:bg-accent -ml-3 h-8",
                        children: [
                            /*#__PURE__*/ jsx("span", {
                                children: title
                            }),
                            column.getIsSorted() === "desc" ? /*#__PURE__*/ jsx(ArrowDownIcon, {
                                className: "ml-2 h-4 w-4"
                            }) : column.getIsSorted() === "asc" ? /*#__PURE__*/ jsx(ArrowUpIcon, {
                                className: "ml-2 h-4 w-4"
                            }) : /*#__PURE__*/ jsx(CaretSortIcon, {
                                className: "ml-2 h-4 w-4"
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ jsxs(DropdownMenuContent, {
                    align: "start",
                    children: [
                        /*#__PURE__*/ jsxs(DropdownMenuItem, {
                            onClick: function() {
                                return column.toggleSorting(false);
                            },
                            children: [
                                /*#__PURE__*/ jsx(ArrowUpIcon, {
                                    className: "text-muted-foreground/70 mr-2 h-3.5 w-3.5"
                                }),
                                "Asc"
                            ]
                        }),
                        /*#__PURE__*/ jsxs(DropdownMenuItem, {
                            onClick: function() {
                                return column.toggleSorting(true);
                            },
                            children: [
                                /*#__PURE__*/ jsx(ArrowDownIcon, {
                                    className: "text-muted-foreground/70 mr-2 h-3.5 w-3.5"
                                }),
                                "Desc"
                            ]
                        }),
                        /*#__PURE__*/ jsx(DropdownMenuSeparator, {}),
                        /*#__PURE__*/ jsxs(DropdownMenuItem, {
                            onClick: function() {
                                return column.toggleVisibility(false);
                            },
                            children: [
                                /*#__PURE__*/ jsx(EyeNoneIcon, {
                                    className: "text-muted-foreground/70 mr-2 h-3.5 w-3.5"
                                }),
                                "Hide"
                            ]
                        })
                    ]
                })
            ]
        })
    });
}

function DataTableFacetedFilter(param) {
    var column = param.column, title = param.title, options = param.options;
    var facets = column === null || column === void 0 ? void 0 : column.getFacetedUniqueValues();
    var selectedValues = new Set(column === null || column === void 0 ? void 0 : column.getFilterValue());
    return /*#__PURE__*/ jsxs(Popover, {
        children: [
            /*#__PURE__*/ jsx(PopoverTrigger, {
                asChild: true,
                children: /*#__PURE__*/ jsxs(Button, {
                    variant: "outline",
                    size: "sm",
                    className: "h-8 border-dashed dark:border-2",
                    children: [
                        /*#__PURE__*/ jsx(MagnifyingGlassIcon, {
                            className: "mr-2 h-4 w-4"
                        }),
                        title,
                        (selectedValues === null || selectedValues === void 0 ? void 0 : selectedValues.size) > 0 && /*#__PURE__*/ jsxs(Fragment, {
                            children: [
                                /*#__PURE__*/ jsx(Separator, {
                                    orientation: "vertical",
                                    className: "mx-2 h-4"
                                }),
                                /*#__PURE__*/ jsx(Badge, {
                                    color: "secondary",
                                    className: "rounded-sm px-1 font-normal lg:hidden",
                                    children: selectedValues.size
                                }),
                                /*#__PURE__*/ jsx("div", {
                                    className: "hidden space-x-1 lg:flex",
                                    children: selectedValues.size > 2 ? /*#__PURE__*/ jsxs(Badge, {
                                        color: "secondary",
                                        className: "rounded-sm px-1 font-normal",
                                        children: [
                                            selectedValues.size,
                                            " selected"
                                        ]
                                    }) : options.filter(function(option) {
                                        return selectedValues.has(option.value);
                                    }).map(function(option) {
                                        return /*#__PURE__*/ jsx(Badge, {
                                            color: "secondary",
                                            className: "rounded-sm px-1 font-normal",
                                            children: option.label
                                        }, option.value);
                                    })
                                })
                            ]
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsx(PopoverContent, {
                className: "w-[200px] p-0",
                align: "start",
                children: /*#__PURE__*/ jsxs(Command, {
                    children: [
                        /*#__PURE__*/ jsx(CommandInput, {
                            placeholder: title
                        }),
                        /*#__PURE__*/ jsxs(CommandList, {
                            children: [
                                /*#__PURE__*/ jsxs(CommandEmpty, {
                                    children: [
                                        /*#__PURE__*/ jsx(Trans, {
                                            children: "No results found"
                                        }),
                                        "."
                                    ]
                                }),
                                /*#__PURE__*/ jsx(CommandGroup, {
                                    children: options.map(function(option) {
                                        var isSelected = selectedValues.has(option.value);
                                        return /*#__PURE__*/ jsxs(CommandItem, {
                                            onSelect: function() {
                                                if (isSelected) {
                                                    selectedValues.delete(option.value);
                                                } else {
                                                    selectedValues.add(option.value);
                                                }
                                                var filterValues = Array.from(selectedValues);
                                                column === null || column === void 0 ? void 0 : column.setFilterValue(filterValues.length ? filterValues : undefined);
                                            },
                                            children: [
                                                /*#__PURE__*/ jsx("div", {
                                                    className: cn("border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"),
                                                    children: /*#__PURE__*/ jsx(CheckIcon, {
                                                        className: cn("h-4 w-4")
                                                    })
                                                }),
                                                option.icon && /*#__PURE__*/ jsx(option.icon, {
                                                    className: "text-muted-foreground mr-2 h-4 w-4"
                                                }),
                                                /*#__PURE__*/ jsx("span", {
                                                    children: option.label
                                                }),
                                                (facets === null || facets === void 0 ? void 0 : facets.get(option.value)) && /*#__PURE__*/ jsx("span", {
                                                    className: "ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs",
                                                    children: facets.get(option.value)
                                                })
                                            ]
                                        }, option.value);
                                    })
                                }),
                                selectedValues.size > 0 && /*#__PURE__*/ jsxs(Fragment, {
                                    children: [
                                        /*#__PURE__*/ jsx(CommandSeparator, {}),
                                        /*#__PURE__*/ jsx(CommandList, {
                                            children: /*#__PURE__*/ jsx(CommandGroup, {
                                                children: /*#__PURE__*/ jsx(CommandItem, {
                                                    onSelect: function() {
                                                        return column === null || column === void 0 ? void 0 : column.setFilterValue(undefined);
                                                    },
                                                    className: "justify-center text-center",
                                                    children: /*#__PURE__*/ jsx(Trans, {
                                                        children: "Clear filters"
                                                    })
                                                })
                                            })
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            })
        ]
    });
}

var TableContext = /*#__PURE__*/ React__default.createContext({});
function useTableContext() {
    var context = React__default.useContext(TableContext);
    if (context === undefined) {
        throw new Error("useTableContext must be used within a TableProvider");
    }
    return context;
}

function DataTablePagination(param) {
    var _param_itemsPerPageOptions = param.itemsPerPageOptions, itemsPerPageOptions = _param_itemsPerPageOptions === void 0 ? [
        10,
        20,
        30,
        40,
        50
    ] : _param_itemsPerPageOptions;
    // @ts-expect-error TS(2339) FIXME: Property 'table' does not exist on type '{}'.
    var table = useTableContext().table;
    var t = useTranslation().t;
    var currentPage = Number(table.getState().pagination.pageIndex) + 1;
    var pageCount = table.getPageCount() || 1;
    return /*#__PURE__*/ jsx("div", {
        className: "flex items-center justify-end px-2",
        children: /*#__PURE__*/ jsxs("div", {
            className: "flex items-center space-x-6 lg:space-x-8",
            children: [
                /*#__PURE__*/ jsxs("div", {
                    className: "flex items-center space-x-2",
                    children: [
                        /*#__PURE__*/ jsx("p", {
                            className: "text-sm font-medium",
                            children: t("Items per page")
                        }),
                        /*#__PURE__*/ jsxs(SelectRoot, {
                            value: "".concat(table.getState().pagination.pageSize),
                            onValueChange: function(value) {
                                table.setPageSize(Number(value));
                            },
                            children: [
                                /*#__PURE__*/ jsx(SelectTrigger, {
                                    className: "h-8 w-[70px]",
                                    children: /*#__PURE__*/ jsx(SelectValue, {
                                        placeholder: table.getState().pagination.pageSize
                                    })
                                }),
                                /*#__PURE__*/ jsx(SelectContent, {
                                    side: "top",
                                    children: itemsPerPageOptions.map(function(pageSize) {
                                        return /*#__PURE__*/ jsx(SelectItem, {
                                            value: "".concat(pageSize),
                                            children: pageSize
                                        }, pageSize);
                                    })
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ jsxs("div", {
                    className: "flex w-[100px] items-center justify-center text-sm font-medium",
                    children: [
                        /*#__PURE__*/ jsxs(Trans, {
                            children: [
                                "Page ",
                                {
                                    currentPage: currentPage
                                },
                                " of"
                            ]
                        }),
                        " ",
                        pageCount
                    ]
                }),
                /*#__PURE__*/ jsxs("div", {
                    className: "flex items-center space-x-2",
                    children: [
                        /*#__PURE__*/ jsxs(Button, {
                            // @ts-ignore
                            variant: "outline",
                            className: "hidden h-8 w-8 p-0 lg:flex",
                            onClick: function() {
                                return table.setPageIndex(0);
                            },
                            disabled: !table.getCanPreviousPage(),
                            children: [
                                /*#__PURE__*/ jsx("span", {
                                    className: "sr-only",
                                    children: "Go to first page"
                                }),
                                /*#__PURE__*/ jsx(DoubleArrowLeftIcon, {
                                    className: "h-4 w-4"
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsxs(Button, {
                            // @ts-ignore
                            variant: "outline",
                            className: "h-8 w-8 p-0",
                            onClick: function() {
                                return table.previousPage();
                            },
                            disabled: !table.getCanPreviousPage(),
                            children: [
                                /*#__PURE__*/ jsx("span", {
                                    className: "sr-only",
                                    children: "Go to previous page"
                                }),
                                /*#__PURE__*/ jsx(ChevronLeftIcon, {
                                    className: "h-4 w-4"
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsxs(Button, {
                            // @ts-ignore
                            variant: "outline",
                            className: "h-8 w-8 p-0",
                            onClick: function() {
                                return table.nextPage();
                            },
                            disabled: !table.getCanNextPage(),
                            children: [
                                /*#__PURE__*/ jsx("span", {
                                    className: "sr-only",
                                    children: "Go to next page"
                                }),
                                /*#__PURE__*/ jsx(ChevronRightIcon, {
                                    className: "h-4 w-4"
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsxs(Button, {
                            variant: "outline",
                            className: "hidden h-8 w-8 p-0 lg:flex",
                            onClick: function() {
                                return table.setPageIndex(table.getPageCount() - 1);
                            },
                            disabled: !table.getCanNextPage(),
                            children: [
                                /*#__PURE__*/ jsx("span", {
                                    className: "sr-only",
                                    children: "Go to last page"
                                }),
                                /*#__PURE__*/ jsx(DoubleArrowRightIcon, {
                                    className: "h-4 w-4"
                                })
                            ]
                        })
                    ]
                })
            ]
        })
    });
}

function _define_property$l(obj, key, value) {
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
function _object_spread$l(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$l(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$f(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$f(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$f(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$4(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$4(source, excluded);
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
function _object_without_properties_loose$4(source, excluded) {
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
function Link(_param) {
    var to = _param.to, children = _param.children, props = _object_without_properties$4(_param, [
        "to",
        "children"
    ]);
    return /*#__PURE__*/ jsx(Link$1, _object_spread_props$f(_object_spread$l({
        to: to,
        unstable_viewTransition: true
    }, props), {
        children: children
    }));
}

function _define_property$k(obj, key, value) {
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
function _object_spread$k(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$k(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$e(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$e(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$e(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties$3(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose$3(source, excluded);
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
function _object_without_properties_loose$3(source, excluded) {
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
var SubmitButton = /*#__PURE__*/ React__default.forwardRef(function(_param, ref) {
    var _param_isSubmitting = _param.isSubmitting, isSubmitting = _param_isSubmitting === void 0 ? false : _param_isSubmitting, submittingText = _param.submittingText, props = _object_without_properties$3(_param, [
        "isSubmitting",
        "submittingText"
    ]);
    var state = useNavigation().state;
    var t = useTranslation().t;
    var loadingText = submittingText !== null && submittingText !== void 0 ? submittingText : t("Loading");
    return /*#__PURE__*/ jsx(Button, _object_spread_props$e(_object_spread$k({
        ref: ref
    }, props), {
        loadingText: loadingText,
        loading: isSubmitting || state === "submitting"
    }));
});

/* eslint-disable no-case-declarations */ function _array_like_to_array$b(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$9(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property$j(obj, key, value) {
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
function _iterable_to_array_limit$9(arr, i) {
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
function _non_iterable_rest$9() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread$j(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$j(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$d(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$d(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$d(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _sliced_to_array$9(arr, i) {
    return _array_with_holes$9(arr) || _iterable_to_array_limit$9(arr, i) || _unsupported_iterable_to_array$b(arr, i) || _non_iterable_rest$9();
}
function _unsupported_iterable_to_array$b(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$b(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$b(o, minLen);
}
var DynamicActionComponent = function(param) {
    var action = param.action, row = param.row;
    var renderActionButton = function() {
        switch(action.type){
            case "link":
                return /*#__PURE__*/ jsx(Link, {
                    to: action.url_path.replace("RESOURCE_ID", row.original.id),
                    children: /*#__PURE__*/ jsx(Button, {
                        variant: "ghost",
                        className: "w-full text-sm",
                        children: action.name
                    })
                });
            case "copy":
                var _action_content, _row_original;
                var key = (_action_content = action.content) === null || _action_content === void 0 ? void 0 : _action_content.key;
                var value = (_row_original = row.original) === null || _row_original === void 0 ? void 0 : _row_original[key];
                if (!value) return null;
                return /*#__PURE__*/ jsx(Button, {
                    variant: "ghost",
                    className: "w-full",
                    children: /*#__PURE__*/ jsx(ClickToCopy, {
                        text: value,
                        children: /*#__PURE__*/ jsx("span", {
                            children: action.name
                        })
                    })
                });
            case "form":
                return /*#__PURE__*/ jsx(ActionForm, {
                    action: action,
                    row: row
                });
            default:
                return null;
        }
    };
    return renderActionButton();
};
var ActionForm = function(param) {
    var action = param.action, row = param.row, children = param.children;
    var form = useForm({});
    var _React_useState = _sliced_to_array$9(React__default.useState(false), 2), isDialogOpen = _React_useState[0], setIsDialogOpen = _React_useState[1];
    var _React_useState1 = _sliced_to_array$9(React__default.useState(false), 2), isSubmitting = _React_useState1[0], setIsSubmitting = _React_useState1[1];
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            (action === null || action === void 0 ? void 0 : action.trigger_confirmation) && /*#__PURE__*/ jsxs(AlertDialog, {
                open: isDialogOpen,
                onOpenChange: setIsDialogOpen,
                children: [
                    /*#__PURE__*/ jsx(AlertDialogTrigger, {
                        asChild: true,
                        children: children || /*#__PURE__*/ jsx(Button, {
                            variant: "ghost",
                            className: "w-full",
                            children: action.name
                        })
                    }),
                    /*#__PURE__*/ jsxs(AlertDialogContent, {
                        children: [
                            /*#__PURE__*/ jsxs(AlertDialogHeader, {
                                children: [
                                    /*#__PURE__*/ jsx(AlertDialogTitle, {
                                        children: /*#__PURE__*/ jsx(Trans, {
                                            children: "Are you sure?"
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(AlertDialogDescription, {
                                        children: /*#__PURE__*/ jsx(Trans, {
                                            children: "This action cannot be undone."
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxs(AlertDialogFooter, {
                                children: [
                                    /*#__PURE__*/ jsx(AlertDialogCancel, {
                                        children: /*#__PURE__*/ jsx(Trans, {
                                            children: "Cancel"
                                        })
                                    }),
                                    /*#__PURE__*/ jsxs(Form, _object_spread_props$d(_object_spread$j({
                                        onSubmit: function() {
                                            return setIsSubmitting(true);
                                        },
                                        action: action.url_path.replace("RESOURCE_ID", row.original.id),
                                        method: "post"
                                    }, form), {
                                        children: [
                                            action.method === "delete" && /*#__PURE__*/ jsx("input", {
                                                type: "hidden",
                                                name: "_method",
                                                value: "delete"
                                            }),
                                            /*#__PURE__*/ jsx(SubmitButton, {
                                                type: "submit",
                                                isSubmitting: isSubmitting,
                                                children: /*#__PURE__*/ jsx(Trans, {
                                                    children: "Confirm"
                                                })
                                            })
                                        ]
                                    }))
                                ]
                            })
                        ]
                    })
                ]
            }),
            !(action === null || action === void 0 ? void 0 : action.trigger_confirmation) && /*#__PURE__*/ jsxs(Form, _object_spread_props$d(_object_spread$j({
                action: action.url_path.replace("RESOURCE_ID", row.original.id),
                method: "post"
            }, form), {
                children: [
                    action.method === "delete" && /*#__PURE__*/ jsx("input", {
                        type: "hidden",
                        name: "_method",
                        value: "delete"
                    }),
                    /*#__PURE__*/ jsx(Button, {
                        variant: "ghost",
                        className: "w-full",
                        type: "submit",
                        children: action.name
                    })
                ]
            }))
        ]
    });
};

var DataTableRowActions = function(param) {
    var row = param.row, column = param.column;
    var actions = row.original.actions || column.columnDef.actions;
    if (!(actions === null || actions === void 0 ? void 0 : actions.length)) return null;
    var filteredActions = actions.filter(function(param) {
        var condition_key = param.condition_key, condition_value = param.condition_value;
        var _row_original;
        if (!condition_key && !condition_value) return true;
        return ((_row_original = row.original) === null || _row_original === void 0 ? void 0 : _row_original[condition_key]) === condition_value;
    });
    if ((filteredActions === null || filteredActions === void 0 ? void 0 : filteredActions.length) === 0) return null;
    return /*#__PURE__*/ jsxs(DropdownMenu, {
        children: [
            /*#__PURE__*/ jsx(DropdownMenuTrigger, {
                asChild: true,
                children: /*#__PURE__*/ jsxs(Button, {
                    variant: "ghost",
                    className: "data-[state=open]:bg-muted flex h-8 w-8 items-center justify-center whitespace-nowrap rounded-md p-0",
                    children: [
                        /*#__PURE__*/ jsx(DotsHorizontalIcon, {
                            className: "h-4 w-4"
                        }),
                        /*#__PURE__*/ jsx("span", {
                            className: "sr-only",
                            children: "Open menu"
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsx(DropdownMenuContent, {
                align: "end",
                className: "w-full",
                children: filteredActions.map(function(action) {
                    return /*#__PURE__*/ jsx(DynamicActionComponent, {
                        action: action,
                        row: row
                    }, action);
                })
            })
        ]
    });
};

function DataTableViewOptions() {
    // @ts-expect-error TS(2339) FIXME: Property 'table' does not exist on type '{}'.
    var table = useTableContext().table;
    return /*#__PURE__*/ jsxs(DropdownMenu, {
        children: [
            /*#__PURE__*/ jsx(DropdownMenuTrigger$1, {
                asChild: true,
                children: /*#__PURE__*/ jsxs(Button, {
                    variant: "outline",
                    size: "sm",
                    className: "ml-auto hidden h-8 lg:flex dark:border-2",
                    children: [
                        /*#__PURE__*/ jsx(MixerHorizontalIcon, {
                            className: "mr-2 h-4 w-4"
                        }),
                        /*#__PURE__*/ jsx(Trans, {
                            children: "View"
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxs(DropdownMenuContent, {
                align: "end",
                className: "w-[150px]",
                children: [
                    /*#__PURE__*/ jsx(DropdownMenuLabel, {
                        children: /*#__PURE__*/ jsx(Trans, {
                            children: "Toggle columns"
                        })
                    }),
                    /*#__PURE__*/ jsx(DropdownMenuSeparator, {}),
                    table.getAllColumns().filter(function(column) {
                        return typeof column.accessorFn !== "undefined" && !column.columnDef.hide && column.getCanHide();
                    }).map(function(column) {
                        var _column_columnDef;
                        return /*#__PURE__*/ jsx(DropdownMenuCheckboxItem, {
                            className: "capitalize",
                            checked: column.getIsVisible(),
                            onCheckedChange: function(value) {
                                return column.toggleVisibility(!!value);
                            },
                            children: (column === null || column === void 0 ? void 0 : (_column_columnDef = column.columnDef) === null || _column_columnDef === void 0 ? void 0 : _column_columnDef.title) || column.id
                        }, column.id);
                    })
                ]
            })
        ]
    });
}

function DataTableSearch(param) {
    var _param_searchKey = param.searchKey, searchKey = _param_searchKey === void 0 ? "name" : _param_searchKey, _param_placeholder = param.placeholder, placeholder = _param_placeholder === void 0 ? "" : _param_placeholder;
    var _table_getColumn;
    // @ts-expect-error TS(2339) FIXME: Property 'table' does not exist on type '{}'.
    var _useTableContext = useTableContext(), table = _useTableContext.table, TableSeachKey = _useTableContext.searchKey;
    var search = TableSeachKey || searchKey;
    var t = useTranslation().t;
    var _table_getColumn_getFilterValue;
    return /*#__PURE__*/ jsx(Input, {
        placeholder: placeholder || t("Search"),
        value: (_table_getColumn_getFilterValue = (_table_getColumn = table.getColumn(search)) === null || _table_getColumn === void 0 ? void 0 : _table_getColumn.getFilterValue()) !== null && _table_getColumn_getFilterValue !== void 0 ? _table_getColumn_getFilterValue : "",
        onChange: function(event) {
            var _table_getColumn;
            return (_table_getColumn = table.getColumn(search)) === null || _table_getColumn === void 0 ? void 0 : _table_getColumn.setFilterValue(event.target.value);
        },
        className: "h-8 w-[150px] lg:w-[250px] dark:border-2"
    });
}

function DataTableFilters() {
    // @ts-expect-error TS(2339) FIXME: Property 'table' does not exist on type '{}'.
    var _useTableContext = useTableContext(), table = _useTableContext.table, filters = _useTableContext.filters;
    if (!table || !filters) {
        return null;
    }
    var isFiltered = table.getState().columnFilters.filter(function(filter) {
        return filter.value.length > 0;
    }).length > 0;
    var initialFilterSet = useRef(false);
    useEffect(function() {
        if (filters && !initialFilterSet.current) {
            filters.map(function(filter) {
                var column = table.getColumn(filter.value);
                if (column) {
                    column.setFilterValue(filter.options.filter(function(option) {
                        return option.defaultSelected;
                    }).map(function(option) {
                        return option.value;
                    }));
                }
                return null;
            });
            initialFilterSet.current = true;
        }
    }, [
        filters,
        table
    ]);
    return /*#__PURE__*/ jsxs("div", {
        className: "flex flex-1 items-start space-x-2",
        children: [
            /*#__PURE__*/ jsx("div", {
                className: "flex flex-wrap gap-1",
                children: filters.map(function(filter) {
                    return table.getColumn(filter.value) && /*#__PURE__*/ jsx(DataTableFacetedFilter, {
                        column: table.getColumn(filter.value),
                        title: filter.title,
                        options: filter.options
                    }, filter.title);
                })
            }),
            isFiltered && /*#__PURE__*/ jsxs(Button, {
                variant: "ghost",
                onClick: function() {
                    return table.resetColumnFilters();
                },
                className: "h-8 px-2 lg:px-3",
                children: [
                    /*#__PURE__*/ jsx(Trans, {
                        children: "Reset"
                    }),
                    /*#__PURE__*/ jsx(Cross2Icon, {
                        className: "ml-2 h-4 w-4"
                    })
                ]
            })
        ]
    });
}

function DataTableToolbar(param) {
    var action = param.action, _param_showViewOptions = param.showViewOptions, showViewOptions = _param_showViewOptions === void 0 ? true : _param_showViewOptions, _param_searchKey = param.searchKey, searchKey = _param_searchKey === void 0 ? "name" : _param_searchKey;
    return /*#__PURE__*/ jsxs("div", {
        className: "flex items-start justify-between",
        children: [
            /*#__PURE__*/ jsxs("div", {
                className: "flex flex-1 items-start space-x-2",
                children: [
                    /*#__PURE__*/ jsx(DataTableSearch, {
                        searchKey: searchKey
                    }),
                    /*#__PURE__*/ jsx(DataTableFilters, {})
                ]
            }),
            /*#__PURE__*/ jsxs("div", {
                className: "flex items-center space-x-2",
                children: [
                    action,
                    showViewOptions && /*#__PURE__*/ jsx(DataTableViewOptions, {})
                ]
            })
        ]
    });
}

var SectionTitle = function(param) {
    var children = param.children, className = param.className;
    return /*#__PURE__*/ jsx("h2", {
        className: cn("pt-8 text-2xl font-bold tracking-tigh text-foreground", className),
        children: children
    });
};

function _define_property$i(obj, key, value) {
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
function _object_spread$i(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$i(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$c(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$c(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$c(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function formatRequestParams$1(originalObj) {
    var _originalObj_sorting;
    return _object_spread_props$c(_object_spread$i({}, originalObj), {
        grouping: originalObj.grouping.length > 0 ? originalObj.grouping[0] : null,
        sorting: (originalObj === null || originalObj === void 0 ? void 0 : (_originalObj_sorting = originalObj.sorting) === null || _originalObj_sorting === void 0 ? void 0 : _originalObj_sorting.length) > 0 ? originalObj.sorting[0] : null,
        columnFilters: originalObj.columnFilters.reduce(function(acc, filter) {
            acc[filter.id] = filter.value;
            return acc;
        }, {})
    });
}
var defaultFilterFn = function(row, id, filterValue) {
    return row.getValue(id).includes(filterValue);
};
var buildColumns = function(columnsConfig) {
    if (!columnsConfig) return [];
    return columnsConfig.map(function(columnConfig) {
        return _object_spread_props$c(_object_spread$i({}, columnConfig), {
            filterFn: columnConfig.filterable ? defaultFilterFn : null
        });
    });
};
function DataTable(param) {
    var children = param.children, data = param.data, error = param.error, tableState = param.tableState, setTableState = param.setTableState, _param_buildTableColumns = param.buildTableColumns, buildTableColumns = _param_buildTableColumns === void 0 ? buildColumns : _param_buildTableColumns, setQueryToParams = param.setQueryToParams, setSelectedData = param.setSelectedData, _param_isLoading = param.isLoading, isLoading = _param_isLoading === void 0 ? false : _param_isLoading;
    var _data_search;
    var pagination = tableState.pagination, rowSelection = tableState.rowSelection, columnVisibility = tableState.columnVisibility, columnFilters = tableState.columnFilters, sorting = tableState.sorting, grouping = tableState.grouping, expanded = tableState.expanded;
    var setPagination = setTableState.setPagination, setRowSelection = setTableState.setRowSelection, setColumnVisibility = setTableState.setColumnVisibility, setColumnFilters = setTableState.setColumnFilters, setSorting = setTableState.setSorting, setGrouping = setTableState.setGrouping, setExpanded = setTableState.setExpanded;
    if (error) {
        return /*#__PURE__*/ jsxs("div", {
            children: [
                "Error: ",
                error.message
            ]
        });
    }
    // @ts-ignore
    var columns = buildTableColumns(data === null || data === void 0 ? void 0 : data.columns, data === null || data === void 0 ? void 0 : data.filters);
    var filters = data === null || data === void 0 ? void 0 : data.filters;
    var searchKey = data === null || data === void 0 ? void 0 : (_data_search = data.search) === null || _data_search === void 0 ? void 0 : _data_search.key;
    var hiddenColumns = columns.filter(function(c) {
        return c.hide;
    }).map(function(c) {
        return _define_property$i({}, c.accessorKey, false);
    }).reduce(function(acc, obj) {
        return Object.assign(acc, obj);
    }, {});
    var _data_data, _data_total;
    var table = useReactTable(_object_spread_props$c(_object_spread$i({
        data: (_data_data = data === null || data === void 0 ? void 0 : data.data) !== null && _data_data !== void 0 ? _data_data : [],
        pageCount: Math.ceil(((_data_total = data === null || data === void 0 ? void 0 : data.total) !== null && _data_total !== void 0 ? _data_total : 0) / pagination.pageSize),
        columns: columns,
        state: _object_spread_props$c(_object_spread$i({}, grouping.length > 0 ? {
            grouping: grouping
        } : {}), {
            sorting: sorting,
            rowSelection: rowSelection,
            columnFilters: columnFilters,
            pagination: pagination,
            expanded: expanded,
            columnVisibility: _object_spread$i({}, columnVisibility, hiddenColumns)
        })
    }, grouping.length > 0 ? {
        onGroupingChange: setGrouping,
        getExpandedRowModel: getExpandedRowModel(),
        getGroupedRowModel: getGroupedRowModel(),
        autoResetExpanded: false
    } : {}), {
        onPaginationChange: setPagination,
        manualPagination: true,
        enableRowSelection: true,
        onExpandedChange: setExpanded,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues()
    }));
    React__default.useEffect(function() {
        if (setSelectedData) setSelectedData(table.getSelectedRowModel().flatRows.map(function(row) {
            return row.original;
        }));
    }, [
        rowSelection,
        table,
        setSelectedData
    ]);
    var navigate = useNavigate();
    useEffect(function() {
        if (!setQueryToParams) return;
        var formattedParams = formatRequestParams$1({
            columnFilters: tableState.columnFilters,
            sorting: tableState.sorting,
            pageIndex: tableState.pagination.pageIndex,
            pageSize: tableState.pagination.pageSize,
            grouping: tableState.grouping
        });
        var params = serializeQuery(formattedParams);
        navigate("?".concat(params), {
            replace: true
        });
    }, [
        tableState.pagination.pageIndex,
        tableState.pagination.pageSize,
        tableState.sorting,
        tableState.columnFilters,
        tableState.grouping,
        navigate
    ]);
    var contextValue = useMemo(function() {
        return {
            data: data,
            filters: filters,
            error: error,
            tableState: tableState,
            setTableState: setTableState,
            table: table,
            searchKey: searchKey,
            isLoading: isLoading
        };
    }, [
        data,
        filters,
        error,
        tableState,
        setTableState,
        table,
        searchKey,
        isLoading
    ]);
    return /*#__PURE__*/ jsx(TableContext.Provider, {
        value: contextValue,
        children: children
    });
}

function _array_like_to_array$a(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$8(arr) {
    if (Array.isArray(arr)) return arr;
}
function _iterable_to_array_limit$8(arr, i) {
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
function _non_iterable_rest$8() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _sliced_to_array$8(arr, i) {
    return _array_with_holes$8(arr) || _iterable_to_array_limit$8(arr, i) || _unsupported_iterable_to_array$a(arr, i) || _non_iterable_rest$8();
}
function _unsupported_iterable_to_array$a(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$a(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$a(o, minLen);
}
function useTableState() {
    var initialState = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    var _useState = _sliced_to_array$8(useState(initialState.pagination || {
        pageIndex: 0,
        pageSize: 10
    }), 2), pagination = _useState[0], setPagination = _useState[1];
    var _useState1 = _sliced_to_array$8(useState(initialState.rowSelection || {}), 2), rowSelection = _useState1[0], setRowSelection = _useState1[1];
    var _useState2 = _sliced_to_array$8(useState(initialState.columnVisibility || {}), 2), columnVisibility = _useState2[0], setColumnVisibility = _useState2[1];
    var _useState3 = _sliced_to_array$8(useState(initialState.columnFilters || []), 2), columnFilters = _useState3[0], setColumnFilters = _useState3[1];
    var _useState4 = _sliced_to_array$8(useState(initialState.sorting || []), 2), sorting = _useState4[0], setSorting = _useState4[1];
    var _useState5 = _sliced_to_array$8(useState(initialState.grouping || []), 2), grouping = _useState5[0], setGrouping = _useState5[1];
    var _useState6 = _sliced_to_array$8(useState(initialState.expanded || false), 2), expanded = _useState6[0], setExpanded = _useState6[1];
    var state = useMemo(function() {
        return {
            pagination: pagination,
            rowSelection: rowSelection,
            columnVisibility: columnVisibility,
            columnFilters: columnFilters,
            sorting: sorting,
            grouping: grouping,
            expanded: expanded
        };
    }, [
        pagination,
        rowSelection,
        columnVisibility,
        columnFilters,
        sorting,
        grouping,
        expanded
    ]);
    var handlers = useMemo(function() {
        return {
            setPagination: setPagination,
            setRowSelection: setRowSelection,
            setColumnVisibility: setColumnVisibility,
            setColumnFilters: setColumnFilters,
            setSorting: setSorting,
            setGrouping: setGrouping,
            setExpanded: setExpanded
        };
    }, [
        setPagination,
        setRowSelection,
        setColumnVisibility,
        setColumnFilters,
        setSorting,
        setGrouping,
        setExpanded
    ]);
    return {
        tableState: state,
        setTableState: handlers
    };
}

function _define_property$h(obj, key, value) {
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
function _object_spread$h(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$h(target, key, source[key]);
        });
    }
    return target;
}
function _type_of$1(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
var mergeObjects = function(existing, incoming) {
    var result = _object_spread$h({}, existing);
    Object.keys(incoming).forEach(function(key) {
        if (key in result && _type_of$1(result[key]) === "object" && _type_of$1(incoming[key]) === "object") {
            result[key] = mergeObjects(result[key], incoming[key]);
        } else if (!(key in result)) {
            result[key] = incoming[key];
        }
    });
    return result;
};

function constructFullUrlWithParams(pathOrUrl, queryParams) {
    if (typeof pathOrUrl !== "string") {
        throw new Error("Base URL must be a string.");
    }
    var isFullUrl = /^(http|https):\/\//.test(pathOrUrl);
    var url = new URL(pathOrUrl, isFullUrl ? undefined : window.location.origin);
    var existingParams = deserializeQuery(url.search);
    var mergedParams = mergeObjects(existingParams, queryParams);
    var serializedParams = serializeQuery(mergedParams);
    url.search = serializedParams;
    return url.toString();
}

function _array_like_to_array$9(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$7(arr) {
    if (Array.isArray(arr)) return arr;
}
function _assert_this_initialized(self) {
    if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _construct(Parent, args, Class) {
    if (_is_native_reflect_construct()) {
        _construct = Reflect.construct;
    } else {
        _construct = function construct(Parent, args, Class) {
            var a = [
                null
            ];
            a.push.apply(a, args);
            var Constructor = Function.bind.apply(Parent, a);
            var instance = new Constructor();
            if (Class) _set_prototype_of(instance, Class.prototype);
            return instance;
        };
    }
    return _construct.apply(null, arguments);
}
function _define_property$g(obj, key, value) {
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
function _get_prototype_of(o) {
    _get_prototype_of = Object.setPrototypeOf ? Object.getPrototypeOf : function getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _get_prototype_of(o);
}
function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of(subClass, superClass);
}
function _is_native_function(fn) {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
}
function _iterable_to_array_limit$7(arr, i) {
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
function _non_iterable_rest$7() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread$g(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$g(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$b(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$b(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$b(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _possible_constructor_return(self, call) {
    if (call && (_type_of(call) === "object" || typeof call === "function")) {
        return call;
    }
    return _assert_this_initialized(self);
}
function _set_prototype_of(o, p) {
    _set_prototype_of = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of(o, p);
}
function _sliced_to_array$7(arr, i) {
    return _array_with_holes$7(arr) || _iterable_to_array_limit$7(arr, i) || _unsupported_iterable_to_array$9(arr, i) || _non_iterable_rest$7();
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _unsupported_iterable_to_array$9(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$9(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$9(o, minLen);
}
function _wrap_native_super(Class) {
    var _cache = typeof Map === "function" ? new Map() : undefined;
    _wrap_native_super = function wrapNativeSuper(Class) {
        if (Class === null || !_is_native_function(Class)) return Class;
        if (typeof Class !== "function") {
            throw new TypeError("Super expression must either be null or a function");
        }
        if (typeof _cache !== "undefined") {
            if (_cache.has(Class)) return _cache.get(Class);
            _cache.set(Class, Wrapper);
        }
        function Wrapper() {
            return _construct(Class, arguments, _get_prototype_of(this).constructor);
        }
        Wrapper.prototype = Object.create(Class.prototype, {
            constructor: {
                value: Wrapper,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        return _set_prototype_of(Wrapper, Class);
    };
    return _wrap_native_super(Class);
}
function _is_native_reflect_construct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;
    try {
        Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
        return true;
    } catch (e) {
        return false;
    }
}
function _create_super(Derived) {
    var hasNativeReflectConstruct = _is_native_reflect_construct();
    return function _createSuperInternal() {
        var Super = _get_prototype_of(Derived), result;
        if (hasNativeReflectConstruct) {
            var NewTarget = _get_prototype_of(this).constructor;
            result = Reflect.construct(Super, arguments, NewTarget);
        } else {
            result = Super.apply(this, arguments);
        }
        return _possible_constructor_return(this, result);
    };
}
function _ts_generator(thisArg, body) {
    var f, y, t, g, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    };
    return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(_)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
function formatRequestParams(originalObj) {
    var _originalObj_sorting;
    return _object_spread_props$b(_object_spread$g({}, originalObj), {
        grouping: originalObj.grouping.length > 0 ? originalObj.grouping[0] : null,
        sorting: (originalObj === null || originalObj === void 0 ? void 0 : (_originalObj_sorting = originalObj.sorting) === null || _originalObj_sorting === void 0 ? void 0 : _originalObj_sorting.length) > 0 ? originalObj.sorting[0] : null,
        columnFilters: originalObj.columnFilters.reduce(function(acc, filter) {
            acc[filter.id] = filter.value;
            return acc;
        }, {})
    });
}
var FetchError = /*#__PURE__*/ function(Error1) {
    _inherits(FetchError, Error1);
    var _super = _create_super(FetchError);
    function FetchError(message, response) {
        _class_call_check(this, FetchError);
        var _this;
        _this = _super.call(this, message);
        _define_property$g(_assert_this_initialized(_this), "response", void 0);
        _this.response = response;
        return _this;
    }
    return FetchError;
}(_wrap_native_super(Error));
var dataTableFetcher = function() {
    var _ref = _async_to_generator(function(param) {
        var _param, pathOrUrl, paramsObject, formattedParams, fullUrl, response;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    _param = _sliced_to_array$7(param, 2), pathOrUrl = _param[0], paramsObject = _param[1];
                    formattedParams = formatRequestParams(paramsObject);
                    fullUrl = constructFullUrlWithParams(pathOrUrl, formattedParams);
                    return [
                        4,
                        fetch(fullUrl, {
                            headers: {
                                Accept: "application/json"
                            }
                        })
                    ];
                case 1:
                    response = _state.sent();
                    if (!response.ok) {
                        throw new FetchError("Failed to fetch", response);
                    }
                    return [
                        2,
                        response.json()
                    ];
            }
        });
    });
    return function dataTableFetcher(_) {
        return _ref.apply(this, arguments);
    };
}();
function useSWRDataTable(path) {
    var initialSearch = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var _useTableState = useTableState(initialSearch), tableState = _useTableState.tableState, setTableState = _useTableState.setTableState;
    var _useSWR = useSWR([
        path,
        {
            pageIndex: tableState.pagination.pageIndex,
            pageSize: tableState.pagination.pageSize,
            sorting: tableState.sorting,
            columnFilters: tableState.columnFilters,
            grouping: tableState.grouping
        }
    ], dataTableFetcher, _object_spread$g({
        keepPreviousData: true
    }, options)), data = _useSWR.data, error = _useSWR.error, isLoading = _useSWR.isLoading;
    return {
        data: data,
        error: error,
        isLoading: isLoading,
        tableState: tableState,
        setTableState: setTableState
    };
}

function DataTableHeader() {
    // @ts-expect-error TS(2339) FIXME: Property 'table' does not exist on type '{}'.
    var table = useTableContext().table;
    return /*#__PURE__*/ jsx(TableHeader, {
        children: table.getHeaderGroups().map(function(headerGroup) {
            return /*#__PURE__*/ jsx(TableRow, {
                children: headerGroup.headers.map(function(header) {
                    return /*#__PURE__*/ jsx(TableHead, {
                        children: header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())
                    }, header.id);
                })
            }, headerGroup.id);
        })
    });
}

function DataTableBody(param) {
    var hasDetails = param.hasDetails;
    var _table_getRowModel_rows;
    // @ts-expect-error TS(2339) FIXME: Property 'table' does not exist on type '{}'.
    var table = useTableContext().table;
    var navigate = useNavigate();
    return /*#__PURE__*/ jsx(TableBody, {
        children: ((_table_getRowModel_rows = table.getRowModel().rows) === null || _table_getRowModel_rows === void 0 ? void 0 : _table_getRowModel_rows.length) ? table.getRowModel().rows.map(function(row) {
            return /*#__PURE__*/ jsx(TableRow, {
                "data-state": row.getIsSelected() && "selected",
                onClick: function() {
                    if (hasDetails) {
                        navigate("".concat(row.original.id));
                    }
                },
                children: row.getVisibleCells().map(function(cell) {
                    return /*#__PURE__*/ jsx(TableCell, {
                        children: flexRender(cell.column.columnDef.cell, cell.getContext())
                    }, cell.id);
                })
            }, row.id);
        }) : /*#__PURE__*/ jsx(TableRow, {
            children: /*#__PURE__*/ jsxs(TableCell, {
                className: "h-24 text-center",
                children: [
                    /*#__PURE__*/ jsx(Trans, {
                        children: "No results found"
                    }),
                    "."
                ]
            })
        })
    });
}

/* eslint-disable no-restricted-syntax */ function _array_like_to_array$8(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$6(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property$f(obj, key, value) {
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
function _iterable_to_array_limit$6(arr, i) {
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
function _non_iterable_rest$6() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread$f(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$f(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$a(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$a(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$a(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _sliced_to_array$6(arr, i) {
    return _array_with_holes$6(arr) || _iterable_to_array_limit$6(arr, i) || _unsupported_iterable_to_array$8(arr, i) || _non_iterable_rest$6();
}
function _unsupported_iterable_to_array$8(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$8(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$8(o, minLen);
}
var formatParamsToDataTable = function(params, searchKey) {
    var _params_columnFilters = params.columnFilters, columnFilters = _params_columnFilters === void 0 ? {} : _params_columnFilters, pageIndex = params.pageIndex, pageSize = params.pageSize, sorting = params.sorting;
    var sortingObj = sorting ? {
        sorting: [
            sorting
        ]
    } : {};
    var columnFiltersObj = Object.keys(columnFilters).length > 0 ? {
        columnFilters: Object.entries(columnFilters).map(function(param) {
            var _param = _sliced_to_array$6(param, 2), id = _param[0], value = _param[1];
            return {
                id: id,
                value: Array.isArray(value) ? value : id === searchKey ? value : [
                    value
                ]
            };
        })
    } : {};
    var to = _object_spread$f(_object_spread_props$a(_object_spread$f({}, sortingObj), {
        pagination: {
            pageIndex: pageIndex || 0,
            pageSize: !pageSize ? 10 : pageSize > 50 ? 50 : pageSize
        }
    }), columnFiltersObj);
    return to;
};
var renderDataTableCell = function(param) {
    var filters = param.filters, column = param.column, row = param.row, selectedRows = param.selectedRows;
    var _column_columnDef_field_options;
    var value = row.getValue(column.columnDef.accessorKey);
    var i18n = useTranslation().i18n;
    var displayAs = ((_column_columnDef_field_options = column.columnDef.field_options) === null || _column_columnDef_field_options === void 0 ? void 0 : _column_columnDef_field_options.display_type) || column.columnDef.type;
    switch(displayAs){
        case "text":
            return /*#__PURE__*/ jsx("div", {
                className: "max-w-[400px] truncate",
                children: value
            });
        case "boolean":
            return value ? /*#__PURE__*/ jsx(CheckIcon, {
                className: "size-4 bg-primary text-primary-foreground rounded-full"
            }) : /*#__PURE__*/ jsx(Cross2Icon, {
                className: "size-4 text-muted-foreground"
            });
        case "badge":
            // TODO: needs to be refactored
            switch(value){
                case "draft":
                    return /*#__PURE__*/ jsx(Badge, {
                        color: "pending",
                        children: "Draft"
                    });
                case "scheduled":
                    return /*#__PURE__*/ jsx(Badge, {
                        color: "success",
                        outline: "outline",
                        children: "Scheduled"
                    });
                case "active":
                    return /*#__PURE__*/ jsx(Badge, {
                        color: "success",
                        children: "Active"
                    });
                case "ended":
                    return /*#__PURE__*/ jsx(Badge, {
                        color: "destructive",
                        children: "Ended"
                    });
                default:
                    if (column.columnDef.accessorKey !== "is_active") {
                        return /*#__PURE__*/ jsx(Badge, {
                            children: value
                        });
                    }
                    // eslint-disable-next-line no-case-declarations
                    var status = filters[0].options.find(// eslint-disable-next-line no-shadow
                    function(status) {
                        return status.value === row.getValue("is_active");
                    });
                    if (!status) {
                        return null;
                    }
                    return /*#__PURE__*/ jsx(Badge, {
                        color: status.value === false ? null : "destructive",
                        children: status.label
                    });
            }
        case "date":
            return /*#__PURE__*/ jsx("div", {
                children: value ? formatDate(value, i18n.language) : ""
            });
        case "datetime":
            return /*#__PURE__*/ jsx("div", {
                children: value ? formatDateTime(value, i18n.language) : ""
            });
        case "number":
            return /*#__PURE__*/ jsx("div", {
                children: formatNumber(value, 1, "decimal", "standard", 0.001, i18n.language)
            });
        case "actions":
            return /*#__PURE__*/ jsx(DataTableRowActions, {
                row: row,
                column: column
            });
        case "image":
            var _row_getValue;
            if (!((_row_getValue = row.getValue("image")) === null || _row_getValue === void 0 ? void 0 : _row_getValue.url)) return null;
            return /*#__PURE__*/ jsx("img", {
                className: "aspect-ratio-1 size-16 rounded-sm object-contain",
                src: row.getValue("image").url,
                alt: row.getValue("name")
            });
        case "link":
            // eslint-disable-next-line no-case-declarations
            var url = row.getValue("details_url");
            if (!url) return /*#__PURE__*/ jsx("div", {
                children: value
            });
            return /*#__PURE__*/ jsx(Link, {
                to: url,
                children: /*#__PURE__*/ jsx("span", {
                    className: "underline",
                    children: value
                })
            });
        case "selection":
            return /*#__PURE__*/ jsx(Checkbox, {
                checked: selectedRows.some(function(r) {
                    return r.id === row.original.id;
                }),
                onCheckedChange: function(checkValue) {
                    return row.toggleSelected(!!checkValue);
                },
                "aria-label": "Select row"
            });
        case "select":
            return value;
        case "external_link":
            return /*#__PURE__*/ jsx("a", {
                href: value,
                target: "_blank",
                rel: "noreferrer",
                className: "underline text-primary flex items-center",
                children: /*#__PURE__*/ jsxs("span", {
                    children: [
                        /*#__PURE__*/ jsx(Trans, {
                            children: "Open"
                        }),
                        "\xa0",
                        column.columnDef.title
                    ]
                })
            });
        default:
            return null;
    }
};
var defaultDataTableFilterFn = function(row, id, filterValue) {
    return row.getValue(id).includes(filterValue);
};
var buildDataTableColumns = function(columnsConfig, filters, selectedRows) {
    if (!columnsConfig) return [];
    return columnsConfig.map(function(columnConfig) {
        return _object_spread_props$a(_object_spread$f({}, columnConfig), {
            header: function(param) {
                var column = param.column;
                return(// @ts-expect-error TS(2741) FIXME: Property 'className' is missing in type '{ column:... Remove this comment to see the full error message
                /*#__PURE__*/ jsx(DataTableColumnHeader, {
                    column: column,
                    title: columnConfig.title
                }));
            },
            cell: function(rest) {
                return renderDataTableCell(_object_spread_props$a(_object_spread$f({
                    filters: filters
                }, rest), {
                    selectedRows: selectedRows
                }));
            },
            filterFn: columnConfig.filterable ? defaultDataTableFilterFn : null
        });
    });
};
function SWRDataTable(param) {
    var fetchPath = param.fetchPath, _param_searchKey = param.searchKey, searchKey = _param_searchKey === void 0 ? undefined : _param_searchKey, _param_defaultParams = param.defaultParams, defaultParams = _param_defaultParams === void 0 ? {} : _param_defaultParams, _param_hasDetails = param.hasDetails, hasDetails = _param_hasDetails === void 0 ? false : _param_hasDetails, action = param.action, setSelectedData = param.setSelectedData, selectedRows = param.selectedRows;
    var _useSearchParams = _sliced_to_array$6(useSearchParams(), 1), searchParams = _useSearchParams[0];
    var initialSearch = _object_spread$f({}, formatParamsToDataTable(deserializeQuery(searchParams.toString()), searchKey), defaultParams);
    var _useSWRDataTable = useSWRDataTable(fetchPath, initialSearch), data = _useSWRDataTable.data, error = _useSWRDataTable.error, tableState = _useSWRDataTable.tableState, setTableState = _useSWRDataTable.setTableState;
    var buildColumns = function(tableColumns, tableFilters) {
        return buildDataTableColumns(tableColumns, tableFilters, selectedRows);
    };
    if (error) {
        return /*#__PURE__*/ jsx("div", {
            className: "flex items-center justify-between space-y-2",
            children: /*#__PURE__*/ jsxs("div", {
                children: [
                    /*#__PURE__*/ jsx(SectionTitle, {
                        children: /*#__PURE__*/ jsx(Trans, {
                            children: "Something went wrong!"
                        })
                    }),
                    /*#__PURE__*/ jsx("p", {
                        className: "text-muted-foreground",
                        children: error.message
                    })
                ]
            })
        });
    }
    return /*#__PURE__*/ jsx(DataTable, {
        data: data,
        error: error,
        tableState: tableState,
        setTableState: setTableState,
        // @ts-ignore
        buildTableColumns: buildColumns,
        setSelectedData: setSelectedData,
        setQueryToParams: true,
        children: /*#__PURE__*/ jsxs("div", {
            className: "space-y-4",
            children: [
                /*#__PURE__*/ jsx(DataTableToolbar, {
                    action: action
                }),
                /*#__PURE__*/ jsx("div", {
                    className: "rounded-md border dark:border-2",
                    children: /*#__PURE__*/ jsxs(Table, {
                        children: [
                            /*#__PURE__*/ jsx(DataTableHeader, {}),
                            /*#__PURE__*/ jsx(DataTableBody, {
                                hasDetails: hasDetails
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ jsx(DataTablePagination, {})
            ]
        })
    });
}

// https://github.com/atlassian/react-beautiful-dnd/issues/2350
// https://github.com/atlassian/react-beautiful-dnd/issues/2399#issuecomment-1175638194
function _array_like_to_array$7(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$5(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property$e(obj, key, value) {
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
function _iterable_to_array_limit$5(arr, i) {
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
function _non_iterable_rest$5() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread$e(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$e(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$9(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$9(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$9(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
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
function _sliced_to_array$5(arr, i) {
    return _array_with_holes$5(arr) || _iterable_to_array_limit$5(arr, i) || _unsupported_iterable_to_array$7(arr, i) || _non_iterable_rest$5();
}
function _unsupported_iterable_to_array$7(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$7(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$7(o, minLen);
}
var StrictModeDroppable = function(_param) {
    var children = _param.children, props = _object_without_properties$2(_param, [
        "children"
    ]);
    var _useState = _sliced_to_array$5(useState(false), 2), enabled = _useState[0], setEnabled = _useState[1];
    useEffect(function() {
        var animation = requestAnimationFrame(function() {
            return setEnabled(true);
        });
        return function() {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);
    if (!enabled) {
        return null;
    }
    // @ts-ignore
    return /*#__PURE__*/ jsx(Droppable, _object_spread_props$9(_object_spread$e({}, props), {
        children: children
    }));
};

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

function _define_property$d(obj, key, value) {
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
function _object_spread$d(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$d(target, key, source[key]);
        });
    }
    return target;
}
function withConditional(Component) {
    return function(props) {
        var form = props.form, field = props.field;
        var shouldRender = evaluateConditions(form, field === null || field === void 0 ? void 0 : field.conditions, field === null || field === void 0 ? void 0 : field.index);
        if (!shouldRender) return null;
        return /*#__PURE__*/ jsx(Component, _object_spread$d({}, props));
    };
}

function _define_property$c(obj, key, value) {
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
function _object_spread$c(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$c(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$8(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$8(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$8(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
// In case you want to use a custom component for a specific field type
// you can pass it as an argument to the buildForm function OR in the 'component' property of the field object.
// The 'component' property will take precedence over the customComponents argument.
// The customComponents argument will take precedence over the default fieldComponents.
// If you have a set of custom components that you want to use for all fields, you can implement a wrapper function around buildForm
// that has the customComponents argument pre-filled.
// e.g. const myBuildForm = (fields, form, index = 0) => buildForm(fields, form, index, LOCAL_COMPONENTS);
function buildForm(fields, form) {
    var index = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0, customComponents = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    var formElements = fields.map(function(field) {
        // @ts-ignore
        var FieldComponent = (field === null || field === void 0 ? void 0 : field.component) || _object_spread$c({}, fieldComponents, customComponents)[field.type];
        var shouldRender = evaluateConditions(form, field.conditions, index);
        if (!shouldRender) return null;
        if (!FieldComponent) {
            throw new Error("Invalid field type: ".concat(field.type));
        }
        var name = field.name.replace("RESOURCE_ID", String(index));
        return /*#__PURE__*/ jsx(FieldComponent, {
            field: _object_spread_props$8(_object_spread$c({}, field), {
                name: name,
                index: index
            }),
            form: form,
            customComponents: customComponents
        }, field.name + name + index);
    });
    return formElements.filter(function(element) {
        return element !== null;
    });
}
var parseFields = function(fields, index) {
    var updatedFields = fields.map(function(field) {
        if (field.type === "field_array") {
            return _object_spread_props$8(_object_spread$c({}, field), {
                name: field.name.replace("RESOURCE_ID", index),
                fields: field.fields.map(function(f) {
                    return _object_spread_props$8(_object_spread$c({}, f), {
                        name: f.name.replace("RESOURCE_ID", index)
                    });
                })
            });
        }
        return _object_spread_props$8(_object_spread$c({}, field), {
            name: field.name.replace("RESOURCE_ID", index)
        });
    });
    return updatedFields;
};

function _define_property$b(obj, key, value) {
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
function _object_spread$b(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$b(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$7(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$7(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$7(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
var fieldArrayVariants = cva("w-full", {
    variants: {
        layout: {
            stack: "flex flex-col justify-between items-start",
            inline: "flex flex-row justify-between items-center"
        },
        border: {
            none: "",
            normal: "border px-5 py-3 rounded-md shadow-sm"
        },
        gap: {
            small: "gap-1",
            medium: "gap-2",
            large: "gap-4"
        }
    },
    defaultVariants: {
        layout: "inline",
        border: "none",
        gap: "medium"
    }
});
var FieldArray = withConditional(function(param) {
    var form = param.form, field = param.field, customComponents = param.customComponents;
    var adjustFieldsLenghtToMaximum = function adjustFieldsLenghtToMaximum() {
        var _field_length;
        if ((field === null || field === void 0 ? void 0 : (_field_length = field.length) === null || _field_length === void 0 ? void 0 : _field_length.maximum) && fields.length > (field === null || field === void 0 ? void 0 : field.length.maximum)) {
            var newFields = fields.slice(0, field === null || field === void 0 ? void 0 : field.length.maximum);
            form.setValue(field.name, newFields);
        }
    };
    var adjustFieldsLenghtToMinimum = function adjustFieldsLenghtToMinimum() {
        var _field_length, _field_length1;
        if ((field === null || field === void 0 ? void 0 : (_field_length = field.length) === null || _field_length === void 0 ? void 0 : _field_length.minimum) && fields.length < (field === null || field === void 0 ? void 0 : (_field_length1 = field.length) === null || _field_length1 === void 0 ? void 0 : _field_length1.minimum)) {
            var emptyFields = new Array(field.length.minimum - fields.length).fill(field.defaultValues);
            append(emptyFields, {
                shouldFocus: false
            });
        }
    };
    var _field_length, _field_length1;
    var _useFieldArray = useFieldArray({
        control: form.control,
        name: field.name
    }), fields = _useFieldArray.fields, append = _useFieldArray.append, remove = _useFieldArray.remove, move = _useFieldArray.move;
    var updateFieldSequences = function() {
        if (!field.hasSequence) return;
        var updatedFields = form.getValues(field.name);
        updatedFields.forEach(function(item, index) {
            form.setValue("".concat(field.name, "[").concat(index, "].").concat(field.sequence_field || "sequence"), index);
        });
    };
    var handleDrag = function(param) {
        var source = param.source, destination = param.destination;
        if (!destination) return;
        move(source.index, destination.index);
        updateFieldSequences();
    };
    var handleAppend = function() {
        append(_object_spread$b({}, field.defaultValues), {
            shouldFocus: false
        });
        updateFieldSequences();
    };
    var handleRemove = function(index) {
        var fieldArray = form.getValues(field.name);
        var fieldToRemove = fieldArray[index];
        if (fieldToRemove.id) {
            var updatedField = _object_spread_props$7(_object_spread$b({}, fieldToRemove), {
                _destroy: true
            });
            var newFields = fieldArray.map(function(f, idx) {
                return idx === index ? updatedField : f;
            });
            form.setValue(field.name, newFields);
        } else {
            remove(index);
        }
    };
    useEffect(function() {
        adjustFieldsLenghtToMaximum();
        adjustFieldsLenghtToMinimum();
    }, [
        field === null || field === void 0 ? void 0 : field.length
    ]);
    if (!buildForm) {
        throw new Error("buildForm is required");
    }
    return /*#__PURE__*/ jsxs("div", {
        className: "w-full",
        children: [
            /*#__PURE__*/ jsx("div", {
                className: "mr-10",
                children: /*#__PURE__*/ jsx(DragDropContext, {
                    onDragEnd: handleDrag,
                    children: /*#__PURE__*/ jsx("ul", {
                        children: /*#__PURE__*/ jsx(StrictModeDroppable, {
                            droppableId: "".concat(field.name, "-items"),
                            children: function(provided) {
                                return /*#__PURE__*/ jsxs("div", _object_spread_props$7(_object_spread$b({}, provided.droppableProps), {
                                    ref: provided.innerRef,
                                    children: [
                                        fields.map(function(rhfField, index) {
                                            // @ts-expect-error
                                            // eslint-disable-next-line no-underscore-dangle
                                            if (rhfField._destroy) return null;
                                            return(// @ts-expect-error
                                            /*#__PURE__*/ jsx(Draggable, {
                                                draggableId: "item-".concat(index),
                                                index: index,
                                                children: function(innerProvided) {
                                                    return /*#__PURE__*/ jsx("li", _object_spread_props$7(_object_spread$b({
                                                        ref: innerProvided.innerRef
                                                    }, innerProvided.draggableProps), {
                                                        className: "mb-3",
                                                        children: /*#__PURE__*/ jsxs("div", {
                                                            className: cn(fieldArrayVariants(field.style)),
                                                            children: [
                                                                field.hasSequence && /*#__PURE__*/ jsx("div", _object_spread_props$7(_object_spread$b({
                                                                    className: "flex h-full w-6 flex-col justify-center"
                                                                }, innerProvided.dragHandleProps), {
                                                                    children: /*#__PURE__*/ jsx(MoveIcon, {
                                                                        className: "size-6 self-center"
                                                                    })
                                                                })),
                                                                buildForm(field.fields, form, Number(index), customComponents),
                                                                field.remove !== false && // eslint-disable-next-line jsx-a11y/control-has-associated-label
                                                                /*#__PURE__*/ jsx("button", {
                                                                    type: "button",
                                                                    "data-testid": "remove-button",
                                                                    onClick: function() {
                                                                        return handleRemove(Number(index));
                                                                    },
                                                                    className: "mt-4",
                                                                    children: /*#__PURE__*/ jsx(TrashIcon, {
                                                                        className: "size-6"
                                                                    })
                                                                })
                                                            ]
                                                        })
                                                    }));
                                                }
                                            }, "".concat(field.name, "[").concat(rhfField.id, "]")));
                                        }),
                                        provided.placeholder
                                    ]
                                }));
                            }
                        })
                    })
                })
            }),
            /*#__PURE__*/ jsxs(Button, {
                type: "button",
                onClick: handleAppend,
                className: "mt-3",
                disabled: (field === null || field === void 0 ? void 0 : (_field_length = field.length) === null || _field_length === void 0 ? void 0 : _field_length.maximum) !== undefined && fields.length >= (field === null || field === void 0 ? void 0 : (_field_length1 = field.length) === null || _field_length1 === void 0 ? void 0 : _field_length1.maximum),
                children: [
                    "Add ",
                    field.label
                ]
            })
        ]
    });
});

function isFieldDisabled(form, field) {
    return typeof field.disabled === "function" ? field.disabled(form.getValues()) : field.disabled;
}

var CheckboxField = withConditional(function(param) {
    var form = param.form, field = param.field;
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        render: function(param) {
            var formField = param.field;
            return /*#__PURE__*/ jsxs(FormItem, {
                className: "flex min-w-fit flex-row items-start space-x-3 space-y-0",
                children: [
                    /*#__PURE__*/ jsx("input", {
                        type: "hidden",
                        hidden: true,
                        name: field.name,
                        value: String(formField.value)
                    }),
                    /*#__PURE__*/ jsx(FormControl, {
                        children: /*#__PURE__*/ jsx(Checkbox, {
                            checked: formField.value,
                            onCheckedChange: formField.onChange,
                            disabled: isFieldDisabled(form, field)
                        })
                    }),
                    /*#__PURE__*/ jsxs("div", {
                        className: "space-y-1 leading-none",
                        children: [
                            /*#__PURE__*/ jsx(FormLabel, {
                                tooltip: field.tooltip,
                                children: field.label
                            }),
                            /*#__PURE__*/ jsx(FormDescription, {
                                children: field.description
                            })
                        ]
                    })
                ]
            });
        }
    });
});

function _define_property$a(obj, key, value) {
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
function _object_spread$a(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$a(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$6(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$6(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$6(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
var DatePickerInput = withConditional(function(param) {
    var form = param.form, field = param.field;
    var isDatetime = field.type === "datetime";
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        rules: field.required ? {
            required: true
        } : undefined,
        defaultValue: field.defaultValue,
        render: function(param) {
            var formField = param.field;
            return /*#__PURE__*/ jsxs(FormItem, {
                className: "flex flex-col",
                children: [
                    /*#__PURE__*/ jsx(FormLabel, {
                        tooltip: field.tooltip,
                        children: field.label
                    }),
                    /*#__PURE__*/ jsxs(Popover, {
                        children: [
                            /*#__PURE__*/ jsx(PopoverTrigger, {
                                asChild: true,
                                children: /*#__PURE__*/ jsx(FormControl, {
                                    children: /*#__PURE__*/ jsxs(Button, {
                                        variant: "outline",
                                        className: cn("w-[240px] pl-3 text-left font-normal", !formField.value && "text-muted-foreground"),
                                        children: [
                                            formField.value ? format(new Date(formField.value), isDatetime ? "PPp" : "PP") : /*#__PURE__*/ jsx("span", {
                                                children: /*#__PURE__*/ jsx(Trans, {
                                                    children: "Pick a date"
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(CalendarIcon, {
                                                className: "ml-auto size-4 opacity-50"
                                            })
                                        ]
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(PopoverContent, {
                                className: "w-auto p-0",
                                align: "start",
                                children: /*#__PURE__*/ jsx(Calendar, {
                                    mode: "single",
                                    selected: formField.value,
                                    onSelect: formField.onChange,
                                    withTime: isDatetime,
                                    initialFocus: true
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(FormDescription, {
                        children: field.description
                    }),
                    /*#__PURE__*/ jsx(FormMessage, {}),
                    /*#__PURE__*/ jsx("input", _object_spread_props$6(_object_spread$a({
                        hidden: true
                    }, formField), {
                        value: formField.value
                    }))
                ]
            });
        }
    });
});

function _define_property$9(obj, key, value) {
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
function _object_spread$9(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$9(target, key, source[key]);
        });
    }
    return target;
}
var HiddenField = withConditional(function(param) {
    var form = param.form, field = param.field;
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        defaultValue: field.value,
        render: function(param) {
            var formField = param.field;
            return /*#__PURE__*/ jsx(FormItem, {
                children: /*#__PURE__*/ jsx("input", _object_spread$9({
                    type: "hidden"
                }, formField))
            });
        }
    });
});

function _array_like_to_array$6(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$4(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property$8(obj, key, value) {
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
function _iterable_to_array_limit$4(arr, i) {
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
function _non_iterable_rest$4() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread$8(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$8(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$5(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$5(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$5(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _sliced_to_array$4(arr, i) {
    return _array_with_holes$4(arr) || _iterable_to_array_limit$4(arr, i) || _unsupported_iterable_to_array$6(arr, i) || _non_iterable_rest$4();
}
function _unsupported_iterable_to_array$6(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$6(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$6(o, minLen);
}
var imageUploadVariants = cva("w-full", {
    variants: {
        size: {
            small: "size-24 p-0 max-w-24",
            medium: "size-48 p-0 max-w-48",
            large: "size-80 p-0 max-w-80"
        }
    },
    defaultVariants: {
        size: "medium"
    }
});
var initialState = {
    imagePreview: "",
    contentUploaded: false,
    downloadUrl: "",
    filename: ""
};
function fileReducer(state, action) {
    switch(action.type){
        case "SET_FILE":
            return _object_spread_props$5(_object_spread$8({}, state), {
                contentUploaded: true,
                downloadUrl: action.downloadUrl,
                filename: action.filename,
                imagePreview: action.mode === "image" ? action.downloadUrl : ""
            });
        case "REMOVE_FILE":
            return _object_spread$8({}, initialState);
        default:
            throw new Error();
    }
}
var FileUploadField = withConditional(function(param) {
    var form = param.form, field = param.field;
    var _useReducer = _sliced_to_array$4(useReducer(fileReducer, initialState), 2), state = _useReducer[0], dispatch = _useReducer[1];
    var hiddenFileInput = React__default.useRef(null);
    useEffect(function() {
        var value = form.getValues(field.name);
        if (!value) return;
        dispatch({
            type: "SET_FILE",
            downloadUrl: value,
            filename: value,
            mode: field.mode || "image"
        });
    }, []);
    var onUpload = useCallback(function(event) {
        var _event_target_files;
        if (!((_event_target_files = event.target.files) === null || _event_target_files === void 0 ? void 0 : _event_target_files.length)) return;
        var file = event.target.files[0];
        form.setValue(field.name, file);
        var fileUrl = URL.createObjectURL(file);
        dispatch({
            type: "SET_FILE",
            downloadUrl: fileUrl,
            filename: file.name,
            mode: field.mode || "image"
        });
    }, []);
    var handleClick = function() {
        if (hiddenFileInput.current) hiddenFileInput.current.click();
    };
    var handleRemoveContent = function(event) {
        event.stopPropagation();
        form.setValue(field.name, null);
        dispatch({
            type: "REMOVE_FILE"
        });
    };
    var handleDownload = function() {
        var link = document.createElement("a");
        link.href = state.downloadUrl;
        link.download = state.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    var accept = field.accept || (field.mode === "file" ? "*" : "image/*");
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        rules: field.required ? {
            required: true
        } : undefined,
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
                    /*#__PURE__*/ jsx(FormControl, {
                        children: /*#__PURE__*/ jsxs("div", {
                            className: "flex flex-col gap-0 items-start",
                            children: [
                                /*#__PURE__*/ jsxs("div", {
                                    className: cn("relative border-2 rounded-lg overflow-hidden border-dashed", state.imagePreview ? "inline-block cursor-pointer bg-cover" : "w-full flex-col items-center", imageUploadVariants(field.style)),
                                    children: [
                                        state.contentUploaded && /*#__PURE__*/ jsx("button", {
                                            type: "button",
                                            className: "absolute top-0 right-0 m-1 z-50",
                                            onClick: handleRemoveContent,
                                            "aria-label": "Remove File",
                                            children: /*#__PURE__*/ jsx(Cross1Icon, {
                                                className: "text-2xl font-semibold"
                                            })
                                        }),
                                        /*#__PURE__*/ jsx("button", {
                                            type: "button",
                                            className: cn("w-full h-full flex items-center justify-center relative", imageUploadVariants(field.style), state.contentUploaded ? "rounded-sm p-0" : ""),
                                            onClick: handleClick,
                                            children: state.contentUploaded ? /*#__PURE__*/ jsxs(Fragment, {
                                                children: [
                                                    state.imagePreview ? /*#__PURE__*/ jsx("img", {
                                                        src: state.imagePreview,
                                                        alt: "preview",
                                                        className: "object-contain size-full rounded-sm"
                                                    }) : /*#__PURE__*/ jsx("span", {
                                                        className: "absolute inset-0 flex items-center justify-center truncate",
                                                        children: state.filename
                                                    }),
                                                    /*#__PURE__*/ jsx("div", {
                                                        className: "hover:ring-primary absolute inset-0 flex items-center justify-center rounded-sm bg-black/50 opacity-0 transition-opacity hover:opacity-100 hover:ring-2 hover:ring-offset-2",
                                                        children: /*#__PURE__*/ jsx("span", {
                                                            className: "text-lg font-semibold text-white",
                                                            children: /*#__PURE__*/ jsx(Trans, {
                                                                children: "Click to Upload"
                                                            })
                                                        })
                                                    })
                                                ]
                                            }) : /*#__PURE__*/ jsx("span", {
                                                className: "text-lg font-semibold",
                                                children: /*#__PURE__*/ jsx(Trans, {
                                                    children: "Upload a file"
                                                })
                                            })
                                        }),
                                        /*#__PURE__*/ jsx("input", {
                                            type: "file",
                                            onChange: onUpload,
                                            accept: accept,
                                            name: formField.name,
                                            ref: hiddenFileInput,
                                            style: {
                                                display: "none"
                                            }
                                        })
                                    ]
                                }),
                                field.download && state.contentUploaded && /*#__PURE__*/ jsx("button", {
                                    type: "button",
                                    onClick: handleDownload,
                                    className: "text-blue-600 hover:text-blue-800",
                                    children: /*#__PURE__*/ jsx(Trans, {
                                        children: "Download"
                                    })
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsx(FormMessage, {})
                ]
            });
        }
    });
});

function _define_property$7(obj, key, value) {
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
function _object_spread$7(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$7(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$4(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$4(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$4(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
var InputField = withConditional(function(param) {
    var form = param.form, field = param.field;
    var _field_length, _field_length1;
    var validator = field.mode === "number" ? z.coerce.number() : z.string();
    validator.min(((_field_length = field.length) === null || _field_length === void 0 ? void 0 : _field_length.minimum) || 0).max(((_field_length1 = field.length) === null || _field_length1 === void 0 ? void 0 : _field_length1.maximum) || Infinity);
    var numberInputOnWheelPreventChange = function(e) {
        e.target.blur();
        e.stopPropagation();
    };
    var disabled = typeof field.disabled === "function" ? field.disabled(form.getValues()) : field.disabled;
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        rules: field.required ? {
            required: true,
            validate: function(value) {
                var _field_length, _field_length1;
                return validator.safeParse(value).success || "The value must be between ".concat((_field_length = field.length) === null || _field_length === void 0 ? void 0 : _field_length.minimum, " and ").concat((_field_length1 = field.length) === null || _field_length1 === void 0 ? void 0 : _field_length1.maximum, " long.");
            }
        } : undefined,
        defaultValue: field.defaultValue,
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
                    /*#__PURE__*/ jsx(FormControl, {
                        children: /*#__PURE__*/ jsx(Input, _object_spread_props$4(_object_spread$7({
                            placeholder: field.placeholder
                        }, formField), {
                            disabled: disabled,
                            type: field.mode,
                            onWheel: function(event) {
                                return field.mode === "number" && numberInputOnWheelPreventChange(event);
                            }
                        }))
                    }),
                    /*#__PURE__*/ jsx(FormMessage, {})
                ]
            });
        }
    });
});

function _array_like_to_array$5(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_without_holes$2(arr) {
    if (Array.isArray(arr)) return _array_like_to_array$5(arr);
}
function _iterable_to_array$2(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _non_iterable_spread$2() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _to_consumable_array$2(arr) {
    return _array_without_holes$2(arr) || _iterable_to_array$2(arr) || _unsupported_iterable_to_array$5(arr) || _non_iterable_spread$2();
}
function _unsupported_iterable_to_array$5(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$5(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$5(o, minLen);
}
var MultiSelectCheckboxes = withConditional(function(param) {
    var form = param.form, field = param.field;
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        rules: field.required ? {
            required: true
        } : undefined,
        render: function() {
            var _field_options;
            return /*#__PURE__*/ jsxs(FormItem, {
                children: [
                    /*#__PURE__*/ jsxs("div", {
                        className: "mb-4",
                        children: [
                            /*#__PURE__*/ jsx(FormLabel, {
                                className: "text-base",
                                tooltip: field.tooltip,
                                children: field.label
                            }),
                            /*#__PURE__*/ jsx(FormDescription, {
                                children: field.description
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx("div", {
                        className: "h-20 overflow-y-auto",
                        children: (_field_options = field.options) === null || _field_options === void 0 ? void 0 : _field_options.map(function(item) {
                            return /*#__PURE__*/ jsx(FormField, {
                                control: form.control,
                                name: field.name,
                                defaultValue: [],
                                render: function(param) {
                                    var formField = param.field;
                                    var _formField_value;
                                    return /*#__PURE__*/ jsxs(FormItem, {
                                        className: "flex flex-row items-start space-x-3 space-y-0",
                                        children: [
                                            /*#__PURE__*/ jsx(FormControl, {
                                                children: /*#__PURE__*/ jsx(Checkbox, {
                                                    checked: (_formField_value = formField.value) === null || _formField_value === void 0 ? void 0 : _formField_value.map(String).includes(item.value),
                                                    onCheckedChange: function(checked) {
                                                        var _formField_value;
                                                        return checked ? formField.onChange(_to_consumable_array$2(formField.value).concat([
                                                            item.value
                                                        ])) : formField.onChange((_formField_value = formField.value) === null || _formField_value === void 0 ? void 0 : _formField_value.filter(function(value) {
                                                            return String(value) !== String(item.value);
                                                        }));
                                                    }
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(FormLabel, {
                                                className: "font-normal",
                                                tooltip: item.tooltip,
                                                children: item.label
                                            })
                                        ]
                                    }, item.value);
                                }
                            }, item.value);
                        })
                    }),
                    /*#__PURE__*/ jsx(FormMessage, {})
                ]
            });
        }
    });
});

var radioGroupVariants = cva("w-full", {
    variants: {
        layout: {
            stack: "flex flex-col justify-between items-start",
            inline: "flex flex-row justify-start items-center space-x-4"
        },
        gap: {
            small: "gap-1",
            medium: "gap-2",
            large: "gap-4"
        }
    },
    defaultVariants: {
        layout: "inline",
        gap: "medium"
    }
});
var RadioGroupWithoutSection = function(param) {
    var form = param.form, field = param.field;
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        rules: field.required ? {
            required: true
        } : {},
        render: function(param) {
            var rcfField = param.field;
            return /*#__PURE__*/ jsxs(FormItem, {
                className: "space-y-0 w-full",
                children: [
                    /*#__PURE__*/ jsx(FormLabel, {
                        tooltip: field.tooltip,
                        children: field.label
                    }),
                    /*#__PURE__*/ jsx(FormDescription, {
                        children: field.description
                    }),
                    /*#__PURE__*/ jsx(FormControl, {
                        children: /*#__PURE__*/ jsx(RadioGroup, {
                            value: rcfField.value,
                            className: cn(radioGroupVariants(field), "py-2"),
                            children: field.options.map(function(option) {
                                return /*#__PURE__*/ jsxs(FormItem, {
                                    className: "flex items-center space-x-1 space-y-0",
                                    children: [
                                        /*#__PURE__*/ jsx(FormControl, {
                                            onClick: function() {
                                                rcfField.onChange(rcfField.value === option.value ? null : option.value);
                                            },
                                            children: /*#__PURE__*/ jsx(RadioGroupItem, {
                                                value: option.value
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(FormLabel, {
                                            className: "font-normal",
                                            tooltip: option.tooltip,
                                            children: option.label
                                        })
                                    ]
                                }, option.value);
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(FormMessage, {})
                ]
            });
        }
    });
};
var RadioGroupField = withConditional(function(param) {
    var form = param.form, field = param.field;
    var _field_sections;
    var hasSections = ((_field_sections = field.sections) === null || _field_sections === void 0 ? void 0 : _field_sections.length) > 0;
    if (!hasSections) return /*#__PURE__*/ jsx(RadioGroupWithoutSection, {
        form: form,
        field: field
    });
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        rules: field.required ? {
            required: true
        } : undefined,
        render: function(param) {
            var formField = param.field;
            return /*#__PURE__*/ jsxs(FormItem, {
                className: "space-y-0",
                children: [
                    /*#__PURE__*/ jsx(FormLabel, {
                        tooltip: field.tooltip,
                        children: field.label
                    }),
                    /*#__PURE__*/ jsx(FormDescription, {
                        children: field.description
                    }),
                    /*#__PURE__*/ jsx(FormControl, {
                        children: /*#__PURE__*/ jsx(RadioGroup, {
                            onValueChange: formField.onChange,
                            defaultValue: formField.value,
                            className: "py-2",
                            children: /*#__PURE__*/ jsx("div", {
                                className: "grid grid-cols-2 gap-4",
                                children: field.sections.map(function(section) {
                                    return /*#__PURE__*/ jsxs("div", {
                                        className: "space-y-2",
                                        children: [
                                            /*#__PURE__*/ jsx(Label, {
                                                children: section.label
                                            }),
                                            /*#__PURE__*/ jsx("p", {
                                                className: "text-muted-foreground text-sm",
                                                children: section.description
                                            }),
                                            /*#__PURE__*/ jsx("div", {
                                                className: "flex flex-col gap-1 rounded-md border-red-800 p-2",
                                                children: section.options.map(function(option) {
                                                    return /*#__PURE__*/ jsxs(FormItem, {
                                                        className: "flex items-center space-x-3 space-y-0",
                                                        children: [
                                                            /*#__PURE__*/ jsx(FormControl, {
                                                                children: /*#__PURE__*/ jsx(RadioGroupItem, {
                                                                    value: option.value
                                                                })
                                                            }),
                                                            /*#__PURE__*/ jsx(FormLabel, {
                                                                className: "font-normal",
                                                                tooltip: option.tooltip,
                                                                children: option.label
                                                            })
                                                        ]
                                                    }, option.value);
                                                })
                                            })
                                        ]
                                    }, section.label);
                                })
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(FormMessage, {})
                ]
            });
        }
    });
});

function _array_like_to_array$4(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$3(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property$6(obj, key, value) {
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
function _iterable_to_array_limit$3(arr, i) {
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
function _non_iterable_rest$3() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread$6(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$6(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$3(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$3(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$3(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _sliced_to_array$3(arr, i) {
    return _array_with_holes$3(arr) || _iterable_to_array_limit$3(arr, i) || _unsupported_iterable_to_array$4(arr, i) || _non_iterable_rest$3();
}
function _unsupported_iterable_to_array$4(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$4(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$4(o, minLen);
}
function hexToBrightness(hexColor) {
    // ensure the hex color is valid and in the proper format
    if (!hexColor || hexColor.length !== 7 || hexColor[0] !== "#") {
        return 120;
    }
    // extract the RGB components from the hex color
    var r = parseInt(hexColor.substr(1, 2), 16);
    var g = parseInt(hexColor.substr(3, 2), 16);
    var b = parseInt(hexColor.substr(5, 2), 16);
    // calculate luminance
    var luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance;
}
var colorPickerVariants = cva("w-full", {
    variants: {
        size: {
            small: "w-64 max-w-64",
            full: "w-full"
        }
    },
    defaultVariants: {
        size: "small"
    }
});
var ColorPickerField = withConditional(function(param) {
    var form = param.form, field = param.field;
    var _React_useState = _sliced_to_array$3(React__default.useState(form.watch(field.name) || undefined), 2), color = _React_useState[0], setColor = _React_useState[1];
    var _React_useState1 = _sliced_to_array$3(React__default.useState(""), 2), contentColor = _React_useState1[0], setContentColor = _React_useState1[1];
    useEffect(function() {
        if (!field.set_content) return;
        var contentValue = hexToBrightness(form.watch(field.name)) > 128 ? "#000000" : "#FFFFFF";
        setContentColor(contentValue);
    }, [
        form.watch(field.name)
    ]);
    var handleColorChange = function(content) {
        setColor(content);
        form.setValue(field.name, content);
    };
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(FormField, {
                control: form.control,
                name: field.name,
                defaultValue: color,
                render: function(param) {
                    var formField = param.field;
                    var _formField_value, _formField_value1;
                    return /*#__PURE__*/ jsxs(FormItem, {
                        className: "grid grid-flow-row auto-rows-min content-end w-full",
                        children: [
                            /*#__PURE__*/ jsx(FormLabel, {
                                tooltip: field.tooltip,
                                children: field.label
                            }),
                            /*#__PURE__*/ jsx(FormDescription, {
                                children: field.description
                            }),
                            /*#__PURE__*/ jsxs("div", {
                                className: cn("bg-background ring-offset-background placeholder:text-muted-foreground focus-within:ring-ring flex h-10 items-center rounded-md border text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", colorPickerVariants(field.style)),
                                children: [
                                    color && /*#__PURE__*/ jsx("span", {
                                        className: "ml-3",
                                        children: "#"
                                    }),
                                    /*#__PURE__*/ jsx("input", {
                                        type: "text",
                                        className: "p-2 mx-0 flex-1 border-0 border-transparent bg-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium focus:border-transparent focus:ring-0",
                                        defaultValue: formField.value ? formField.value.slice(1) : undefined,
                                        placeholder: "Choose a color",
                                        onChange: function(e) {
                                            return handleColorChange("#".concat(e.target.value));
                                        },
                                        value: color ? color.slice(1) : undefined
                                    }),
                                    /*#__PURE__*/ jsxs(Popover, {
                                        children: [
                                            /*#__PURE__*/ jsx(PopoverTrigger, {
                                                asChild: true,
                                                children: /*#__PURE__*/ jsx("div", {
                                                    className: "mr-2 size-7 rounded-full border shadow-lg",
                                                    style: {
                                                        background: (_formField_value = formField.value) !== null && _formField_value !== void 0 ? _formField_value : "#aabbcc"
                                                    }
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(PopoverContent, {
                                                className: "m-0 w-fit p-0",
                                                children: /*#__PURE__*/ jsx(HexAlphaColorPicker, {
                                                    color: (_formField_value1 = formField.value) !== null && _formField_value1 !== void 0 ? _formField_value1 : "#aabbcc",
                                                    onChange: handleColorChange
                                                })
                                            })
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsx("input", _object_spread_props$3(_object_spread$6({
                                hidden: true
                            }, formField), {
                                value: formField.value
                            })),
                            /*#__PURE__*/ jsx(FormMessage, {})
                        ]
                    });
                }
            }),
            field.set_content && /*#__PURE__*/ jsx(FormField, {
                control: form.control,
                name: field.color_content_key,
                defaultValue: contentColor,
                render: function(param) {
                    var formField = param.field;
                    return /*#__PURE__*/ jsx(FormControl, {
                        children: /*#__PURE__*/ jsx("input", _object_spread_props$3(_object_spread$6({
                            type: "hidden"
                        }, formField), {
                            value: contentColor
                        }))
                    });
                }
            })
        ]
    });
});

function _array_like_to_array$3(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$2(arr) {
    if (Array.isArray(arr)) return arr;
}
function _array_without_holes$1(arr) {
    if (Array.isArray(arr)) return _array_like_to_array$3(arr);
}
function _define_property$5(obj, key, value) {
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
function _iterable_to_array$1(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _iterable_to_array_limit$2(arr, i) {
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
function _non_iterable_rest$2() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _non_iterable_spread$1() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread$5(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$5(target, key, source[key]);
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
function _sliced_to_array$2(arr, i) {
    return _array_with_holes$2(arr) || _iterable_to_array_limit$2(arr, i) || _unsupported_iterable_to_array$3(arr, i) || _non_iterable_rest$2();
}
function _to_consumable_array$1(arr) {
    return _array_without_holes$1(arr) || _iterable_to_array$1(arr) || _unsupported_iterable_to_array$3(arr) || _non_iterable_spread$1();
}
function _unsupported_iterable_to_array$3(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$3(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$3(o, minLen);
}
var SubItem = function(_param) {
    var tags = _param.tags, onSelect = _param.onSelect, props = _object_without_properties$1(_param, [
        "tags",
        "onSelect"
    ]);
    var search = useCommandState(function(state) {
        return state.search;
    });
    if (!search) return null;
    var tagExists = tags.some(function(tag) {
        return tag.value === search;
    });
    if (tagExists) return null;
    return /*#__PURE__*/ jsx(CommandItem, _object_spread_props$2(_object_spread$5({
        onSelect: function() {
            return onSelect({
                tag: search
            });
        }
    }, props), {
        children: search
    }));
};
var MultiSelect = withConditional(function(param) {
    var form = param.form, field = param.field;
    var _React_useState = _sliced_to_array$2(React__default.useState(field.options || []), 2), options = _React_useState[0], setOptions = _React_useState[1];
    var selection = form.watch(field.name) || [];
    var addNewTag = function(param) {
        var tag = param.tag;
        setOptions(function(state) {
            return _to_consumable_array$1(state).concat([
                {
                    label: tag,
                    value: tag
                }
            ]);
        });
        form.setValue(field.name, _to_consumable_array$1(selection).concat([
            tag
        ]));
    };
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        rules: field.required ? {
            required: true
        } : undefined,
        render: function(param) {
            var formField = param.field;
            var formFieldValue = Array.isArray(formField.value) ? formField.value : [];
            return /*#__PURE__*/ jsxs(FormItem, {
                className: "flex min-w-[6rem] flex-col",
                children: [
                    /*#__PURE__*/ jsx(FormLabel, {
                        tooltip: field.tooltip,
                        children: field.label
                    }),
                    /*#__PURE__*/ jsxs(Popover, {
                        children: [
                            /*#__PURE__*/ jsx(PopoverTrigger, {
                                asChild: true,
                                children: /*#__PURE__*/ jsx(FormControl, {
                                    children: /*#__PURE__*/ jsxs(Button, {
                                        variant: "outline",
                                        size: "sm",
                                        className: "my-4 border-dashed dark:border-2",
                                        children: [
                                            /*#__PURE__*/ jsx(PlusCircledIcon, {
                                                className: "mr-2 size-4"
                                            }),
                                            (selection === null || selection === void 0 ? void 0 : selection.length) > 0 && /*#__PURE__*/ jsxs(Fragment, {
                                                children: [
                                                    /*#__PURE__*/ jsx(Separator, {
                                                        orientation: "vertical",
                                                        className: "mx-2 h-4"
                                                    }),
                                                    /*#__PURE__*/ jsx(Badge, {
                                                        color: "secondary",
                                                        className: cn("rounded-sm px-1 font-normal", {
                                                            hidden: selection.length <= 3
                                                        }),
                                                        children: selection.length
                                                    }),
                                                    /*#__PURE__*/ jsx("div", {
                                                        className: cn("space-x-1 flex", {
                                                            hidden: selection.length > 3,
                                                            flex: selection.length <= 3
                                                        }),
                                                        children: options === null || options === void 0 ? void 0 : options.filter(function(option) {
                                                            var _formField_value;
                                                            return (_formField_value = formField.value) === null || _formField_value === void 0 ? void 0 : _formField_value.includes(option.value);
                                                        }).map(function(option) {
                                                            return /*#__PURE__*/ jsx(Badge, {
                                                                color: "secondary",
                                                                className: "rounded-sm px-1 font-normal max-w-[200px] truncate overflow-hidden whitespace-nowrap",
                                                                children: option.label
                                                            }, option.value);
                                                        })
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(PopoverContent, {
                                className: "max-w-[500px] p-0",
                                children: /*#__PURE__*/ jsxs(Command, {
                                    children: [
                                        /*#__PURE__*/ jsx(CommandInput, {
                                            placeholder: field.placeholder
                                        }),
                                        /*#__PURE__*/ jsxs(CommandList, {
                                            children: [
                                                options === null || options === void 0 ? void 0 : options.map(function(option) {
                                                    var isSelected = formFieldValue.includes(option.value);
                                                    return /*#__PURE__*/ jsxs(CommandItem, {
                                                        onSelect: function() {
                                                            if (isSelected) {
                                                                var newValue = formFieldValue.filter(function(value) {
                                                                    return value !== option.value;
                                                                });
                                                                form.setValue(field.name, newValue);
                                                            } else {
                                                                form.setValue(field.name, _to_consumable_array$1(formFieldValue).concat([
                                                                    option.value
                                                                ]));
                                                            }
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ jsx("div", {
                                                                className: cn("border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"),
                                                                children: /*#__PURE__*/ jsx(CheckIcon, {
                                                                    className: cn("h-4 w-4")
                                                                })
                                                            }),
                                                            /*#__PURE__*/ jsx("span", {
                                                                children: option.label
                                                            })
                                                        ]
                                                    }, option.value);
                                                }),
                                                /*#__PURE__*/ jsx(SubItem, {
                                                    tags: options,
                                                    onSelect: addNewTag
                                                })
                                            ]
                                        })
                                    ]
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(FormDescription, {
                        children: field.description
                    }),
                    /*#__PURE__*/ jsx(FormMessage, {})
                ]
            });
        }
    });
});

var RadiusSelect = withConditional(function(param) {
    var form = param.form, field = param.field;
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        rules: field.required ? {
            required: true
        } : undefined,
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
                    /*#__PURE__*/ jsx("div", {
                        className: "flex items-center space-x-2 bg-background",
                        children: /*#__PURE__*/ jsx("div", {
                            className: "grid grid-cols-5 gap-2",
                            children: field.options.map(function(option) {
                                return /*#__PURE__*/ jsxs("div", {
                                    className: "flex flex-col text-center text-foreground gap-2 text-sm justify-end",
                                    children: [
                                        /*#__PURE__*/ jsx("div", {
                                            className: "flex p-3 border rounded-md hover:border-foreground/80 ".concat(formField.value === option.value ? "border-foreground/80 border-2" : "border-foreground/20", " cursor-pointer"),
                                            onClick: function() {
                                                return formField.onChange(option.value);
                                            },
                                            children: /*#__PURE__*/ jsx("div", {
                                                className: "grow size-8 flex items-center justify-center bg-blue-500 ".concat(option.classes)
                                            })
                                        }),
                                        option.label
                                    ]
                                }, option.value);
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(FormMessage, {})
                ]
            });
        }
    });
});

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
var SearchableSelectField = withConditional(function(param) {
    var form = param.form, field = param.field;
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        render: function(param) {
            var formField = param.field;
            var _field_options_find, _field_options, _field_options1;
            return /*#__PURE__*/ jsxs(FormItem, {
                className: "flex flex-col",
                children: [
                    /*#__PURE__*/ jsx("input", _object_spread_props$1(_object_spread$4({
                        hidden: true
                    }, formField), {
                        value: formField.value
                    })),
                    /*#__PURE__*/ jsx(FormLabel, {
                        tooltip: field.tooltip,
                        children: field.label
                    }),
                    /*#__PURE__*/ jsx(FormDescription, {
                        children: field.description
                    }),
                    /*#__PURE__*/ jsxs(Popover, {
                        children: [
                            /*#__PURE__*/ jsx(PopoverTrigger, {
                                asChild: true,
                                children: /*#__PURE__*/ jsx(FormControl, {
                                    children: /*#__PURE__*/ jsxs(Button, {
                                        variant: "outline",
                                        role: "combobox",
                                        className: cn("w-[200px] justify-between", !formField.value && "text-muted-foreground"),
                                        children: [
                                            formField.value ? (_field_options = field.options) === null || _field_options === void 0 ? void 0 : (_field_options_find = _field_options.find(function(option) {
                                                return option.value === formField.value;
                                            })) === null || _field_options_find === void 0 ? void 0 : _field_options_find.label : "Select an option",
                                            /*#__PURE__*/ jsx(CaretSortIcon, {
                                                className: "ml-2 size-4 shrink-0 opacity-50"
                                            })
                                        ]
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(PopoverContent, {
                                className: "w-[200px] p-0",
                                children: /*#__PURE__*/ jsxs(Command, {
                                    children: [
                                        /*#__PURE__*/ jsx(CommandInput, {
                                            placeholder: "Search options..."
                                        }),
                                        /*#__PURE__*/ jsxs(CommandList, {
                                            children: [
                                                /*#__PURE__*/ jsx(CommandEmpty, {
                                                    children: "No options found."
                                                }),
                                                /*#__PURE__*/ jsx(CommandGroup, {
                                                    className: "max-h-80 overflow-y-auto",
                                                    children: (_field_options1 = field.options) === null || _field_options1 === void 0 ? void 0 : _field_options1.map(function(option) {
                                                        return /*#__PURE__*/ jsxs(CommandItem, {
                                                            value: option.label,
                                                            onSelect: function() {
                                                                form.setValue(field.name, option.value);
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ jsx(CheckIcon, {
                                                                    className: cn("mr-2 h-4 w-4", option.value === formField.value ? "opacity-100" : "opacity-0")
                                                                }),
                                                                option.label
                                                            ]
                                                        }, option.value);
                                                    })
                                                })
                                            ]
                                        })
                                    ]
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(FormMessage, {})
                ]
            });
        }
    });
});

var SelectField = withConditional(function(param) {
    var form = param.form, field = param.field;
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        rules: field.required ? {
            required: true
        } : undefined,
        render: function(param) {
            var formField = param.field;
            var _field_options;
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
                    /*#__PURE__*/ jsxs(SelectRoot, {
                        onValueChange: formField.onChange,
                        value: String(formField.value),
                        name: field.name,
                        disabled: isFieldDisabled(form, field),
                        children: [
                            /*#__PURE__*/ jsx(FormControl, {
                                children: /*#__PURE__*/ jsx(SelectTrigger, {
                                    className: "h-10 w-full rounded-md border dark:border-2 shadow-none",
                                    children: /*#__PURE__*/ jsx(SelectValue, {
                                        placeholder: field.placeholder
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(SelectContent, {
                                className: "z-[10000]",
                                children: (_field_options = field.options) === null || _field_options === void 0 ? void 0 : _field_options.map(function(option) {
                                    return /*#__PURE__*/ jsx(SelectItem, {
                                        value: String(option.value),
                                        children: option.label
                                    }, String(option.value));
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(FormMessage, {})
                ]
            });
        }
    });
});

var SwitchField = withConditional(function(param) {
    var form = param.form, field = param.field;
    var disabled = typeof field.disabled === "function" ? field.disabled(form.getValues()) : field.disabled;
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        render: function(param) {
            var formField = param.field;
            return /*#__PURE__*/ jsxs(FormItem, {
                children: [
                    /*#__PURE__*/ jsx("input", {
                        type: "hidden",
                        name: field.name,
                        value: String(formField.value)
                    }),
                    /*#__PURE__*/ jsxs("div", {
                        className: "space-y-1 leading-none",
                        children: [
                            /*#__PURE__*/ jsx(FormLabel, {
                                tooltip: field.tooltip,
                                children: field.label
                            }),
                            /*#__PURE__*/ jsx(FormDescription, {
                                children: field.description
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(FormControl, {
                        children: /*#__PURE__*/ jsx(Switch, {
                            disabled: disabled || false,
                            checked: formField.value,
                            onCheckedChange: formField.onChange
                        })
                    })
                ]
            });
        }
    });
});

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
var TextAreaField = withConditional(function(param) {
    var form = param.form, field = param.field;
    var _field_length, _field_length1;
    var stringSchema = z.string().min(((_field_length = field.length) === null || _field_length === void 0 ? void 0 : _field_length.minimum) || 0).max(((_field_length1 = field.length) === null || _field_length1 === void 0 ? void 0 : _field_length1.maximum) || Infinity);
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        rules: field.required ? {
            required: true,
            validate: function(value) {
                var _field_length, _field_length1;
                return stringSchema.safeParse(value).success || "The value must be between ".concat((_field_length = field.length) === null || _field_length === void 0 ? void 0 : _field_length.minimum, " and ").concat((_field_length1 = field.length) === null || _field_length1 === void 0 ? void 0 : _field_length1.maximum, " long.");
            }
        } : undefined,
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
                    /*#__PURE__*/ jsx(FormControl, {
                        children: /*#__PURE__*/ jsx(Textarea, _object_spread$3({
                            disabled: isFieldDisabled(form, field),
                            placeholder: field.placeholder,
                            className: "resize-none"
                        }, formField))
                    }),
                    /*#__PURE__*/ jsx(FormMessage, {})
                ]
            });
        }
    });
});

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
var DelegateField = withConditional(function(param) {
    var form = param.form, field = param.field;
    var delegateKey = field.delegateKey.replace("RESOURCE_ID", String(field.index));
    useEffect(function() {
        var delegated = field.options.find(function(option) {
            return option.value === form.watch(delegateKey);
        });
        form.setValue(field.name, delegated === null || delegated === void 0 ? void 0 : delegated.delegateValue);
    }, [
        form.watch(delegateKey)
    ]);
    return /*#__PURE__*/ jsx(FormField, {
        control: form.control,
        name: field.name,
        defaultValue: field.value,
        render: function(param) {
            var formField = param.field;
            return /*#__PURE__*/ jsx(FormControl, {
                children: /*#__PURE__*/ jsx("input", _object_spread$2({
                    type: "hidden"
                }, formField))
            });
        }
    });
});

var JoditEditor = /*#__PURE__*/ lazy(function() {
    return import('./JoditEditor-DZb87-D1.js');
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
                    /*#__PURE__*/ jsx("input", _object_spread_props(_object_spread$1({
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

var fieldComponents = {
    input: InputField,
    checkbox: CheckboxField,
    radio_item: RadioGroupField,
    textarea: TextAreaField,
    date: DatePickerInput,
    datetime: DatePickerInput,
    file: FileUploadField,
    switch: SwitchField,
    select: SelectField,
    multi_select: MultiSelect,
    field_array: FieldArray,
    hidden: HiddenField,
    wysiwyg: RichTextEditorField,
    multi_select_checkbox: MultiSelectCheckboxes,
    color_picker: ColorPickerField,
    searchable_select: SearchableSelectField,
    radius_select: RadiusSelect,
    delegate: DelegateField
};

/* eslint-disable no-shadow */ function _array_like_to_array$2(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes$1(arr) {
    if (Array.isArray(arr)) return arr;
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
function _iterable_to_array_limit$1(arr, i) {
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
function _non_iterable_rest$1() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
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
function _sliced_to_array$1(arr, i) {
    return _array_with_holes$1(arr) || _iterable_to_array_limit$1(arr, i) || _unsupported_iterable_to_array$2(arr, i) || _non_iterable_rest$1();
}
function _unsupported_iterable_to_array$2(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$2(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$2(o, minLen);
}
var OtpInput = function(_param) {
    var _param_value = _param.value, value = _param_value === void 0 ? "" : _param_value, _param_numInputs = _param.numInputs, numInputs = _param_numInputs === void 0 ? 6 : _param_numInputs, onOtpChange = _param.onOtpChange, _param_type = _param.type, type = _param_type === void 0 ? "text" : _param_type, _param_placeholder = _param.placeholder, placeholder = _param_placeholder === void 0 ? "_" : _param_placeholder, _param_pattern = _param.pattern, pattern = _param_pattern === void 0 ? "[0-9]" : _param_pattern, _param_autoFocus = _param.autoFocus, autoFocus = _param_autoFocus === void 0 ? true : _param_autoFocus, className = _param.className, id = _param.id, name = _param.name, rest = _object_without_properties(_param, [
        "value",
        "numInputs",
        "onOtpChange",
        "type",
        "placeholder",
        "pattern",
        "autoFocus",
        "className",
        "id",
        "name"
    ]);
    var _React_useState = _sliced_to_array$1(React.useState(value), 2), otpValue = _React_useState[0], setOTPValue = _React_useState[1];
    var _React_useState1 = _sliced_to_array$1(React.useState(0), 2), activeInput = _React_useState1[0], setActiveInput = _React_useState1[1];
    var inputRefs = React.useRef([]);
    var getOTPValue = function() {
        return otpValue ? otpValue.toString().split("") : [];
    };
    var isInputNum = type === "number" || type === "tel";
    React.useEffect(function() {
        inputRefs.current = inputRefs.current.slice(0, numInputs);
    }, [
        numInputs
    ]);
    React.useEffect(function() {
        if (autoFocus) {
            var _inputRefs_current_;
            (_inputRefs_current_ = inputRefs.current[0]) === null || _inputRefs_current_ === void 0 ? void 0 : _inputRefs_current_.focus();
        }
    }, [
        autoFocus
    ]);
    var isInputValueValid = function(value) {
        var isTypeValid = isInputNum ? !Number.isNaN(Number(value)) : typeof value === "string";
        return isTypeValid && value.trim().length === 1;
    };
    var handleChange = function(event) {
        var value = event.target.value;
        if (isInputValueValid(value)) {
            changeCodeAtFocus(value);
            focusInput(activeInput + 1);
        }
    };
    var handleFocus = function(event) {
        return function(index) {
            setActiveInput(index);
            event.target.select();
        };
    };
    var handleBlur = function() {
        setActiveInput(activeInput - 1);
    };
    var handleKeyDown = function(event) {
        var otp = getOTPValue();
        if ([
            event.code,
            event.key
        ].includes("Backspace")) {
            event.preventDefault();
            changeCodeAtFocus("");
            focusInput(activeInput - 1);
        } else if (event.code === "Delete") {
            event.preventDefault();
            changeCodeAtFocus("");
        } else if (event.code === "ArrowLeft") {
            event.preventDefault();
            focusInput(activeInput - 1);
        } else if (event.code === "ArrowRight") {
            event.preventDefault();
            focusInput(activeInput + 1);
        } else if (event.key === otp[activeInput]) {
            event.preventDefault();
            focusInput(activeInput + 1);
        } else if (event.code === "Spacebar" || event.code === "Space" || event.code === "ArrowUp" || event.code === "ArrowDown") {
            event.preventDefault();
        } else if (isInputNum && !isInputValueValid(event.key)) {
            event.preventDefault();
        }
    };
    var focusInput = function(index) {
        var activeInput = Math.max(Math.min(numInputs - 1, index), 0);
        if (inputRefs.current[activeInput]) {
            var _inputRefs_current_activeInput, _inputRefs_current_activeInput1;
            (_inputRefs_current_activeInput = inputRefs.current[activeInput]) === null || _inputRefs_current_activeInput === void 0 ? void 0 : _inputRefs_current_activeInput.focus();
            (_inputRefs_current_activeInput1 = inputRefs.current[activeInput]) === null || _inputRefs_current_activeInput1 === void 0 ? void 0 : _inputRefs_current_activeInput1.select();
            setActiveInput(activeInput);
        }
    };
    var changeCodeAtFocus = function(value) {
        var otp = getOTPValue();
        // eslint-disable-next-line prefer-destructuring
        otp[activeInput] = value[0];
        handleOTPChange(otp);
    };
    var handleOTPChange = function(otp) {
        var otpValue = otp.join("");
        setOTPValue(otpValue);
        onOtpChange === null || onOtpChange === void 0 ? void 0 : onOtpChange(otpValue);
    };
    var handlePaste = function(event) {
        event.preventDefault();
        var otp = getOTPValue();
        var nextActiveInput = activeInput;
        // Get pastedData in an array of max size (num of inputs - current position)
        var pastedData = event.clipboardData.getData("text/plain").slice(0, numInputs - activeInput).split("");
        // Prevent pasting if the clipboard data contains non-numeric values for number inputs
        if (isInputNum && pastedData.some(function(value) {
            return Number.isNaN(Number(value));
        })) {
            return;
        }
        // Paste data from focused input onwards
        for(var pos = 0; pos < numInputs; ++pos){
            if (pos >= activeInput && pastedData.length > 0) {
                var _pastedData_shift;
                otp[pos] = (_pastedData_shift = pastedData.shift()) !== null && _pastedData_shift !== void 0 ? _pastedData_shift : "";
                nextActiveInput++;
            }
        }
        focusInput(nextActiveInput);
        handleOTPChange(otp);
    };
    return /*#__PURE__*/ jsxs("div", {
        className: "flex gap-2",
        children: [
            Array.from({
                length: numInputs
            }, function(_, index) {
                return index;
            }).map(function(i) {
                var _getOTPValue_i;
                return /*#__PURE__*/ jsx(Input, _object_spread({
                    id: "".concat(id, "-").concat(i),
                    name: "".concat(name, "-").concat(i),
                    value: (_getOTPValue_i = getOTPValue()[i]) !== null && _getOTPValue_i !== void 0 ? _getOTPValue_i : "",
                    placeholder: placeholder,
                    ref: function(element) {
                        inputRefs.current[i] = element;
                    },
                    onChange: handleChange,
                    onFocus: function(event) {
                        return handleFocus(event)(i);
                    },
                    onBlur: handleBlur,
                    onKeyDown: handleKeyDown,
                    onPaste: handlePaste,
                    autoComplete: "off",
                    maxLength: 1,
                    size: 1,
                    className: cn("text-center font-bold", className),
                    pattern: pattern
                }, rest), i);
            }),
            /*#__PURE__*/ jsx("input", {
                type: "hidden",
                id: id,
                name: name,
                value: otpValue
            })
        ]
    });
};

function CardSkeleton(param) {
    var _param_className = param.className, className = _param_className === void 0 ? "" : _param_className;
    return /*#__PURE__*/ jsxs(Card, {
        className: cn("bg-background", className),
        children: [
            /*#__PURE__*/ jsxs(CardHeader, {
                children: [
                    /*#__PURE__*/ jsx(CardTitle, {
                        children: /*#__PURE__*/ jsx(Skeleton, {
                            className: "h-2.5 w-3/4"
                        })
                    }),
                    /*#__PURE__*/ jsx(Skeleton, {
                        className: "h-2 w-1/2"
                    })
                ]
            }),
            /*#__PURE__*/ jsxs(CardContent, {
                children: [
                    /*#__PURE__*/ jsx(Skeleton, {
                        className: "h-2 w-full mb-2"
                    }),
                    /*#__PURE__*/ jsx(Skeleton, {
                        className: "h-2 w-[85%] mb-2"
                    }),
                    /*#__PURE__*/ jsx(Skeleton, {
                        className: "h-2 w-[90%]"
                    })
                ]
            }),
            /*#__PURE__*/ jsx(CardDescription, {
                children: /*#__PURE__*/ jsx(Skeleton, {
                    className: "h-10 w-full"
                })
            }),
            /*#__PURE__*/ jsxs(CardFooter, {
                children: [
                    /*#__PURE__*/ jsx(Skeleton, {
                        className: "h-3 w-20"
                    }),
                    /*#__PURE__*/ jsx(Skeleton, {
                        className: "h-3 w-20 ml-4"
                    })
                ]
            })
        ]
    });
}

function BarSet() {
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Skeleton, {
                className: "h-48 w-10"
            }),
            /*#__PURE__*/ jsx(Skeleton, {
                className: "h-64 w-10"
            }),
            /*#__PURE__*/ jsx(Skeleton, {
                className: "h-56 w-10"
            }),
            /*#__PURE__*/ jsx(Skeleton, {
                className: "h-64 w-10"
            })
        ]
    });
}
function ChartSkeleton(param) {
    var _param_barsSetCount = param.barsSetCount, barsSetCount = _param_barsSetCount === void 0 ? 3 : _param_barsSetCount, _param_className = param.className, className = _param_className === void 0 ? "" : _param_className;
    var barSet = new Array(barsSetCount).fill(null);
    return /*#__PURE__*/ jsx("div", {
        className: "".concat(className, " p-4"),
        children: /*#__PURE__*/ jsx("div", {
            className: "flex flex-col items-center",
            children: /*#__PURE__*/ jsxs("div", {
                className: "flex items-end space-x-2",
                children: [
                    /*#__PURE__*/ jsx("span", {
                        className: "sr-only",
                        children: /*#__PURE__*/ jsx(Trans, {
                            children: "Loading"
                        })
                    }),
                    barSet.map(function(_, barIndex) {
                        return(// eslint-disable-next-line react/no-array-index-key
                        /*#__PURE__*/ jsx(BarSet, {}, barIndex));
                    })
                ]
            })
        })
    });
}

function KpiSkeleton() {
    return /*#__PURE__*/ jsxs(KpiCard, {
        children: [
            /*#__PURE__*/ jsxs(KpiCard.Header, {
                children: [
                    /*#__PURE__*/ jsx(KpiCard.Title, {
                        children: /*#__PURE__*/ jsx(Skeleton, {
                            className: "h-3.5 w-[100px]"
                        })
                    }),
                    /*#__PURE__*/ jsx(Skeleton, {
                        className: "h-3.5 w-[100px]"
                    })
                ]
            }),
            /*#__PURE__*/ jsx(KpiCard.Content, {
                className: "text-3xl",
                children: /*#__PURE__*/ jsx(Skeleton, {
                    className: "h-3.5 w-[100px]"
                })
            }),
            /*#__PURE__*/ jsx(KpiCard.FooterNote, {
                children: /*#__PURE__*/ jsx(Skeleton, {
                    className: "h-3.5 w-[100px]"
                })
            })
        ]
    });
}

function TableSkeleton(param) {
    var _param_rowsCount = param.rowsCount, rowsCount = _param_rowsCount === void 0 ? 4 : _param_rowsCount, _param_columnsCount = param.columnsCount, columnsCount = _param_columnsCount === void 0 ? 4 : _param_columnsCount, _param_className = param.className, className = _param_className === void 0 ? "" : _param_className;
    var columns = new Array(columnsCount).fill(null);
    var rows = new Array(rowsCount).fill(null);
    return /*#__PURE__*/ jsx("div", {
        className: className,
        children: /*#__PURE__*/ jsxs(Table, {
            children: [
                /*#__PURE__*/ jsx(TableHeader, {
                    children: /*#__PURE__*/ jsx(TableRow, {
                        children: columns.map(function(_, columnIndex) {
                            return /*#__PURE__*/ jsx(TableHead, {
                                className: columnIndex === columnsCount - 1 ? "text-right" : "",
                                children: /*#__PURE__*/ jsx(Skeleton, {
                                    className: "h-3.5 w-[100px]"
                                })
                            }, columnIndex);
                        })
                    })
                }),
                /*#__PURE__*/ jsx(TableBody, {
                    children: rows.map(function(_, rowIndex) {
                        return /*#__PURE__*/ jsx(TableRow, {
                            children: columns.map(function(v, columnIndex) {
                                return /*#__PURE__*/ jsx(TableCell, {
                                    className: columnIndex === columnsCount - 1 ? "text-right" : "",
                                    children: /*#__PURE__*/ jsx(Skeleton, {
                                        className: "h-8 w-20"
                                    })
                                }, columnIndex);
                            })
                        }, rowIndex);
                    })
                })
            ]
        })
    });
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

var lodash_debounce = debounce;

var debounce$1 = /*@__PURE__*/getDefaultExportFromCjs(lodash_debounce);

function useUnmount(func) {
    var funcRef = useRef(func);
    funcRef.current = func;
    useEffect(function() {
        return function() {
            funcRef.current();
        };
    }, []);
}

function _array_like_to_array$1(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_without_holes(arr) {
    if (Array.isArray(arr)) return _array_like_to_array$1(arr);
}
function _iterable_to_array(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _non_iterable_spread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _to_consumable_array(arr) {
    return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array$1(arr) || _non_iterable_spread();
}
function _unsupported_iterable_to_array$1(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$1(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$1(o, minLen);
}
function useDebounceCallback(func) {
    var delay = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 500, options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var debouncedFunc = useRef();
    useUnmount(function() {
        if (debouncedFunc.current) {
            debouncedFunc.current.cancel();
        }
    });
    var debounced = useMemo(function() {
        var debouncedFuncInstance = debounce$1(func, delay, options);
        var wrappedFunc = function() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            return debouncedFuncInstance.apply(void 0, _to_consumable_array(args));
        };
        wrappedFunc.cancel = function() {
            debouncedFuncInstance.cancel();
        };
        wrappedFunc.isPending = function() {
            return !!debouncedFunc.current;
        };
        wrappedFunc.flush = function() {
            return debouncedFuncInstance.flush();
        };
        return wrappedFunc;
    }, [
        func,
        delay,
        options
    ]);
    // Update the debounced function ref whenever func, wait, or options change
    useEffect(function() {
        debouncedFunc.current = debounce$1(func, delay, options);
    }, [
        func,
        delay,
        options
    ]);
    return debounced;
}

function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
}
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
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
function useDebounceValue(initialValue, delay, options) {
    var _options_equalityFn;
    var eq = (_options_equalityFn = options === null || options === void 0 ? void 0 : options.equalityFn) !== null && _options_equalityFn !== void 0 ? _options_equalityFn : function(left, right) {
        return left === right;
    };
    var unwrappedInitialValue = _instanceof(initialValue, Function) ? initialValue() : initialValue;
    var _useState = _sliced_to_array(useState(unwrappedInitialValue), 2), debouncedValue = _useState[0], setDebouncedValue = _useState[1];
    var previousValueRef = useRef(unwrappedInitialValue);
    var updateDebouncedValue = useDebounceCallback(setDebouncedValue, delay, options);
    // Update the debounced value if the initial value changes
    if (!eq(previousValueRef.current, unwrappedInitialValue)) {
        updateDebouncedValue(unwrappedInitialValue);
        previousValueRef.current = unwrappedInitialValue;
    }
    return [
        debouncedValue,
        updateDebouncedValue
    ];
}

var Loading$1 = "Loading...";
var Reset$1 = "Reset";
var Search$1 = "Search...";
var View$1 = "View";
var Cancel$1 = "Cancel";
var Confirm$1 = "Confirm";
var Open$1 = "Open";
var Download$1 = "Download";
var Light$1 = "Light";
var Dark$1 = "Dark";
var Beta$1 = "Beta";
var en = {
	"Search results": "Search results",
	Loading: Loading$1,
	"No results found": "No results found",
	"Type a command or search": "Type a command or search",
	"Global search": "Global search",
	"Copied to clipboard": "Copied to clipboard",
	"Clear filters": "Clear filters",
	Reset: Reset$1,
	"Items per page": "Items per page",
	"Page {{currentPage}} of": "Page {{currentPage}} of",
	Search: Search$1,
	View: View$1,
	"Toggle columns": "Toggle columns",
	"Are you sure?": "Are you sure?",
	"This action cannot be undone": "This action cannot be undone.",
	Cancel: Cancel$1,
	Confirm: Confirm$1,
	Open: Open$1,
	"Something went wrong!": "Something went wrong!",
	"Pick a date": "Pick a date",
	"Click to Upload": "Click to Upload",
	"Upload a file": "Upload a file",
	Download: Download$1,
	"Start writing": "Start writing...",
	"Toggle theme": "Toggle theme",
	Light: Light$1,
	Dark: Dark$1,
	Beta: Beta$1
};

var Loading = "Carregando...";
var Reset = "Remover";
var Search = "Pesquise por palavra chave...";
var View = "Visualizar";
var Cancel = "Cancelar";
var Confirm = "Confirmar";
var Open = "Abrir";
var Download = "Baixar";
var Light = "Claro";
var Dark = "Escuro";
var Beta = "Beta";
var ptBR = {
	"Search results": "Resultados da busca",
	Loading: Loading,
	"No results found": "Nenhum resultado foi encontrado",
	"Type a command or search": "Digite um comando ou pesquise",
	"Global search": "Busca global",
	"Copied to clipboard": "Copiado para a área de transferência",
	"Clear filters": "Limpar filtros",
	Reset: Reset,
	"Items per page": "Itens por página",
	"Page {{currentPage}} of": "Página {{currentPage}} de",
	Search: Search,
	View: View,
	"Toggle columns": "Alternar colunas",
	"Are you sure?": "Você tem certeza?",
	"This action cannot be undone.": "Esta ação não pode ser desfeita.",
	Cancel: Cancel,
	Confirm: Confirm,
	Open: Open,
	"Something went wrong!": "Algo deu errado!",
	"Pick a date": "Escolha uma data",
	"Click to Upload": "Clique para fazer upload",
	"Upload a file": "Faça upload do arquivo",
	Download: Download,
	"Start writing": "Comece a escrever...",
	"Toggle theme": "Alternar tema",
	Light: Light,
	Dark: Dark,
	Beta: Beta
};

// all English translations are keys in the en.json file
// but they don't have any value because we are using the keys as the values
// this is useful to know what keys are available in the translation file
// and to avoid typos. but we nede to parse them to an object with the same keys
// but with the values as the keys to use them in the i18n object
var enParsed = Object.keys(en).reduce(function(acc, key) {
    acc[key] = key;
    return acc;
}, {});
var defaultNS = "translation";
var resources = {
    en: {
        translation: enParsed
    },
    "pt-BR": {
        translation: ptBR
    }
};
i18n$1.use(initReactI18next).init({
    resources: resources,
    lng: "pt-BR",
    defaultNS: defaultNS,
    interpolation: {
        escapeValue: false
    }
});

var i18n = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: i18n$1,
  defaultNS: defaultNS,
  resources: resources
});

export { ActionForm, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger, Avatar, AvatarFallback, AvatarImage, Badge, Button, Calendar, Card, CardContent, CardDescription, CardFooter, CardHeader, CardSkeleton, CardTitle, Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, ChartSkeleton, Checkbox, CheckboxField, ClickToCopy, Collapsible, CollapsibleContent, CollapsibleTrigger, ColorPickerField, Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandMenu, CommandSeparator, CommandShortcut, Counter, DataTable, DataTableBody, DataTableColumnHeader, DataTableFacetedFilter, DataTableFilters, DataTableHeader, DataTablePagination, DataTableRowActions, DataTableSearch, DataTableToolbar, DataTableViewOptions, DatePickerInput, DelegateField, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DynamicActionComponent, FieldArray, FileUploadField, Form, FormControl, FormDescription, FormField, FormFieldProvider, FormItem, FormItemProvider, FormLabel, FormMessage, HiddenField, Input, InputField, KpiCard, KpiSkeleton, Label, ModeToggle, MultiSelect, MultiSelectCheckboxes, OtpInput, Pagination, Popover, PopoverAnchor, PopoverContent, PopoverTrigger, Progress, RadioGroup, RadioGroupField, RadioGroupItem, RadiusSelect, RailsAppContext, RailsAppProvider, SWRDataTable, SearchableSelectField, SectionTitle, Select, SelectField, SelectInput, Separator, Skeleton, Spinner, StrictModeDroppable, SubmitButton, Switch, SwitchField, Table, TableBody, TableCaption, TableCell, TableContext, TableFooter, TableHead, TableHeader, TableRow, TableSkeleton, TabsContent, TabsList, TabsRoot, TabsTrigger, TaggablePopover, TextAreaField, Textarea, ThemeProvider, Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, Toaster, Tooltip, TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger, badgeVariants, buildDataTableColumns, buildForm, buttonVariants, camelToSnake, capitalize, cn, convertStringToNumberAndRoundDown, defaultDataTableFilterFn, deserializeQuery, epochToDate, fieldComponents, formatDate, formatDateTime, formatDateToLocalDatetime, formatNumber, formatParamsToDataTable, formatRequestParams$1 as formatRequestParams, i18n, loadCSRFFromMetaTag, numberToPercent, parseFields, percentToNumber, reducer, renderDataTableCell, serializeQuery, toast, toastViewPortVariants, useDebounceCallback, useDebounceValue, useFormField, useFormFieldState, useFormFieldUpdater, useRailsApp, useSWRDataTable, useTableContext, useTableState, useTheme, useToast, useUnmount, withConditional };
