const IPFSStorage = require('./IPFSStorage.js');
const Measurement = require('./Measurement.js');
let MeasurementsOffChain; 

class MeasurementsStorage {

	constructor(ipfsStorage, contractAddress){
		this.storage = ipfsStorage;
		if (this.contract){
			MeasurementsOffChain = artifacts.require("./protocol/Measurements/MeasurementsOffChain.sol");
			this.contract = MeasurementsOffChain.at(contractAddress);
		}
	}

	async addMeasurement(measurement){
		if (!this.storage.catalog){
			await this.storage.createCatalog();
		}
		await this.storage.addFile(JSON.stringify(measurement));
	}

	async getMeasurements(){
		if (!this.storage.catalog)
			return [];
		var measurements = (await this.storage.readAllData()).map((m)=>Object.assign(new Measurement(), JSON.parse(m)));
		if (!this.contract)
			return measurements;
		var encoded = await Measurement.encodeMultiple(measurements);
		if (!await this.contract.validateAddressList(encoded))
			throw new Error('No device on address list');
		if (!await this.contract.verifyHashes(encoded))
			throw new Error('Wrong hash or not signed');
		return measurements;
	}		
}

module.exports = MeasurementsStorage;