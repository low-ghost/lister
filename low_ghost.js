//small functions I find useful
var low_ghost = (function(){
    return {
        is : function(){
            var i = arguments.length;
            while (i--){
                if(typeof arguments[i] === 'undefined' || arguments[i] == null){
                    return false;
                }
            }
            return true;
        },
        isArray  : function(value) {
          return value && typeof value == 'object' && typeof value.length == 'number' &&
            toString.call(value) == arrayClass || false;
        },
        contains : function(arr1, query, opt){
            var q = false;
            if(low_ghost.is(arr1, query)){
                if (Array.isArray(arr1)){
                    q = query[0];
                }
                var q1 = q && q || query;
                if (q1 instanceof RegExp || (typeof q1 === "string" && /\/*\//.test(q1))){  /*what's that test doing again?*/
                    var l = arr1.length;
                    for (var i = 0; i < arr1.length; i++){
                        if (arr1[i].match(q1)){
                            if (opt === "match"){
                                return arr1[i].match(q1)[0];
                            }
                            return i;
                        }
                    }
                }
                if (q){
                    low_ghost.contains(arr1, query.slice(1));
                }
                return !!~arr1.indexOf(query);
            }
        },
        popMatching : function (arr1, string) {
            var index = arr1.indexOf(string);
            if (index > -1) {
                arr1.splice(index, 1);
            }
        },
        nonRecursiveMatch : function (arr1, arr2) {
            if (arr2.length !== arr1.length){ return false; }
            var i = arr2.length;
            while (i--){ if (arr2[i] != arr1[i]){ return false; } }
            return true;
        },
        advSort : function(arr1, key, ord){
            return arr1.sort(
                function (a, b) {
                    var vA, vB;
                    vA = a.querySelector(key).textContent;
                    vB = b.querySelector(key).textContent;
                    if (ord === "asc"){
                        return (vA < vB) ? -1 : (vA > vB) ? 1 : 0;
                    } else if (ord === "desc") {
                        return (vA < vB) ? 1 : (vA > vB) ? -1 : 0;
                    }
                }
            );
        },
        getPrimary : function(obj1, primaryKey){
            var objKeys = Object.keys(obj1),
                primaryKeyIndex = objKeys.indexOf(primaryKey);
            return {
                pIndex : +primaryKeyIndex,
                accessor : obj1[objKeys[primaryKeyIndex]]
            };
        },
        //adds a row to an array where an object's primary key matches that of the array
        whereAdd : function(arr1, obj1, primaryKey){
            var objKeys = Object.keys(obj1),
                rowsToAdd = objKeys.length - 1,
                originalRows = arr1.length,
                pKey,
                regex = false;
            if(Array.isArray(primaryKey)){
                var regex = [];
                for (var i = 0; i < rowsToAdd; i++){
                    regex[i] = new RegExp(objKeys[i]);
                }
            }
            pKey = regex && low_ghost.contains(primaryKey, regex, "match") || primaryKey;
            pKey = low_ghost.getPrimary(obj1, pKey);
            for (var i = originalRows, end = rowsToAdd + originalRows; i < end; i++){
                arr1[i] = [];
                for (var j = 0; j < arr1[0].length; j++){ //TODO - calculate longest nested array
                    var index = arr1[pKey.pIndex].indexOf(pKey.accessor[j].toString().toLowerCase());
                    if (i !== pKey.pIndex){
                        arr1[i][index] = obj1[objKeys[i]][j].toString().toLowerCase();
                    } //warning: will add undefined elements if blanks exist
                }
            }
        },
        search : function(query, arr1, item){
            var output = [];
            if (!low_ghost.is(query)){
                throw new Error('query is undefined');
            }
            if (Array.isArray(arr1) && query.length > 0){
                if (Array.isArray(arr1[0])){
                    for (var j = 0, l = item.length; j < l; j++){
                        for (var i = 0; i < arr1.length; i++){
                            if (low_ghost.is(item[j])
                                && low_ghost.contains(arr1[i][j], query)
                                && !low_ghost.contains(output, item[j])){
                                output.push(item[j]);
                            }
                        }
                    }
                } else {
                    for (var j = 0, l = item.length; j < l; j++){
                        if (low_ghost.is(item[j])
                            && low_ghost.contains(arr1[j], query)
                            && !low_ghost.contains(output, item[j])){
                            output.push(item[j]);
                        }
                    }
                }
            } else if (query.length > 0){
                if ((arr1.indexOf(query) >= 0) && (output.indexOf(item) < 0)){
                    output.push(item);
                }
            } else { output = item.slice(); }
            return output;
        },
        template : function(html, data){
            var m,
                i = 0,
                match = html.match(data instanceof Array ? /{{\d+}}/g : /{{\w+}}/g) || [];
            while (m = match[i++]) {
                html = html.replace(m, data[m.substr(2, m.length - 4)]);
            }
            return html;
        },
        extendsString : function(String){
            String.prototype.toTitleCase = function(){
                return this.replace(/\w\S*/g,
                    function(str){
                        return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
                    }
                ).replace(/[.]\S/g, //handles abbreviations
                    function(str){
                        return "." + str.charAt(1).toUpperCase();
                    }
                );
            };
        }
    }
})();
low_ghost.extendsString(String); //gives low_ghost access to String.prototype
