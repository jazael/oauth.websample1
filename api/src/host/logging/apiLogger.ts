import {NextFunction, Request, Response} from 'express';
import winston from 'winston';
import {ServerError} from '../../logic/errors/serverError';
import {LogEntry} from './logEntry';

/*
 * A simple Winston logger that writes JSON logs
 */
export class ApiLogger {

    private _logger: any = null;

    /*
     * Create a Winston logger that writes prettified JSON output for developers
     */
    public constructor() {

        const prettyPrintFormatter = winston.format.combine(
            winston.format.printf((logEntry: any) => {
                return JSON.stringify(logEntry.message, null, 2);
            }));

        const consoleOptions = {
            format: prettyPrintFormatter,
        };

        const transport = new winston.transports.Console(consoleOptions);
        this._logger = winston.createLogger({
            transports: [
                transport,
            ],
        });

        this._setupCallbacks();
    }

    /*
     * Report startup errors in the standard format
     */
    public startupError(error: ServerError): void {

        const logEntry = new LogEntry();
        logEntry.setError(error);
        this._logger.error(logEntry.toOutputFormat());
    }

    /*
     * Log each request, including any error information, using JSON output
     */
    public logRequest(request: Request, response: Response, next: NextFunction): void {

        const logEntry = new LogEntry();
        logEntry.start(request);
        response.locals.logEntry = logEntry;

        response.on('finish', () => {

            logEntry.end(response);

            if (logEntry.hasError()) {
                this._logger.error(logEntry.toOutputFormat());
            } else {
                this._logger.info(logEntry.toOutputFormat());
            }
        });

        next();
    }

    /*
     * Ensure that the this parameter is available in the above callback
     */
    private _setupCallbacks() {
        this.logRequest = this.logRequest.bind(this);
    }
}
