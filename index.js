const isImmuRecord = "$$__IMMUTABLE_RECORD__$$";
const isImmuList = "$$__IMMUTABLE_LIST__$$";
const isImmuMap = "$$__IMMUTABLE_MAP__$$";
const isImmuSet = "$$__IMMUTABLE_SET__$$";
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
        } else if(Immutable.Record.isRecord(immu)){
            immu = immu.toObject();
            immu[isImmuRecord] = true;
        } else if(Immutable.Set.isSet(immu)){
            immu = immu.toArray();
            immu.push(isImmuSet);
        }
        Object.keys(immu).forEach(function(key){
            if(typeof immu[key] !== "function")
                immu[key] = prepare(immu[key]);
        });
        return immu;
    }
    return JSON.stringify(prepare(immu),function(key, value){
        if (value instanceof RegExp) {
            return '_PxEgEr_' + value;
        }
        return value;
    })
}

function hydrateImmutable(immu){
    const iso8061 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;
    const dehydrated = JSON.parse(immu,function(key, value){
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
        else if(immu instanceof Array) {
            if(immu[immu.length-1] === isImmuList){
                immu.pop();
                immu = Immutable.List(immu.map(revive));
            } else if(immu[immu.length-1] === isImmuSet){
                immu.pop();
                immu = Immutable.Set(immu.map(revive));
            }
        }
        Object.keys(immu).forEach(function(key){
            immu[key] = revive(immu[key])
        });
        if(immu[isImmuMap]) {
            delete immu[isImmuMap];
            immu = Immutable.Map(immu);
        }
        if(immu[isImmuRecord]){
            delete immu[isImmuRecord];
            const Rec = Immutable.Record(immu);
            immu = new Rec();
        }
        return immu;
    }
    return revive(dehydrated)
}

module.exports = {
    dehydrateImmutable:dehydrateImmutable,
    hydrateImmutable:hydrateImmutable
};