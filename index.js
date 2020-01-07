const Log = require('bunyan');
const _ = require('underscore');

const CLUSTER_DEF_SYSTEM_ID = "11111111-1111-1111-1111-111111111111";
const js2xmlparser = require("js2xmlparser");

const legal_log_levels = {
    trace: Log.TRACE,
    debug: Log.DEBUG,
    info: Log.INFO,
    warn: Log.WARN,
    error: Log.ERROR,
    fatal: Log.FATAL
};

function isStdStream(stream) {
    if (!stream) {
        return false;
    }

    if ('fd' in stream && (stream.fd === 1 /* stdout */ || stream.fd === 2 /* stderr */ )) {
        return true;
    }

    return false;
}
// See documentation on bunyan streams here: https://www.npmjs.com/package/bunyan#streams

function MyStream(stream) {
    this.stream = stream;
    this.logLimitBytes = -1;

    if (isStdStream(stream)) {
        // std is limitted to 64 KBytes (65536 bytes) by bufio maximum buffer size
        // see 'MaxScanTokenSize’ in https://golang.org/pkg/bufio/#Scanner.Buffer
        // Limit our logger to 60 KBytes
        this.logLimitBytes = 60 * 1024;
    }
}

MyStream.prototype.write = function (logStr) {
    // string.length returns the number of characters in the string.
    // we need to ansure the number of bytes in the string.

    let logIt = false;
    let logBuf;
    let logLenBytes;
    let logLenChars = logStr.length;
    
    if (this.logLimitBytes === -1) {
        logIt = true;
    }
    else if ((logLenChars * 4) <= this.logLimitBytes) {
        // maximum number of bytes a single character can take is 4
        logIt = true;
    }
    else {
        // need to calculate the actuall number of bytes in the string
        logBuf = Buffer.from(logStr);
        logLenBytes = logBuf.length;
        if (logLenBytes <= this.logLimitBytes) {
            logIt = true;
        }
    }

    if (logIt === true) {
        this.stream.write(logStr);
        return;
    }

    try {
        // write a 'raw' log to stderr

        // convert the original log from json to xml, so elasticsearcg will not fail to parse it (because we truncate it which yields a broken JSON)
        // note: angle brackets (“<” and “>”) will show up as u003c and u003e

        let logJson = JSON.parse(logStr);
        let xmlParseOptions = { 
            declaration : {
                include : false
            },
            // format: 
            // { 
            //     indent : " ", 
            //     newline: " " 
            // } 
        }
        let logXml = js2xmlparser.parse("TruncatedLog", logJson, xmlParseOptions);
        let truncatedLogXml = logXml.substring(0, 1024);
        let newMsg = `**** LOG TRUNCATED. ORIGINAL MESSAGE LENGTH ${logLenBytes} BYTES (${logLenChars} CHARACTERS) **** : ${truncatedLogXml}`

        let newLogJson = {
            level: 60,  // fatal
            hostname: logJson.hostname,
            logType: logJson.logType,
            logSystemID: logJson.logSystemID,
            name: logJson.name,
            pid: logJson.pid,
            v: logJson.v,
            time: logJson.time,
            msg: newMsg
        }

        let newLogStr = JSON.stringify(newLogJson);
        newLogStr += "\n"; // without the end-line, stderr will not flush it!
        process.stderr.write(newLogStr);
    }
    catch (err) {
        process.stderr.write(`Failed handling too long log message: ${err.message}\n`);
    }
}

const makeLowLogger = (options) => {
    "use strict";
    const opt = options || {};

    const loggerOptions = {
        name: opt.name || 'defaultLogger',
        streams: []
    }
    
    if (!options.stream && !options.streams) {
        loggerOptions.streams.push ({
            level: checkLevelExists(opt.level) || Log.INFO,
            type: 'stream',
            stream: new MyStream(process.stdout)
        })
    }
    else if (options.stream) {
        loggerOptions.streams.push ({
            level: checkLevelExists(opt.level) || Log.INFO,
            type: options.stream.type === 'raw' ? 'raw' : 'stream',
            stream: new MyStream(options.stream)
        })
    }
    else {    
        for (let stream of options.streams) {
            loggerOptions.streams.push ({
                level: checkLevelExists(opt.level) || Log.INFO,
                type: options.stream.type === 'raw' ? 'raw' : 'stream',
                stream: new MyStream(stream)
            })
        }
    }
  
    const log = Log.createLogger(loggerOptions);

    if (opt.child) {
        return log.child(opt.child);
    }

    return log;
};

const makeHighLogger = (options) => {
    "use strict";
    const opt = options || {};

    const loggerOptions = {
        name: opt.name || 'defaultLogger',
        streams: []
    }
    
    if (!options.stream && !options.streams) {
        loggerOptions.streams.push ({
            level: checkLevelExists(opt.level) || Log.ERROR,
            type: 'stream',
            stream: new MyStream(process.stderr)
        })
    }
    else if (options.stream) {
        loggerOptions.streams.push ({
            level: checkLevelExists(opt.level) || Log.ERROR,
            type: options.stream.type === 'raw' ? 'raw' : 'stream',
            stream: new MyStream(options.stream)
        })
    }
    else {    
        for (let stream of options.streams) {
            loggerOptions.streams.push ({
                level: checkLevelExists(opt.level) || Log.ERROR,
                type: options.stream.type === 'raw' ? 'raw' : 'stream',
                stream: new MyStream(stream)
            })
        }
    }
  
    const log = Log.createLogger(loggerOptions);

    if (opt.child) {
        return log.child(opt.child);
    }

    return log;
};

function GenericLoggerManager(options) {
    "use strict";
    this.options = options || {};
    this.lowLogger = makeLowLogger(this.options);
    this.highLogger = makeHighLogger(this.options);

    this.info = (params) => {
        this.lowLogger.info.apply(this.lowLogger, params);
    };

    this.trace = (params) => {
        this.lowLogger.trace.apply(this.lowLogger, params);
    };

    this.fatal = (params) => {
        this.highLogger.fatal.apply(this.highLogger, params);
    };

    this.error = (params) => {
        this.highLogger.error.apply(this.highLogger, params);
    };

    this.debug = (params) => {
        this.lowLogger.debug.apply(this.lowLogger, params);
    };

    this.warn = (params) => {
        this.lowLogger.warn.apply(this.lowLogger, params);
    };
};

function FlowLoggerManager(options)  {
    "use strict";
    this.flowOptions = options || {};
    this.flowOptions.child = {
      logType: 'flow',
      logSystemID: process.env.CLUSTER_SYSTEM_ID || CLUSTER_DEF_SYSTEM_ID
    };
    this.generalManager = new GenericLoggerManager(this.flowOptions);

    this.info = (...args) => {
        this.generalManager.info(args);
    };

    this.trace = (...args) => {
        this.generalManager.trace(args);
    };

    this.fatal = (...args) => {
        this.generalManager.fatal(args);
    };

    this.error = (...args) => {
        this.generalManager.error(args);
    };

    this.debug = (...args) => {
        this.generalManager.debug(args);
    };

    this.warn = (...args) => {
        this.generalManager.warn(args);
    };
};

function ReportLoggerManager(stream) {
    "use strict";
    let options = {
        name: 'Report', 
        level: 'info', 
        child: {
            logType: 'report',
            logSystemID: process.env.CLUSTER_SYSTEM_ID || CLUSTER_DEF_SYSTEM_ID
        }
    }

    if (stream) {
        options.stream = stream;
    }

    this.generalManager = new GenericLoggerManager(options);

    this.report = (...args) => {
        this.generalManager.info(args);
    }
}

const getSyslogLevel = (level) => {
     const l = checkLevelExists(level) || Log.ERROR;
     switch (l) {
         case Log.FATAL:
             return 'emerg';
         case Log.ERROR:
             return 'error';
         case Log.WARN:
             return 'warn';
         case Log.INFO:
             return 'info';
         default:
             return "debug";
     }
};

function SysLoggerManager(options) {
    "use strict";
    const EsStream = require('es-stream');
    this.syslogOptions = options || {};

    this.esHost = this.syslogOptions.host || 'localhost';
    this.esPort = this.syslogOptions.port || 9200;

    this.syslogOptions.stream = new EsStream({
        node: `http://${this.esHost}:${this.esPort}`,
        host: `http://${this.esHost}:${this.esPort}`,
        templateName: options.templateName || "reports",
        apiVersion: "7.0",
        logSystemID: process.env.CLUSTER_SYSTEM_ID || CLUSTER_DEF_SYSTEM_ID
    })

    this.syslogOptions.stream.type = 'raw';
    this.syslogOptions.stream.raw = true;

    this.generalManager = new GenericLoggerManager(this.syslogOptions);

    this.info = (...args) => {
        this.generalManager.info(args);
    };

    this.trace = (...args) => {
        this.generalManager.trace(args);
    };

    this.fatal = (...args) => {
        this.generalManager.fatal(args);
    };

    this.error = (...args) => {
        this.generalManager.error(args);
    };

    this.debug = (...args) => {
        this.generalManager.debug(args);
    };

    this.warn = (...args) => {
        this.generalManager.warn(args);
    };

}

module.exports.flow = (options) => {
    "use strict";
    return new FlowLoggerManager(options);
};

function SecurityLoggerManager(options) {
    "use strict";
    this.flowOptions = options || {};
    this.flowOptions.child = {
        logType: 'security',
        logSystemID: process.env.CLUSTER_SYSTEM_ID || CLUSTER_DEF_SYSTEM_ID
    };
    this.generalManager = new GenericLoggerManager(this.flowOptions);

    this.info = (...args) => {
        this.generalManager.info(args);
    };

    this.trace = (...args) => {
        this.generalManager.trace(args);
    };

    this.fatal = (...args) => {
        this.generalManager.fatal(args);
    };

    this.error = (...args) => {
        this.generalManager.error(args);
    };

    this.debug = (...args) => {
        this.generalManager.debug(args);
    };

    this.warn = (...args) => {
        this.generalManager.warn(args);
    };

};

module.exports.security = (options) => {
    "use strict";
    return new SecurityLoggerManager(options);
};

function PerformanceLoggerManager(options) {
    "use strict";
    this.flowOptions = options || {};
    this.flowOptions.child = {
        logType: 'performance',
        logSystemID: process.env.CLUSTER_SYSTEM_ID || CLUSTER_DEF_SYSTEM_ID
    };
    this.generalManager = new GenericLoggerManager(this.flowOptions);

    this.info = (...args) => {
        this.generalManager.info(args);
    };

    this.trace = (...args) => {
        this.generalManager.trace(args);
    };

    this.fatal = (...args) => {
        this.generalManager.fatal(args);
    };

    this.error = (...args) => {
        this.generalManager.error(args);
    };

    this.debug = (...args) => {
        this.generalManager.debug(args);
    };

    this.warn = (...args) => {
        this.generalManager.warn(args);
    };

};

module.exports.performance = (options) => {
    "use strict";
    return new PerformanceLoggerManager(options);
};

/**
 * Check if level is exists if not return empty.
 * Then logger will be created with INFO level
 * @param level => bunyan log level
 */
const checkLevelExists = (level) => {
    "use strict";
    let log_level = undefined;
    if(typeof level === 'string') {
        log_level = _.filter(Object.keys(legal_log_levels), (l) => {
            return level.toLowerCase() === l;
        });
    }

    if(typeof level === 'number') {
        log_level = _.filter(_.values(legal_log_levels), (ln) => {
            return ln === level;
        });
    }

    if(Array.isArray(log_level) && log_level.length > 0) {
        return log_level[0];
    }

    if(Array.isArray(log_level)) {
        return undefined;
    }

    return log_level;
};

let Flow = undefined;
let Security = undefined;
let Performance = undefined;
let Reports = undefined;
let Syslog = undefined;
let moduleOptions = {};

module.exports.logger = {
    setOptions(options) {
        "use strict";
        moduleOptions.flowOptions = options;
        moduleOptions.securityOptions = options;
        moduleOptions.performanceOptions = options;
        moduleOptions.syslogOptions = options;
        Flow = undefined;
        Security = undefined;
        Performance = undefined;
        Syslog = undefined;

        if(options.stream) {
            moduleOptions.stream = options.stream;
            Reports = undefined;
        }
    },

    setFlowOptions(options) {
        "use strict";
        moduleOptions.flowOptions = options;
        Flow = undefined;
    },

    setPerformanceOptions(options) {
        "use strict";
        moduleOptions.performanceOptions = options;
        Performance = undefined;
    },


    setSecurityOptions(options) {
        "use strict";
        moduleOptions.securityOptions = options;
        Security = undefined;
    },

    setSyslogOptions(options) {
        "use strict";
        moduleOptions.syslogOptions = options;
        Syslog = undefined;
    },


    get flow() {
        "use strict";
        if( Flow == undefined ) {
            Flow = new FlowLoggerManager(moduleOptions.flowOptions);
        }

        return Flow;
    },

    get security() {
        "use strict";
        if(Security == undefined) {
            Security = new SecurityLoggerManager(moduleOptions.securityOptions);
        }

        return Security;
    },


    get performance() {
        "use strict";

        if(Performance == undefined) {
            Performance = new PerformanceLoggerManager(moduleOptions.performanceOptions);
        }

        return Performance;
    },

    get report() {
        "use strict";
        if(Reports == undefined) {
            Reports = new ReportLoggerManager(moduleOptions.stream);
        }

        return Reports;
    },

    get syslog() {
       "use strict";
       if(Syslog == undefined) {
           Syslog = new SysLoggerManager(moduleOptions.syslogOptions);
       }

       return Syslog;
    }
};