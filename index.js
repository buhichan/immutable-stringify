const isImmuRecord = "$$__IMMUTABLE_RECORD__$$";
const isImmuList = "$$__IMMUTABLE_LIST__$$";
const isImmuMap = "$$__IMMUTABLE_MAP__$$";

const Immutable = require('immutable');

function dehydrateImmutable(immu){ //Support Only Record, Map and List
    function prepare(immu){
        if(['number','string','undefined','boolean','symbol'].indexOf(typeof immu)>=0 || immu === null)
            return immu;
        else if(Immutable.List.isList(immu)){
            immu = immu.toArray();
            immu.push(isImmuList)
        } else if(Immutable.Map.isMap(immu)) {
            immu = (immu).toObject();
            immu[isImmuMap] = true;
        } else if(immu.__proto__ instanceof Immutable.Record){
            immu = immu.toObject();
            immu[isImmuRecord] = true;
        }
        Object.keys(immu).forEach(key=>{
            immu[key] = prepare(immu[key]);
        });
        return immu;
    }
    return JSON.stringify(prepare(immu),(key, value)=>{
        if (value instanceof RegExp) {
            return '_PxEgEr_' + value;
        }
        return value;
    })
}

function hydrateImmutable(immu){
    const iso8061 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;
    const dehydrated = JSON.parse(immu,(key, value)=>{
        if (typeof value != 'string') {
            return value;
        }
        if (value.length < 8) {
            return value;
        }

        const prefix = value.substring(0, 8);

        if (iso8061 && value.match(iso8061)) {
            return new Date(value);
        }
        if (prefix === '_PxEgEr_') {
            return eval(value.slice(8));
        }

        return value;
    });
    function revive(immu){
        if(['number','string','undefined','boolean','symbol'].indexOf(typeof immu)>=0 || immu === null)
            return immu;
        else if(immu instanceof Array && immu[immu.length-1] === isImmuList) {
            immu.pop();
            immu = Immutable.List(immu.map(revive));
        }
        Object.keys(immu).forEach(key=>{
            immu[key] = revive(immu[key])
        });
        if(immu[isImmuMap]) {
            delete immu[isImmuMap];
            immu = Immutable.Map(immu);
        }
        if(immu[isImmuRecord]){
            delete immu[isImmuRecord];
            const Rec = Record(immu);
            immu = new Rec();
        }
        return immu;
    }
    return revive(dehydrated)
}

module.exports = {
    dehydrateImmutable,
    hydrateImmutable
}