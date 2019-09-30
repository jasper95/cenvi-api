import { createLogger, transports, format } from 'winston'
import morgan from 'morgan'

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.splat(),
    format.simple(),
    format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [new transports.Console()]
})

export const requestLogger = morgan('combined', {
  stream: {
    write: message => logger.info(message)
  }
})

export default logger
