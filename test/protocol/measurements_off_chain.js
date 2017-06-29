"use strict";

const abi = require("../../lib/ABI.js");
const Measurement = require("../../lib/Measurement.js");
const testutils = require("../testutils.js");
const BigNumber = require('bignumber.js');
const Devices = artifacts.require("./protocol/Measurements/Devices.sol");
const MeasurementsOffChain = artifacts.require("./protocol/Measurements/MeasurementsOffChain.sol");


var measurementsContract;

contract('MeasurementsOffChain', function(accounts) {

    before('Deploy contracts', async () => {
        measurementsContract = await MeasurementsOffChain.new(Devices.new([accounts[1], accounts[2]]));
    });

    it("should serialize and deserialize measurements", async () => {
        var serialized = await measurementsContract.serializeMeasurement("Volume", 22, "delivery", 1491848127, "fmr01", "bch01", accounts[1], "");
        var deserialized = await measurementsContract.deserializeMeasurement(serialized);
        assert.equal(testutils.byte32toAscii(deserialized[0]), "Volume");                
        assert.equal(testutils.byte32toAscii(deserialized[2]), "delivery");        
        assert.equal(testutils.byte32toAscii(deserialized[4]), "fmr01");
        assert.equal(testutils.byte32toAscii(deserialized[5]), "bch01");         
        assert.deepEqual(deserialized[1].toNumber(), 22);
        assert.deepEqual(deserialized[3].toNumber(), 1491848127);
    });

    it("should calcualte hash for measurement", async () => { 
        var hash = await measurementsContract.hashMeasurement("Volume", 22, "delivery", 1491848127, "fmr01", "bch01", accounts[1]);
        var measurement = new Measurement("Volume", 22, "delivery", 1491848127, "fmr01", "bch01", accounts[1]);
        assert.equal(hash.substr(2, 64), measurement.hash());
    });

    it("should get data", async () => {
        var data = await measurementsContract.encodeMeasurements(
            ["Volume", "Color"],
            [22, 777],
            ["delivery", "shipping"],
            [1491848127,1491848135],
            ["fmr01", "fmr02"], 
            ["bch01", "bch02"],
            [accounts[1], accounts[2]],
            ["", ""]);
        var measurements = await measurementsContract.getMeasurements(data);
        let attributes = testutils.byte32ArraytoAsciiArray(measurements[0]);
        let values = measurements[1].map(e => e.toNumber());
        let events = testutils.byte32ArraytoAsciiArray(measurements[2]);
        let timestamps = measurements[3].map(e => e.toNumber());
        let farmer_codes = testutils.byte32ArraytoAsciiArray(measurements[4]);
        let batch_nos = testutils.byte32ArraytoAsciiArray(measurements[5]);
        assert.deepEqual(events, ["delivery", "shipping"]);
        assert.deepEqual(attributes, ["Volume", "Color"]);
        assert.deepEqual(values, [22, 777]);
        assert.deepEqual(timestamps, [1491848127,1491848135]);
        assert.deepEqual(farmer_codes, ["fmr01", "fmr02"]);
        assert.deepEqual(batch_nos, ["bch01", "bch02"]);
    });

});


