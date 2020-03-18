/* eslint-disable @typescript-eslint/no-explicit-any */
import path = require('path');
import util = require('util');
import {createLogger, format, transports} from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');

const fileFormFormat = format.printf(({level, message, timestamp}) => {
  return `${timestamp.slice(0, -2)} ${level} ${message}`;
});

const consoleFormFormat = format.printf(({level, message, timestamp}) => {
  return `${timestamp} ${level} ${message}`;
});

const timestampFormat = format.timestamp({format: 'MM-DD HH:mm:ss.SSSZZ'});

const splatFormat = format((info, opts) => {
  opts = {colors: false, compact: true, ...opts};
  const splat = (info as any)[Symbol.for('splat')] || info.splat;
  // console.log(splat);
  // const regex = /^(([^:]*):)(([^:%]*):?)(?= %o)/;
  // if (regex.test(info.message)) {
  // info.message = info.message.slice(0, -2) + '\n' + '%o';
  // console.log(process.env.COMPACT_ENV);
  // }
  if (process.env.COMPACT_ENV) opts.compact = false;
  if (splat && splat.length > 0) {
    info.message = util.formatWithOptions(
      {
        colors: opts.colors,
        compact: opts.compact,
        depth: null,
        showHidden: false,
        sorted: true,
        breakLength: opts.compact ? Infinity : 80,
      },
      info.message,
      ...splat,
    );
  }
  return info;
});

const errorTransport = new transports.File({
  level: 'error',
  dirname: path.join(__dirname, '../../private/log'),
  filename: 'error.log',
  format: format.combine(timestampFormat, format.splat(), fileFormFormat),
});

const infoTransport = new DailyRotateFile({
  level: 'info',
  dirname: path.join(__dirname, '../../private/log'),
  filename: 'info-%DATE%.log',
  datePattern: 'MM-DD',
  maxFiles: '14d',
  format: format.combine(timestampFormat, format.splat(), fileFormFormat),
});

const devTransport = new transports.Console({
  level: 'debug',
  format: format.combine(
    format.timestamp({format: 'HH:mm:ss.SSS'}),
    format.colorize(),
    splatFormat({colors: true}),
    consoleFormFormat,
  ),
});

const logger = createLogger();

if (process.env.NODE_ENV === 'production') {
  logger.add(errorTransport);
  logger.add(infoTransport);
} else {
  logger.add(devTransport);
}

export namespace Log {
  export const i = function(tag: string, message: any, ...meta: any[]) {
    if (typeof message === 'object') {
      logger.info(`${tag}: %o`, message);
    } else {
      logger.info(`${tag}: ${message}`, ...meta);
    }
  };
  export const e = function(tag: string, message: any, ...meta: any[]) {
    if (typeof message === 'object') {
      logger.error(`${tag}: %o`, message);
    } else {
      logger.error(`${tag}: ${message}`, ...meta);
    }
  };
  export const d = function(tag: string, message: any, ...meta: any[]) {
    if (typeof message === 'object') {
      logger.debug(`${tag}: %o`, message);
    } else {
      logger.debug(`${tag}: ${message}`, ...meta);
    }
  };
}
