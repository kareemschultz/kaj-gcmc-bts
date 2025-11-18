"use strict";
/**
 * Security Utilities Package
 *
 * Comprehensive security utilities for the KAJ-GCMC BTS Platform
 * Implements OWASP security best practices and enterprise-grade security controls
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Export existing modules
__exportStar(require("./encryption"), exports);
__exportStar(require("./input-validation"), exports);
__exportStar(require("./rbac-guard"), exports);
__exportStar(require("./sql-injection-prevention"), exports);
__exportStar(require("./tenant-isolation"), exports);
__exportStar(require("./xss-protection"), exports);
__exportStar(require("./api-security"), exports);
