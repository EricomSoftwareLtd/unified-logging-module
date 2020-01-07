
const assert = require('assert');
const util = require('util');
const lib = require('../index');
const streams = require('memory-streams');
const _ = require('underscore');



describe("Logger tests", () => {
    "use strict";
    it("make and test simple print", () => {
        const stream = new streams.WritableStream();
        const flow = lib.flow(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        flow.info("Hello test");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.ok(logObject.msg == 'Hello test');
    });

    it('should write flow log', () => {
        let stream = new streams.WritableStream();
        const flow = lib.flow(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        flow.info("Hello test");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.ok(logObject.logType == 'flow');
    });

    it('should write security log', () => {
        let stream = new streams.WritableStream();
        const sec = lib.security(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        sec.info("Hello test");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.ok(logObject.logType == 'security');
    });

    it('should write performance log', () => {
        let stream = new streams.WritableStream();
        const perf = lib.performance(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        perf.info("Hello test");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.ok(logObject.logType == 'performance');
    });

    it('should print object', () => {
        let stream = new streams.WritableStream();
        const perf = lib.performance(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        perf.info({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.ok(logObject.logType == 'performance');
    });

    it('should test debug function for flow', () => {
        let stream = new streams.WritableStream();
        const flow = lib.flow(
            {
                name:'test',
                level:'debug',
                stream: stream
            });
        flow.debug({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'flow', 'Must be flow child');
        assert.equal(logObject.level, 20, 'Must be debug level')
    });

    it('should test trace function for flow', () => {
        let stream = new streams.WritableStream();
        const flow = lib.flow(
            {
                name:'test',
                level:'trace',
                stream: stream
            });
        flow.trace({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'flow', 'Must be flow child');
        assert.equal(logObject.level, 10, 'Must be trace level')
    });

    it('should test warn function for flow', () => {
        let stream = new streams.WritableStream();
        const flow = lib.flow(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        flow.warn({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'flow', 'Must be flow child');
        assert.equal(logObject.level, 40, 'Must be warn level')
    });

    it('should test error function for flow', () => {
        let stream = new streams.WritableStream();
        const flow = lib.flow(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        flow.error({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'flow', 'Must be flow child');
        assert.equal(logObject.level, 50, 'Must be error level')
    });

    it('should test fatal function for flow', () => {
        let stream = new streams.WritableStream();
        const flow = lib.flow(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        flow.fatal({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'flow', 'Must be flow child');
        assert.equal(logObject.level, 60, 'Must be fatal level')
    });

    it('should test debug function for security', () => {
        let stream = new streams.WritableStream();
        const sec = lib.security(
            {
                name:'test',
                level:'debug',
                stream: stream
            });
        sec.debug({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'security', 'Must be flow child');
        assert.equal(logObject.level, 20, 'Must be debug level')
    });

    it('should test trace function for security', () => {
        let stream = new streams.WritableStream();
        const sec = lib.security(
            {
                name:'test',
                level:'trace',
                stream: stream
            });
        sec.trace({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'security', 'Must be flow child');
        assert.equal(logObject.level, 10, 'Must be trace level')
    });

    it('should test warn function for security', () => {
        let stream = new streams.WritableStream();
        const sec = lib.security(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        sec.warn({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'security', 'Must be flow child');
        assert.equal(logObject.level, 40, 'Must be warn level')
    });

    it('should test error function for security', () => {
        let stream = new streams.WritableStream();
        const sec = lib.security(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        sec.error({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'security', 'Must be flow child');
        assert.equal(logObject.level, 50, 'Must be error level')
    });

    it('should test fatal function for security', () => {
        let stream = new streams.WritableStream();
        const sec = lib.security(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        sec.fatal({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'security', 'Must be flow child');
        assert.equal(logObject.level, 60, 'Must be fatal level')
    });

    it('should test debug function for performance', () => {
        let stream = new streams.WritableStream();
        const p = lib.performance(
            {
                name:'test',
                level:'debug',
                stream: stream
            });
        p.debug({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'performance', 'Must be flow child');
        assert.equal(logObject.level, 20, 'Must be debug level')
    });

    it('should test trace function for performance', () => {
        let stream = new streams.WritableStream();
        const p = lib.performance(
            {
                name:'test',
                level:'trace',
                stream: stream
            });
        p.trace({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'performance', 'Must be flow child');
        assert.equal(logObject.level, 10, 'Must be trace level')
    });

    it('should test warn function for performance', () => {
        let stream = new streams.WritableStream();
        const p = lib.performance(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        p.warn({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'performance', 'Must be flow child');
        assert.equal(logObject.level, 40, 'Must be warn level')
    });

    it('should test error function for performance', () => {
        let stream = new streams.WritableStream();
        const p = lib.performance(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        p.error({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'performance', 'Must be flow child');
        assert.equal(logObject.level, 50, 'Must be error level')
    });

    it('should test fatal function for performance', () => {
        let stream = new streams.WritableStream();
        const p = lib.performance(
            {
                name:'test',
                level:'info',
                stream: stream
            });
        p.fatal({key: 'test log', value: 'Hello test'}, "regular message");
        const text = stream.toString();
        const logObject = JSON.parse(text);
        assert.equal(logObject.logType, 'performance', 'Must be flow child');
        assert.equal(logObject.level, 60, 'Must be fatal level')
    });
});

describe('Module tests', () => {
    "use strict";
    it('should get flow log and print message to stream', () => {
        let stream = new streams.WritableStream();
        lib.logger.setOptions({
            name:'test',
            level:'info',
            stream: stream
        });
        lib.logger.flow.info({"Hello":"World"});
        const text = stream.toString();
        const logObject = JSON.parse(text);

        assert.equal(logObject.Hello, "World", 'Wrong message reseived');
        assert.equal(logObject.logType, "flow", "Wrong log type")
    });

    it('should get security log and print message to stream', () => {
        let stream = new streams.WritableStream();
        lib.logger.setOptions({
            name:'test',
            level:'info',
            stream: stream
        });
        lib.logger.security.info({"Hello":"World"});
        const text = stream.toString();
        const logObject = JSON.parse(text);

        assert.equal(logObject.Hello, "World", 'Wrong message reseived');
        assert.equal(logObject.logType, "security", "Wrong log type")
    });

    it('should get performance log and print message to stream', () => {
        let stream = new streams.WritableStream();
        lib.logger.setOptions({
            name:'test',
            level:'info',
            stream: stream
        });
        lib.logger.performance.info({"Hello":"World"});
        const text = stream.toString();
        const logObject = JSON.parse(text);

        assert.equal(logObject.Hello, "World", 'Wrong message reseived');
        assert.equal(logObject.logType, "performance", "Wrong log type")
    });

    it('should get report and print message to stream', () => {
        let stream = new streams.WritableStream();
        lib.logger.setOptions({
            name:'test',
            level:'info',
            stream: stream
        });
        lib.logger.report.report({"Hello":"World"});
        const text = stream.toString();
        const logObject = JSON.parse(text);

        assert.equal(logObject.Hello, "World", 'Wrong message reseived');
        assert.equal(logObject.logType, "report", "Wrong log type")
    });

    it('should create flow log with wrong level', () => {
        let stream = new streams.WritableStream();
        lib.logger.setOptions(
            {
                name: 'test wrong level',
                level: 'bla bla',
                stream: stream
            }
        );

        lib.logger.flow.info("Hello wrong level");
    });

    it('should create log when log level given as number', () => {
        let stream = new streams.WritableStream();
        lib.logger.setOptions({
            name:'test',
            level:30,
            stream: stream
        });
        lib.logger.flow.info({"Hello":"World"});
        const text = stream.toString();
        const logObject = JSON.parse(text);

        assert.equal(logObject.Hello, "World", 'Wrong message reseived');
        assert.equal(logObject.logType, "flow", "Wrong log type")
    });

    it('shoul test system bunyan fields when send json object issue #690', () => {
        let stream = new streams.WritableStream();
        lib.logger.setOptions({
            name:'test',
            level:30,
            stream: stream
        });

        lib.logger.flow.info({test1: "test1", test2: {test: "1"}, "type": "data"});

        const text = stream.toString();

        console.log(text);
    });
});


describe('Options Reload tests', () => {
    "use strict";
    it('should check different levels in different endpoints', () => {
        let stream = new streams.WritableStream();
        lib.logger.setFlowOptions({
            name:'flowTest',
            level:'error',
            stream: stream
        });

        lib.logger.setSecurityOptions({
            name:'securityTest',
            level:'info',
            stream: stream
        });

        lib.logger.setPerformanceOptions({
            name:'performanceTest',
            level:'debug',
            stream: stream
        });


        lib.logger.performance.debug("test ");
        lib.logger.flow.error("test ");
        lib.logger.security.info(" test");
        let text = stream.toString();
        text = text.replace(/\n/g,',');
        let obj = JSON.parse('[' + text.substr(0, text.length - 1) + ']');
        let sorted = _.sortBy(obj, (item) => {return item.level});
        assert.ok(sorted[0].name == 'performanceTest' && sorted[1].name == 'securityTest' && sorted[2].name == 'flowTest');
    });

    it('should test reload options correct', () => {
        let stream = new streams.WritableStream();

        lib.logger.setOptions({
            name: 'fake'
        });

        lib.logger.performance.debug("test ");
        lib.logger.flow.error("test ");
        lib.logger.security.info(" test");

        lib.logger.setFlowOptions({
            name:'flowTest',
            level:'error',
            stream: stream
        });

        lib.logger.setSecurityOptions({
            name:'securityTest',
            level:'info',
            stream: stream
        });

        lib.logger.setPerformanceOptions({
            name:'performanceTest',
            level:'debug',
            stream: stream
        });

        lib.logger.performance.debug("test ");
        lib.logger.flow.error("test ");
        lib.logger.security.info(" test");
        let text = stream.toString();
        text = text.replace(/\n/g,',');
        let obj = JSON.parse('[' + text.substr(0, text.length - 1) + ']');
        let sorted = _.sortBy(obj, (item) => {return item.level});
        assert.ok(sorted[0].name == 'performanceTest' && sorted[1].name == 'securityTest' && sorted[2].name == 'flowTest');
    });

    it('should test that report continue write on info level', () => {
        let stream = new streams.WritableStream();

        lib.logger.setOptions({
            name: 'fake',
            level: "fatal",
            stream: stream
        });

        lib.logger.report.report("Any value", {test: "Test of report"}, {more: "Of nay value"});

        const text = stream.toString();

        const obj = JSON.parse(text);

        assert.ok(obj.level == 30, 'Wrong level for report');
    });
});

describe("Logger child tests", () => {
    it('should write log via client child', () => {
        let stream = new streams.WritableStream();


    });
});

describe("Test syslog write to elasticsearch", () => {
    describe("Long running test", () => {
        it("shoud write logs during 10 seconds and stop after this", function(done) {
            lib.logger.setSyslogOptions({
                level: "debug"
            });
            this.timeout(20000);
            const interval = setInterval(function(){
                for(var i = 0; i < 100; i++) {
                    lib.logger.syslog.info({name: "aaaa", message: "bbbbb"});
                }
            }, 200);

            setTimeout(function(){
                clearInterval(interval);
                done();
            }, 11000);
        });
    });
});