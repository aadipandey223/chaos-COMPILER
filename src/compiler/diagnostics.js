export class DiagnosticManager {
    constructor() {
        this.diagnostics = [];
    }

    emit(id, context, severity, params) {
        const diagnostic = {
            id,
            context,
            severity,
            params,
            timestamp: new Date().toISOString()
        };
        this.diagnostics.push(diagnostic);
        return diagnostic;
    }

    getDiagnostics() {
        return this.diagnostics;
    }

    clear() {
        this.diagnostics = [];
    }
}

export const diagnostics = new DiagnosticManager();
